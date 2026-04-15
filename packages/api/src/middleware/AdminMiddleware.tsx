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

import {Logger} from '@noctis/api/src/Logger';
import type {HonoEnv} from '@noctis/api/src/types/HonoEnv';
import {AdminACLs} from '@noctis/constants/src/AdminACLs';
import {MissingACLError} from '@noctis/errors/src/domains/core/MissingACLError';
import {MissingOAuthAdminScopeError} from '@noctis/errors/src/domains/core/MissingOAuthAdminScopeError';
import {MissingPermissionsError} from '@noctis/errors/src/domains/core/MissingPermissionsError';
import {UnauthorizedError} from '@noctis/errors/src/domains/core/UnauthorizedError';
import {createMiddleware} from 'hono/factory';

const REQUIRED_OAUTH_ADMIN_SCOPE = 'admin';

export function requireAdminACL(requiredACL: string) {
	return createMiddleware<HonoEnv>(async (ctx, next) => {
		const adminUser = ctx.get('user');
		if (!adminUser) throw new UnauthorizedError();

		const tokenType = ctx.get('authTokenType');
		if (tokenType !== 'bearer' && tokenType !== 'session' && tokenType !== 'admin_api_key')
			throw new UnauthorizedError();

		if (tokenType === 'bearer') {
			const oauthScopes = ctx.get('oauthBearerScopes');
			if (!oauthScopes || !oauthScopes.has(REQUIRED_OAUTH_ADMIN_SCOPE)) {
				throw new MissingOAuthAdminScopeError();
			}
		}

		const userAcls: Set<string> =
			tokenType === 'admin_api_key' ? (ctx.get('adminApiKeyAcls') ?? new Set()) : adminUser.acls;

		Logger.debug(
			{
				adminUserId: adminUser.id.toString(),
				acls: Array.from(userAcls),
				requiredACL,
				tokenType,
			},
			'Checking admin ACL requirements',
		);
		if (!adminUser.acls.has(AdminACLs.AUTHENTICATE) && !adminUser.acls.has(AdminACLs.WILDCARD)) {
			throw new MissingPermissionsError();
		}

		if (tokenType === 'admin_api_key' && !adminUser.acls.has(requiredACL) && !adminUser.acls.has(AdminACLs.WILDCARD)) {
			throw new MissingACLError(requiredACL);
		}

		if (!userAcls.has(requiredACL) && !userAcls.has(AdminACLs.WILDCARD)) {
			throw new MissingACLError(requiredACL);
		}

		ctx.set('adminUserId', adminUser.id);
		ctx.set('adminUserAcls', userAcls);
		await next();
	});
}

export function requireAnyAdminACL(requiredACLs: Array<string>) {
	return createMiddleware<HonoEnv>(async (ctx, next) => {
		const adminUser = ctx.get('user');
		if (!adminUser) throw new UnauthorizedError();

		const tokenType = ctx.get('authTokenType');
		if (tokenType !== 'bearer' && tokenType !== 'session' && tokenType !== 'admin_api_key')
			throw new UnauthorizedError();

		if (tokenType === 'bearer') {
			const oauthScopes = ctx.get('oauthBearerScopes');
			if (!oauthScopes || !oauthScopes.has(REQUIRED_OAUTH_ADMIN_SCOPE)) {
				throw new MissingOAuthAdminScopeError();
			}
		}

		const userAcls: Set<string> =
			tokenType === 'admin_api_key' ? (ctx.get('adminApiKeyAcls') ?? new Set()) : adminUser.acls;

		Logger.debug(
			{
				adminUserId: adminUser.id.toString(),
				acls: Array.from(userAcls),
				requiredACLs,
				tokenType,
			},
			'Checking admin ACL requirements (any)',
		);
		if (!adminUser.acls.has(AdminACLs.AUTHENTICATE) && !adminUser.acls.has(AdminACLs.WILDCARD)) {
			throw new MissingPermissionsError();
		}

		if (tokenType === 'admin_api_key' && !adminUser.acls.has(AdminACLs.WILDCARD)) {
			const ownerHasAny = requiredACLs.some((acl) => adminUser.acls.has(acl));
			if (!ownerHasAny) {
				throw new MissingACLError(requiredACLs[0] ?? AdminACLs.AUTHENTICATE);
			}
		}

		const hasAny = userAcls.has(AdminACLs.WILDCARD) || requiredACLs.some((acl) => userAcls.has(acl));

		if (!hasAny) {
			throw new MissingACLError(requiredACLs[0] ?? AdminACLs.AUTHENTICATE);
		}

		ctx.set('adminUserId', adminUser.id);
		ctx.set('adminUserAcls', userAcls);
		await next();
	});
}
