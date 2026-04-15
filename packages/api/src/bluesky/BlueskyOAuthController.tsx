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

import type {BlueskyAuthorizeResult, BlueskyCallbackResult} from '@noctis/api/src/bluesky/IBlueskyOAuthService';
import {Config} from '@noctis/api/src/Config';
import {BlueskyOAuthAuthorizationFailedError} from '@noctis/api/src/connection/errors/BlueskyOAuthAuthorizationFailedError';
import {BlueskyOAuthCallbackFailedError} from '@noctis/api/src/connection/errors/BlueskyOAuthCallbackFailedError';
import {BlueskyOAuthNotEnabledError} from '@noctis/api/src/connection/errors/BlueskyOAuthNotEnabledError';
import {BlueskyOAuthStateInvalidError} from '@noctis/api/src/connection/errors/BlueskyOAuthStateInvalidError';
import {ConnectionAlreadyExistsError} from '@noctis/api/src/connection/errors/ConnectionAlreadyExistsError';
import {Logger} from '@noctis/api/src/Logger';
import {DefaultUserOnly, LoginRequired} from '@noctis/api/src/middleware/AuthMiddleware';
import {RateLimitMiddleware} from '@noctis/api/src/middleware/RateLimitMiddleware';
import {OpenAPI} from '@noctis/api/src/middleware/ResponseTypeMiddleware';
import {ConnectionRateLimitConfigs} from '@noctis/api/src/rate_limit_configs/ConnectionRateLimitConfig';
import type {HonoApp} from '@noctis/api/src/types/HonoEnv';
import {Validator} from '@noctis/api/src/Validator';
import {ConnectionTypes} from '@noctis/constants/src/ConnectionConstants';
import {
	BlueskyAuthorizeRequest,
	BlueskyAuthorizeResponse,
} from '@noctis/schema/src/domains/connection/BlueskyOAuthSchemas';

const BLUESKY_PROFILE_URL_RE = /^https?:\/\/bsky\.app\/profile\//i;

function normalizeBlueskyHandle(input: string): string {
	let handle = input.trim();
	handle = handle.replace(BLUESKY_PROFILE_URL_RE, '');
	handle = handle.replace(/^@/, '');
	return handle;
}

export function BlueskyOAuthController(app: HonoApp) {
	app.get('/connections/bluesky/client-metadata.json', async (ctx) => {
		const service = ctx.get('blueskyOAuthService');
		if (!service) {
			return ctx.json({error: 'Bluesky OAuth is not enabled'}, 404);
		}
		return ctx.json(service.clientMetadata);
	});

	app.get('/connections/bluesky/jwks.json', async (ctx) => {
		const service = ctx.get('blueskyOAuthService');
		if (!service) {
			return ctx.json({error: 'Bluesky OAuth is not enabled'}, 404);
		}
		return ctx.json(service.jwks);
	});

	app.post(
		'/users/@me/connections/bluesky/authorize',
		RateLimitMiddleware(ConnectionRateLimitConfigs.CONNECTION_CREATE),
		LoginRequired,
		DefaultUserOnly,
		Validator('json', BlueskyAuthorizeRequest),
		OpenAPI({
			operationId: 'authorize_bluesky_connection',
			summary: 'Start Bluesky OAuth flow',
			responseSchema: BlueskyAuthorizeResponse,
			statusCode: 200,
			security: ['bearerToken', 'sessionToken'],
			tags: ['Connections'],
			description: 'Initiates the Bluesky OAuth2 authorisation flow and returns a URL to redirect the user to.',
		}),
		async (ctx) => {
			const service = ctx.get('blueskyOAuthService');
			if (!service) {
				throw new BlueskyOAuthNotEnabledError();
			}
			const {handle: rawHandle} = ctx.req.valid('json');
			const userId = ctx.get('user').id;
			const handle = normalizeBlueskyHandle(rawHandle);

			const connectionService = ctx.get('connectionService');
			const connections = await connectionService.getConnectionsForUser(userId);
			const lowerHandle = handle.toLowerCase();
			const existing = connections.find(
				(c) => c.connection_type === ConnectionTypes.BLUESKY && c.name.toLowerCase() === lowerHandle,
			);
			if (existing) {
				throw new ConnectionAlreadyExistsError();
			}

			let result: BlueskyAuthorizeResult;
			try {
				result = await service.authorize(handle, userId);
			} catch (error) {
				Logger.error({error, handle}, 'Bluesky OAuth authorize failed');
				throw new BlueskyOAuthAuthorizationFailedError();
			}
			return ctx.json({authorize_url: result.authorizeUrl});
		},
	);

	app.get('/connections/bluesky/callback', async (ctx) => {
		const appUrl = Config.endpoints.webApp;
		const callbackUrl = `${appUrl}/connection-callback`;

		const service = ctx.get('blueskyOAuthService');
		if (!service) {
			return ctx.redirect(`${callbackUrl}?status=error&reason=not_enabled`);
		}

		try {
			const params = new URLSearchParams(ctx.req.url.split('?')[1] ?? '');

			let result: BlueskyCallbackResult;
			try {
				result = await service.callback(params);
			} catch (callbackError) {
				Logger.error({error: callbackError}, 'Bluesky OAuth callback error from upstream');
				if (
					callbackError instanceof Error &&
					(callbackError.message.toLowerCase().includes('state') ||
						callbackError.message.toLowerCase().includes('expired'))
				) {
					throw new BlueskyOAuthStateInvalidError();
				}
				throw new BlueskyOAuthCallbackFailedError();
			}

			const connectionService = ctx.get('connectionService');
			await connectionService.createOrUpdateBlueskyConnection(result.userId, result.did, result.handle);

			return ctx.redirect(`${callbackUrl}?status=connected`);
		} catch (error) {
			Logger.error({error}, 'Bluesky OAuth callback failed');

			if (error instanceof BlueskyOAuthStateInvalidError) {
				return ctx.redirect(`${callbackUrl}?status=error&reason=state_invalid`);
			}
			if (error instanceof BlueskyOAuthCallbackFailedError) {
				return ctx.redirect(`${callbackUrl}?status=error&reason=callback_failed`);
			}

			return ctx.redirect(`${callbackUrl}?status=error&reason=unknown`);
		}
	});
}
