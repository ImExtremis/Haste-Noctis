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

import {AuthEmailRevertService} from '@noctis/api/src/auth/services/AuthEmailRevertService';
import {AuthEmailService} from '@noctis/api/src/auth/services/AuthEmailService';
import {AuthLoginService} from '@noctis/api/src/auth/services/AuthLoginService';
import {AuthMfaService} from '@noctis/api/src/auth/services/AuthMfaService';
import {AuthPasswordService} from '@noctis/api/src/auth/services/AuthPasswordService';
import {AuthPhoneService} from '@noctis/api/src/auth/services/AuthPhoneService';
import {AuthRegistrationService} from '@noctis/api/src/auth/services/AuthRegistrationService';
import {AuthSessionService} from '@noctis/api/src/auth/services/AuthSessionService';
import {AuthUtilityService} from '@noctis/api/src/auth/services/AuthUtilityService';
import {createMfaTicket, type UserID} from '@noctis/api/src/BrandedTypes';
import type {IDiscriminatorService} from '@noctis/api/src/infrastructure/DiscriminatorService';
import type {IEmailDnsValidationService} from '@noctis/api/src/infrastructure/IEmailDnsValidationService';
import type {IGatewayService} from '@noctis/api/src/infrastructure/IGatewayService';
import type {KVAccountDeletionQueueService} from '@noctis/api/src/infrastructure/KVAccountDeletionQueueService';
import type {KVActivityTracker} from '@noctis/api/src/infrastructure/KVActivityTracker';
import type {SnowflakeService} from '@noctis/api/src/infrastructure/SnowflakeService';
import type {SnowflakeReservationService} from '@noctis/api/src/instance/SnowflakeReservationService';
import type {InviteService} from '@noctis/api/src/invite/InviteService';
import type {RequestCache} from '@noctis/api/src/middleware/RequestCacheMiddleware';
import type {AuthSession} from '@noctis/api/src/models/AuthSession';
import type {User} from '@noctis/api/src/models/User';
import type {BotMfaMirrorService} from '@noctis/api/src/oauth/BotMfaMirrorService';
import type {IUserRepository} from '@noctis/api/src/user/IUserRepository';
import type {UserContactChangeLogService} from '@noctis/api/src/user/services/UserContactChangeLogService';
import {randomString} from '@noctis/api/src/utils/RandomUtils';
import type {ICacheService} from '@noctis/cache/src/ICacheService';
import {UserAuthenticatorTypes} from '@noctis/constants/src/UserConstants';
import type {IEmailService} from '@noctis/email/src/IEmailService';
import {SessionTokenMismatchError} from '@noctis/errors/src/domains/auth/SessionTokenMismatchError';
import {InvalidTokenError} from '@noctis/errors/src/domains/core/InvalidTokenError';
import {UnknownUserError} from '@noctis/errors/src/domains/user/UnknownUserError';
import type {IRateLimitService} from '@noctis/rate_limit/src/IRateLimitService';
import type {
	AuthSessionResponse,
	EmailRevertRequest,
	ForgotPasswordRequest,
	LoginRequest,
	RegisterRequest,
	ResetPasswordRequest,
	VerifyEmailRequest,
} from '@noctis/schema/src/domains/auth/AuthSchemas';
import type {ISmsService} from '@noctis/sms/src/ISmsService';
import type {AuthenticationResponseJSON, RegistrationResponseJSON} from '@simplewebauthn/server';
import {seconds} from 'itty-time';

interface RegisterParams {
	data: RegisterRequest;
	request: Request;
	requestCache: RequestCache;
}

interface LoginParams {
	data: LoginRequest;
	request: Request;
	requestCache: RequestCache;
}

interface LoginMfaTotpParams {
	code: string;
	ticket: string;
	request: Request;
}

interface ForgotPasswordParams {
	data: ForgotPasswordRequest;
	request: Request;
}

interface ResetPasswordParams {
	data: ResetPasswordRequest;
	request: Request;
}

interface RevertEmailChangeParams {
	data: EmailRevertRequest;
	request: Request;
}

interface LogoutAuthSessionsParams {
	user: User;
	sessionIdHashes: Array<string>;
}

interface CreateAuthSessionParams {
	user: User;
	request: Request;
}

interface DispatchAuthSessionChangeParams {
	userId: UserID;
	oldAuthSessionIdHash: string;
	newAuthSessionIdHash: string;
	newToken: string;
}

interface VerifyPasswordParams {
	password: string;
	passwordHash: string;
}

