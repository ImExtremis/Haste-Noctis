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

import type {CSPOptions} from '@noctis/app_proxy/src/app_server/utils/CSP';
import type {SentryConfig, TelemetryConfig} from '@noctis/config/src/MasterZodSchema';
import type {MetricsCollector} from '@noctis/hono_types/src/MetricsTypes';
import type {TracingOptions} from '@noctis/hono_types/src/TracingTypes';
import type {Logger} from '@noctis/logger/src/Logger';
import type {MiddlewareHandler} from 'hono';

export interface AppProxyConfig {
	env: string;
	port: number;
	static_cdn_endpoint: string;
	assets_dir: string;
	telemetry: TelemetryConfig;
	sentry: SentryConfig;
}

export interface AppProxyContext {
	config: AppProxyConfig;
	logger: Logger;
}

export interface AppProxyHonoEnv {
	Variables: AppProxyContext;
}

export type AppProxyMiddleware = MiddlewareHandler<AppProxyHonoEnv>;

export interface CreateAppProxyAppOptions {
	config: AppProxyConfig;
	logger: Logger;
	metricsCollector?: MetricsCollector;
	tracing?: TracingOptions;
	customMiddleware?: Array<AppProxyMiddleware>;
	assetsPath?: string;
	staticCDNEndpoint?: string;
	staticDir?: string;
	cspDirectives?: CSPOptions;
}
