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

import type {AppTelemetryOptions, HonoEnv} from '@noctis/app_proxy/src/AppServerTypes';
import {isExpectedError} from '@noctis/app_proxy/src/ErrorClassification';
import {applyMiddlewareStack} from '@noctis/hono/src/middleware/MiddlewareStack';
import type {Logger} from '@noctis/logger/src/Logger';
import type {Hono} from 'hono';

interface ApplyAppServerMiddlewareOptions {
	app: Hono<HonoEnv>;
	captureException?: (error: Error, context?: Record<string, unknown>) => void;
	env?: string;
	logger: Logger;
	telemetry?: AppTelemetryOptions;
}

export function applyAppServerMiddleware(options: ApplyAppServerMiddlewareOptions): void {
	const {app, captureException, env, logger, telemetry} = options;

	applyMiddlewareStack(app, {
		requestId: {},
		tracing: telemetry?.tracing,
		metrics: telemetry?.metricsCollector
			? {
					enabled: true,
					collector: telemetry.metricsCollector,
					skipPaths: ['/_health'],
				}
			: undefined,
		logger: {
			log: (data) => {
				logger.info(
					{
						method: data.method,
						path: data.path,
						status: data.status,
						durationMs: data.durationMs,
					},
					'Request completed',
				);
			},
			skip: ['/_health'],
		},
		errorHandler: {
			includeStack: env === 'development',
			logger: (error, c) => {
				if (!isExpectedError(error) && captureException) {
					captureException(error, {
						path: c.req.path,
						method: c.req.method,
					});
				}

				logger.error(
					{
						error: error.message,
						stack: error.stack,
						path: c.req.path,
						method: c.req.method,
					},
					'Request error',
				);
			},
		},
	});
}