interface VerifyMfaCodeParams {
	userId: UserID;
	mfaSecret: string;
	code: string;
	allowBackup?: boolean;
}

interface UpdateUserActivityParams {
	userId: UserID;
	clientIp: string;
}

interface ValidateAgeParams {
	dateOfBirth: string;
	minAge: number;
}

interface CheckEmailChangeRateLimitParams {
	userId: UserID;
}

interface IAuthService {
	verifyPassword(params: {password: string; passwordHash: string}): Promise<boolean>;
	getUserSession(requestCache: RequestCache, token: string): Promise<AuthSession>;
}

export class AuthService implements IAuthService {
	private sessionService: AuthSessionService;
	private passwordService: AuthPasswordService;
	private registrationService: AuthRegistrationService;
	private loginService: AuthLoginService;
	private emailService: AuthEmailService;
	private emailRevertService: AuthEmailRevertService;
	private phoneService: AuthPhoneService;
	private mfaService: AuthMfaService;
	private utilityService: AuthUtilityService;

	constructor(
		private repository: IUserRepository,
		inviteService: InviteService,
		private cacheService: ICacheService,
		gatewayService: IGatewayService,
		rateLimitService: IRateLimitService,
		emailServiceDep: IEmailService,
		emailDnsValidationService: IEmailDnsValidationService,
		smsService: ISmsService,
		snowflakeService: SnowflakeService,
		snowflakeReservationService: SnowflakeReservationService,
		discriminatorService: IDiscriminatorService,
		private kvAccountDeletionQueue: KVAccountDeletionQueueService,
		kvActivityTracker: KVActivityTracker,
		private readonly contactChangeLogService: UserContactChangeLogService,
		botMfaMirrorService?: BotMfaMirrorService,
		authMfaService?: AuthMfaService,
	) {
		this.utilityService = new AuthUtilityService(repository, rateLimitService);

		this.sessionService = new AuthSessionService(
			repository,
			gatewayService,
			this.utilityService.generateAuthToken.bind(this.utilityService),
			this.utilityService.getTokenIdHash.bind(this.utilityService),
		);

		this.passwordService = new AuthPasswordService(
			repository,
			emailServiceDep,
			emailDnsValidationService,
			rateLimitService,
			this.utilityService.generateSecureToken.bind(this.utilityService),
			this.utilityService.handleBanStatus.bind(this.utilityService),
			this.utilityService.assertNonBotUser.bind(this.utilityService),
			this.createMfaTicketResponse.bind(this),
			this.sessionService.createAuthSession.bind(this.sessionService),
		);

		this.mfaService =
			authMfaService ?? new AuthMfaService(repository, cacheService, smsService, gatewayService, botMfaMirrorService);

		this.registrationService = new AuthRegistrationService(
			repository,
			inviteService,
			rateLimitService,
			emailServiceDep,
			emailDnsValidationService,
			snowflakeService,
			snowflakeReservationService,
			discriminatorService,
			kvActivityTracker,
			cacheService,
			this.passwordService.hashPassword.bind(this.passwordService),
			this.passwordService.isPasswordPwned.bind(this.passwordService),
			this.utilityService.validateAge.bind(this.utilityService),
			this.utilityService.generateSecureToken.bind(this.utilityService),
			this.sessionService.createAuthSession.bind(this.sessionService),
		);

		this.loginService = new AuthLoginService(
			repository,
			inviteService,
			cacheService,
			rateLimitService,
			emailServiceDep,
			kvAccountDeletionQueue,
			this.passwordService.verifyPassword.bind(this.passwordService),
			this.utilityService.handleBanStatus.bind(this.utilityService),
			this.utilityService.assertNonBotUser.bind(this.utilityService),
			this.sessionService.createAuthSession.bind(this.sessionService),
			this.utilityService.generateSecureToken.bind(this.utilityService),
			this.mfaService.verifyMfaCode.bind(this.mfaService),
			this.mfaService.verifySmsMfaCode.bind(this.mfaService),
			this.mfaService.verifyWebAuthnAuthentication.bind(this.mfaService),
		);

		this.emailService = new AuthEmailService(
			repository,
			emailServiceDep,
			gatewayService,
			rateLimitService,
			this.utilityService.assertNonBotUser.bind(this.utilityService),
			this.utilityService.generateSecureToken.bind(this.utilityService),
		);

		this.emailRevertService = new AuthEmailRevertService(
			repository,
			emailServiceDep,
			gatewayService,
			this.passwordService.hashPassword.bind(this.passwordService),
			this.passwordService.isPasswordPwned.bind(this.passwordService),
			this.utilityService.handleBanStatus.bind(this.utilityService),
			this.utilityService.assertNonBotUser.bind(this.utilityService),
			this.utilityService.generateSecureToken.bind(this.utilityService),
			this.sessionService.createAuthSession.bind(this.sessionService),
			this.sessionService.terminateAllUserSessions.bind(this.sessionService),
			this.contactChangeLogService!,
		);

		this.phoneService = new AuthPhoneService(
			repository,
			smsService,
			gatewayService,
			this.utilityService.assertNonBotUser.bind(this.utilityService),
			this.utilityService.generateSecureToken.bind(this.utilityService),
			this.contactChangeLogService!,
		);
	}

