/*
 * Copyright (C) 2026 Noctis Contributors
 *
 * This file is part of Noctis.
 *
 * Noctis is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Noctis is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Noctis. If not, see <https://www.gnu.org/licenses/>.
 */

import {mapAuthSessionsToResponse} from '@noctis/api/src/auth/AuthModel';
import type {UserID} from '@noctis/api/src/BrandedTypes';
import {Config} from '@noctis/api/src/Config';
import type {IGatewayService} from '@noctis/api/src/infrastructure/IGatewayService';
import type {AuthSession} from '@noctis/api/src/models/AuthSession';
import type {User} from '@noctis/api/src/models/User';
import type {IUserRepository} from '@noctis/api/src/user/IUserRepository';
import {BotUserAuthSessionCreationDeniedError} from '@noctis/errors/src/domains/auth/BotUserAuthSessionCreationDeniedError';
import {requireClientIp} from '@noctis/ip_utils/src/ClientIp';
import type {AuthSessionResponse} from '@noctis/schema/src/domains/auth/AuthSchemas';
import {recordCounter} from '@noctis/telemetry/src/Metrics';

interface CreateAuthSessionParams {
	user: User;
	request: Request;
}

interface LogoutAuthSessionsParams {
	user: User;
	sessionIdHashes: Array<string>;
}

interface UpdateUserActivityParams {
	userId: UserID;
	clientIp: string;
}
export class AuthSessionService {
	constructor(
		private repository: IUserRepository,
		private gatewayService: IGatewayService,
		private generateAuthToken: () => Promise<string>,
		private getTokenIdHash: (token: string) => Uint8Array,
	) {}

	async createAuthSession({user, request}: CreateAuthSessionParams): Promise<[token: string, AuthSession]> {
		if (user.isBot) throw new BotUserAuthSessionCreationDeniedError();

		const now = new Date();
		const token = await this.generateAuthToken();
		const ip = requireClientIp(request, {
			trustCfConnectingIp: Config.proxy.trust_cf_connecting_ip,
		});

		const platformHeader = request.headers.get('x-noctis-platform')?.trim().toLowerCase() ?? null;
		const uaRaw = request.headers.get('user-agent') ?? '';
		const isDesktopClient = platformHeader === 'desktop';

		const authSession = await this.repository.createAuthSession({
			user_id: user.id,
			session_id_hash: Buffer.from(this.getTokenIdHash(token)),
			created_at: now,
			approx_last_used_at: now,
			client_ip: ip,
			client_user_agent: uaRaw || null,
			client_is_desktop: isDesktopClient,
			client_os: null,
			client_platform: null,
			version: 1,
		});

		recordCounter({
			name: 'auth.session.created',
			dimensions: {
				client_type: isDesktopClient ? 'desktop' : 'web',
			},
		});

		return [token, authSession];
	}

	async getAuthSessionByToken(token: string): Promise<AuthSession | null> {
		return this.repository.getAuthSessionByToken(Buffer.from(this.getTokenIdHash(token)));
	}

	async getAuthSessions(userId: UserID): Promise<Array<AuthSessionResponse>> {
		const authSessions = await this.repository.listAuthSessions(userId);
		return await mapAuthSessionsToResponse({authSessions});
	}

	async updateAuthSessionLastUsed(tokenHash: Uint8Array): Promise<void> {
		await this.repository.updateAuthSessionLastUsed(Buffer.from(tokenHash));

		recordCounter({
			name: 'auth.session.refreshed',
			dimensions: {},
		});
	}

	async updateUserActivity({userId, clientIp}: UpdateUserActivityParams): Promise<void> {
		await this.repository.updateUserActivity(userId, clientIp);
	}

	async revokeToken(token: string): Promise<void> {
		const tokenHash = Buffer.from(this.getTokenIdHash(token));
		const authSession = await this.repository.getAuthSessionByToken(tokenHash);
		if (!authSession) return;

		await this.repository.revokeAuthSession(tokenHash);

		recordCounter({
			name: 'auth.session.revoked',
			dimensions: {revoke_type: 'single'},
		});

		await this.gatewayService.terminateSession({
			userId: authSession.userId,
			sessionIdHashes: [Buffer.from(authSession.sessionIdHash).toString('base64url')],
		});
	}

	async logoutAuthSessions({user, sessionIdHashes}: LogoutAuthSessionsParams): Promise<void> {
		const hashes = sessionIdHashes.map((hash) => Buffer.from(hash, 'base64url'));
		await this.repository.deleteAuthSessions(user.id, hashes);

		recordCounter({
			name: 'auth.session.revoked',
			dimensions: {revoke_type: 'batch', count: sessionIdHashes.length.toString()},
		});

		await this.gatewayService.terminateSession({
			userId: user.id,
			sessionIdHashes,
		});
	}

	async terminateAllUserSessions(userId: UserID): Promise<void> {
		const authSessions = await this.repository.listAuthSessions(userId);
		if (authSessions.length === 0) return;

		const hashes = authSessions.map((s) => s.sessionIdHash);
		await this.repository.deleteAuthSessions(userId, hashes);

		recordCounter({
			name: 'auth.session.revoked',
			dimensions: {revoke_type: 'all', count: authSessions.length.toString()},
		});

		await this.gatewayService.terminateSession({
			userId,
			sessionIdHashes: authSessions.map((s) => Buffer.from(s.sessionIdHash).toString('base64url')),
		});
	}

	async terminateOtherSessions(userId: UserID, currentToken: string): Promise<void> {
		const currentHash = Buffer.from(this.getTokenIdHash(currentToken)).toString('base64url');
		const authSessions = await this.repository.listAuthSessions(userId);
		if (authSessions.length === 0) return;

		const hashesToRevoke = authSessions
			.map((s) => s.sessionIdHash)
			.filter((hash) => Buffer.from(hash).toString('base64url') !== currentHash);

		if (hashesToRevoke.length === 0) return;

		await this.repository.deleteAuthSessions(userId, hashesToRevoke);

		recordCounter({
			name: 'auth.session.revoked',
			dimensions: {revoke_type: 'others', count: hashesToRevoke.length.toString()},
		});

		await this.gatewayService.terminateSession({
			userId,
			sessionIdHashes: hashesToRevoke.map((hash) => Buffer.from(hash).toString('base64url')),
		});
	}

	async dispatchAuthSessionChange(params: {
		userId: UserID;
		oldAuthSessionIdHash: string;
		newAuthSessionIdHash: string;
		newToken: string;
	}): Promise<void> {
		const {userId, oldAuthSessionIdHash, newAuthSessionIdHash, newToken} = params;

		await this.gatewayService.dispatchPresence({
			userId,
			event: 'AUTH_SESSION_CHANGE',
			data: {
				old_auth_session_id_hash: oldAuthSessionIdHash,
				new_auth_session_id_hash: newAuthSessionIdHash,
				new_token: newToken,
			},
		});
	}
}
