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

import {createInitializer, createShutdown} from '@noctis/api/src/app/APILifecycle';
import {registerControllers} from '@noctis/api/src/app/ControllerRegistry';
import {configureMiddleware} from '@noctis/api/src/app/MiddlewarePipeline';
import type {APIConfig} from '@noctis/api/src/config/APIConfig';
import type {ILogger} from '@noctis/api/src/ILogger';
import type {HonoApp, HonoEnv} from '@noctis/api/src/types/HonoEnv';
import {AppErrorHandler, AppNotFoundHandler} from '@noctis/errors/src/domains/core/ErrorHandlers';
import {setIsDevelopment} from '@noctis/schema/src/primitives/UrlValidators';
import {Hono} from 'hono';

export interface CreateAPIAppOptions {
	config: APIConfig;
	logger: ILogger;
	setSentryUser?: (user: {id?: string; username?: string; email?: string; ip_address?: string}) => void;
	isTelemetryActive?: () => boolean;
}

export interface APIAppResult {
	app: HonoApp;
	initialize: () => Promise<void>;
	shutdown: () => Promise<void>;
}

export async function createAPIApp(options: CreateAPIAppOptions): Promise<APIAppResult> {
	const {config, logger, setSentryUser, isTelemetryActive} = options;

	setIsDevelopment(config.nodeEnv === 'development');

	const routes = new Hono<HonoEnv>({strict: true});

	configureMiddleware(routes, {
		logger,
		nodeEnv: config.nodeEnv,
		corsOrigins: [config.endpoints.webApp, config.endpoints.marketing],
		setSentryUser,
		isTelemetryActive,
	});

	routes.onError(AppErrorHandler);
	routes.notFound(AppNotFoundHandler);

	registerControllers(routes, config);

	const app = new Hono<HonoEnv>({strict: true});
	app.route('/v1', routes);
	app.route('/', routes);

	app.onError(AppErrorHandler);
	app.notFound(AppNotFoundHandler);

	return {
		app,
		initialize: createInitializer(config, logger),
		shutdown: createShutdown(logger),
	};
}