	async register({data, request, requestCache}: RegisterParams): Promise<{user_id: string; token: string}> {
		return this.registrationService.register({data, request, requestCache});
	}

	async login({
		data,
		request,
		requestCache: _requestCache,
	}: LoginParams): Promise<
		| {user_id: string; token: string}
		| {mfa: true; ticket: string; allowed_methods: Array<string>; sms_phone_hint: string | null}
	> {
		return this.loginService.login({data, request});
	}

	async loginMfaTotp({code, ticket, request}: LoginMfaTotpParams): Promise<{user_id: string; token: string}> {
		return this.loginService.loginMfaTotp({code, ticket, request});
	}

	async loginMfaSms({
		code,
		ticket,
		request,
	}: {
		code: string;
		ticket: string;
		request: Request;
	}): Promise<{user_id: string; token: string}> {
		return this.loginService.loginMfaSms({code, ticket, request});
	}

	async loginMfaWebAuthn({
		response,
		challenge,
		ticket,
		request,
	}: {
		response: AuthenticationResponseJSON;
		challenge: string;
		ticket: string;
		request: Request;
	}): Promise<{user_id: string; token: string}> {
		return this.loginService.loginMfaWebAuthn({response, challenge, ticket, request});
	}

	async forgotPassword({data, request}: ForgotPasswordParams): Promise<void> {
		return this.passwordService.forgotPassword({data, request});
	}

	async resetPassword({data, request}: ResetPasswordParams): Promise<
		| {user_id: string; token: string}
		| {
				mfa: true;
				ticket: string;
				allowed_methods: Array<string>;
				sms_phone_hint: string | null;
				sms: boolean;
				totp: boolean;
				webauthn: boolean;
		  }
	> {
		return this.passwordService.resetPassword({data, request});
	}

	async revertEmailChange({data, request}: RevertEmailChangeParams): Promise<{user_id: string; token: string}> {
		return this.emailRevertService.revertEmailChange({
			token: data.token,
			password: data.password,
			request,
		});
	}

	async issueEmailRevertToken(user: User, previousEmail: string, newEmail: string): Promise<void> {
		return this.emailRevertService.issueRevertToken({user, previousEmail, newEmail});
	}

	async hashPassword(password: string): Promise<string> {
		return this.passwordService.hashPassword(password);
	}

	async verifyPassword({password, passwordHash}: VerifyPasswordParams): Promise<boolean> {
		return this.passwordService.verifyPassword({password, passwordHash});
	}

	async isPasswordPwned(password: string): Promise<boolean> {
		return this.passwordService.isPasswordPwned(password);
	}

	async verifyEmail(data: VerifyEmailRequest): Promise<boolean> {
		return this.emailService.verifyEmail(data);
	}

	async resendVerificationEmail(user: User): Promise<void> {
		return this.emailService.resendVerificationEmail(user);
	}

	async getAuthSessionByToken(token: string): Promise<AuthSession | null> {
		return this.sessionService.getAuthSessionByToken(token);
	}

	async getAuthSessions(userId: UserID): Promise<Array<AuthSessionResponse>> {
		return this.sessionService.getAuthSessions(userId);
	}

	async createAdditionalAuthSessionFromToken({
		token,
		expectedUserId,
		request,
	}: {
		token: string;
		expectedUserId?: string;
		request: Request;
	}): Promise<{token: string; userId: string}> {
		const existingSession = await this.sessionService.getAuthSessionByToken(token);

		if (!existingSession) {
			throw new InvalidTokenError();
		}

		const user = await this.repository.findUnique(existingSession.userId);
		if (!user) {
			throw new UnknownUserError();
		}

		if (expectedUserId && user.id.toString() !== expectedUserId) {
			throw new SessionTokenMismatchError();
		}

		const [newToken] = await this.sessionService.createAuthSession({user, request});

		return {token: newToken, userId: user.id.toString()};
	}

