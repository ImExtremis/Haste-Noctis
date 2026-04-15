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

import {Config} from '@noctis/api/src/Config';
import {Logger} from '@noctis/api/src/Logger';
import type {HonoEnv} from '@noctis/api/src/types/HonoEnv';
import {stripApiPrefix} from '@noctis/api/src/utils/RequestPathUtils';
import {createMiddleware} from 'hono/factory';
import {HTTPException} from 'hono/http-exception';

interface RequireXForwardedForOptions {
	exemptPaths?: Array<string>;
}

const defaultExemptPaths: Array<string> = [
	'/_health',
	'/webhooks/livekit',
	'/test',
	'/connections/bluesky/client-metadata.json',
	'/connections/bluesky/jwks.json',
];

export function RequireXForwardedForMiddleware({exemptPaths = defaultExemptPaths}: RequireXForwardedForOptions = {}) {
	return createMiddleware<HonoEnv>(async (ctx, next) => {
		if (Config.dev.testModeEnabled) {
			await next();
			return;
		}

		const path = stripApiPrefix(ctx.req.path);
		if (exemptPaths.some((prefix) => path === prefix || path.startsWith(prefix))) {
			await next();
			return;
		}

		const headerValue = ctx.req.header('x-forwarded-for');
		if (!headerValue || headerValue.trim() === '') {
			Logger.warn({path}, 'Rejected request without X-Forwarded-For header');
			throw new HTTPException(403, {message: 'Forbidden'});
		}

		await next();
	});
}
