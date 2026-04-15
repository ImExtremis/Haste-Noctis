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

/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */

import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {normalizeEndpointOrigin, validateOutboundEndpointUrl} from '@noctis/hono/src/security/OutboundEndpoint';
import type {MetricsCollector} from '@noctis/hono_types/src/MetricsTypes';
import type {TracingOptions} from '@noctis/hono_types/src/TracingTypes';
import type {LoggerInterface} from '@noctis/logger/src/LoggerInterface';
import {createMarketingContextFactory} from '@noctis/marketing/src/app/MarketingContextFactory';
import {applyMarketingMiddlewareStack} from '@noctis/marketing/src/app/MarketingMiddlewareStack';
import {registerMarketingRoutes} from '@noctis/marketing/src/app/MarketingRouteRegistrar';
import {applyMarketingStaticAssets} from '@noctis/marketing/src/app/MarketingStaticAssets';
import type {MarketingConfig} from '@noctis/marketing/src/MarketingConfig';
import {createMarketingMetricsMiddleware} from '@noctis/marketing/src/MarketingTelemetry';
import {initializeMarketingCsrf} from '@noctis/marketing/src/middleware/Csrf';
import {normalizeBasePath} from '@noctis/marketing/src/UrlUtils';
import type {IRateLimitService} from '@noctis/rate_limit/src/IRateLimitService';
import {Hono} from 'hono';

export interface CreateMarketingAppOptions {
	config: MarketingConfig;
	logger: LoggerInterface;
	publicDir?: string;
	rateLimitService?: IRateLimitService | null;
	metricsCollector?: MetricsCollector;
	tracing?: TracingOptions;
}

export interface MarketingAppResult {
	app: Hono;
	shutdown: () => void;
}

export function createMarketingApp(options: CreateMarketingAppOptions): MarketingAppResult {
	const {logger, publicDir: publicDirOption, rateLimitService = null, metricsCollector, tracing} = options;

	const config = normalizeMarketingSecurityConfig(options.config);
	const publicDir = resolve(publicDirOption ?? fileURLToPath(new URL('../public', import.meta.url)));
	const app = new Hono();

	const contextFactory = createMarketingContextFactory({
		config,
		publicDir,
	});

	initializeMarketingCsrf(config.secretKeyBase, config.env === 'production');

	app.use('*', createMarketingMetricsMiddleware(config));

	applyMarketingStaticAssets({
		app,
		publicDir,
		basePath: config.basePath,
		logger,
	});

	applyMarketingMiddlewareStack({
		app,
		config,
		logger,
		rateLimitService,
		metricsCollector,
		tracing,
	});

	registerMarketingRoutes({
		app,
		config,
		contextFactory,
	});

	const shutdown = (): void => {
		logger.info('Marketing app shutting down');
	};

	return {app, shutdown};
}

function normalizeMarketingSecurityConfig(rawConfig: MarketingConfig): MarketingConfig {
	const basePath = normalizeBasePath(rawConfig.basePath);
	const isProduction = rawConfig.env === 'production';
	const apiEndpoint = validateOutboundEndpointUrl(rawConfig.apiEndpoint, {
		name: 'marketing.apiEndpoint',
		allowHttp: !isProduction,
		allowLocalhost: !isProduction,
		allowPrivateIpLiterals: !isProduction,
	});

	return {
		...rawConfig,
		basePath,
		apiEndpoint: normalizeEndpointOrigin(apiEndpoint),
	};
}