	async createAuthSession({user, request}: CreateAuthSessionParams): Promise<[token: string, AuthSession]> {
		return this.sessionService.createAuthSession({user, request});
	}

	async updateAuthSessionLastUsed(tokenHash: Uint8Array): Promise<void> {
		return this.sessionService.updateAuthSessionLastUsed(tokenHash);
	}

	async updateUserActivity({userId, clientIp}: UpdateUserActivityParams): Promise<void> {
		return this.sessionService.updateUserActivity({userId, clientIp});
	}

	async revokeToken(token: string): Promise<void> {
		return this.sessionService.revokeToken(token);
	}

	async logoutAuthSessions({user, sessionIdHashes}: LogoutAuthSessionsParams): Promise<void> {
		return this.sessionService.logoutAuthSessions({user, sessionIdHashes});
	}

	async terminateAllUserSessions(userId: UserID): Promise<void> {
		return this.sessionService.terminateAllUserSessions(userId);
	}

	async terminateOtherSessions(userId: UserID, currentToken: string): Promise<void> {
		return this.sessionService.terminateOtherSessions(userId, currentToken);
	}

	async dispatchAuthSessionChange({
		userId,
		oldAuthSessionIdHash,
		newAuthSessionIdHash,
		newToken,
	}: DispatchAuthSessionChangeParams): Promise<void> {
		return this.sessionService.dispatchAuthSessionChange({
			userId,
			oldAuthSessionIdHash,
			newAuthSessionIdHash,
			newToken,
		});
	}

	async getUserSession(_requestCache: RequestCache, token: string): Promise<AuthSession> {
		const session = await this.getAuthSessionByToken(token);
		if (!session) {
			throw new InvalidTokenError();
		}
		return session;
	}

	async sendPhoneVerificationCode(phone: string, userId: UserID | null): Promise<void> {
		return this.phoneService.sendPhoneVerificationCode(phone, userId);
	}

	async verifyPhoneCode(phone: string, code: string, userId: UserID | null): Promise<string> {
		return this.phoneService.verifyPhoneCode(phone, code, userId);
	}

	async addPhoneToAccount(userId: UserID, phoneToken: string): Promise<void> {
		return this.phoneService.addPhoneToAccount(userId, phoneToken);
	}

	async removePhoneFromAccount(userId: UserID): Promise<void> {
		return this.phoneService.removePhoneFromAccount(userId);
	}

	async verifyMfaCode({userId, mfaSecret, code, allowBackup = false}: VerifyMfaCodeParams): Promise<boolean> {
		return this.mfaService.verifyMfaCode({userId, mfaSecret, code, allowBackup});
	}

	async enableSmsMfa(userId: UserID): Promise<void> {
		return this.mfaService.enableSmsMfa(userId);
	}

	async disableSmsMfa(userId: UserID): Promise<void> {
		return this.mfaService.disableSmsMfa(userId);
	}

	async sendSmsMfaCode(userId: UserID): Promise<void> {
		return this.mfaService.sendSmsMfaCode(userId);
	}

	async sendSmsMfaCodeForTicket(ticket: string): Promise<void> {
		return this.mfaService.sendSmsMfaCodeForTicket(ticket);
	}

	async verifySmsMfaCode(userId: UserID, code: string): Promise<boolean> {
		return this.mfaService.verifySmsMfaCode(userId, code);
	}

	async generateWebAuthnRegistrationOptions(userId: UserID) {
		return this.mfaService.generateWebAuthnRegistrationOptions(userId);
	}

	async verifyWebAuthnRegistration(
		userId: UserID,
		response: RegistrationResponseJSON,
		expectedChallenge: string,
		name: string,
	): Promise<void> {
		return this.mfaService.verifyWebAuthnRegistration(userId, response, expectedChallenge, name);
	}

	async deleteWebAuthnCredential(userId: UserID, credentialId: string): Promise<void> {
		return this.mfaService.deleteWebAuthnCredential(userId, credentialId);
	}

	async renameWebAuthnCredential(userId: UserID, credentialId: string, name: string): Promise<void> {
		return this.mfaService.renameWebAuthnCredential(userId, credentialId, name);
	}

	async generateWebAuthnAuthenticationOptionsDiscoverable() {
		return this.mfaService.generateWebAuthnAuthenticationOptionsDiscoverable();
	}

	async verifyWebAuthnAuthenticationDiscoverable(
		response: AuthenticationResponseJSON,
		expectedChallenge: string,
	): Promise<User> {
		return this.mfaService.verifyWebAuthnAuthenticationDiscoverable(response, expectedChallenge);
	}

	async generateWebAuthnAuthenticationOptionsForMfa(ticket: string) {
		return this.mfaService.generateWebAuthnAuthenticationOptionsForMfa(ticket);
	}

	async verifyWebAuthnAuthentication(
		userId: UserID,
		response: AuthenticationResponseJSON,
		expectedChallenge: string,
	): Promise<void> {
		return this.mfaService.verifyWebAuthnAuthentication(userId, response, expectedChallenge);
	}

	async generateSecureToken(length = 64): Promise<string> {
		return this.utilityService.generateSecureToken(length);
	}

	async generateAuthToken(): Promise<string> {
		return this.utilityService.generateAuthToken();
	}

	generateBackupCodes(): Array<string> {
		return this.utilityService.generateBackupCodes();
	}

	async checkEmailChangeRateLimit({
		userId,
	}: CheckEmailChangeRateLimitParams): Promise<{allowed: boolean; retryAfter?: number}> {
		return this.utilityService.checkEmailChangeRateLimit({userId});
	}

	validateAge({dateOfBirth, minAge}: ValidateAgeParams): boolean {
		return this.utilityService.validateAge({dateOfBirth, minAge});
	}

	async authorizeIpByToken(token: string): Promise<{userId: UserID; email: string} | null> {
		return this.utilityService.authorizeIpByToken(token);
	}

	async resendIpAuthorization(ticket: string): Promise<{retryAfter?: number}> {
		return this.loginService.resendIpAuthorization(ticket);
	}

	async completeIpAuthorization(token: string): Promise<{token: string; user_id: string; ticket: string}> {
		return this.loginService.completeIpAuthorization(token);
	}

	async createAuthSessionForUser(user: User, request: Request): Promise<{token: string; user_id: string}> {
		const [token] = await this.sessionService.createAuthSession({user, request});
		return {token, user_id: user.id.toString()};
	}

	private async createMfaTicketResponse(user: User): Promise<{
		mfa: true;
		ticket: string;
		allowed_methods: Array<string>;
		sms_phone_hint: string | null;
		sms: boolean;
		totp: boolean;
		webauthn: boolean;
	}> {
		const ticket = createMfaTicket(randomString(64));
		await this.cacheService.set(`mfa-ticket:${ticket}`, user.id.toString(), seconds('5 minutes'));

		const credentials = await this.repository.listWebAuthnCredentials(user.id);
		const hasSms = user.authenticatorTypes.has(UserAuthenticatorTypes.SMS);
		const hasWebauthn = credentials.length > 0;
		const hasTotp = user.authenticatorTypes.has(UserAuthenticatorTypes.TOTP);

		const allowedMethods: Array<string> = [];
		if (hasTotp) allowedMethods.push('totp');
		if (hasSms) allowedMethods.push('sms');
		if (hasWebauthn) allowedMethods.push('webauthn');

		return {
			mfa: true,
			ticket: ticket,
			allowed_methods: allowedMethods,
			sms_phone_hint: user.phone ? this.maskPhone(user.phone) : null,
			sms: hasSms,
			totp: hasTotp,
			webauthn: hasWebauthn,
		};
	}

	private maskPhone(phone: string): string {
		if (phone.length < 4) return '****';
		return `****${phone.slice(-4)}`;
	}

	async scheduleAccountDeletion(user: User): Promise<void> {
		const deletionDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
		await this.repository.patchUpsert(
			user.id,
			{
				account_status: 'pending_deletion',
				deletion_scheduled_at: deletionDate,
				pending_deletion_at: deletionDate,
			},
			user.toRow()
		);
		await this.kvAccountDeletionQueue.scheduleDeletion(user.id, deletionDate, 0);
		await this.terminateAllUserSessions(user.id);
	}

	async cancelAccountDeletion(user: User): Promise<void> {
		await this.repository.patchUpsert(
			user.id,
			{
				account_status: null,
				deletion_scheduled_at: null,
				pending_deletion_at: null,
			},
			user.toRow()
		);
		await this.kvAccountDeletionQueue.removeFromQueue(user.id);
	}
}
