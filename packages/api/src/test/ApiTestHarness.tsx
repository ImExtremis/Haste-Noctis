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

import {createAPIApp} from '@noctis/api/src/App';
import {Config} from '@noctis/api/src/Config';
import {clearSqliteStore} from '@noctis/api/src/database/SqliteKV';
import {MeilisearchSearchProvider} from '@noctis/api/src/infrastructure/MeilisearchSearchProvider';
import {NullSearchProvider} from '@noctis/api/src/infrastructure/NullSearchProvider';
import {
	setInjectedBlueskyOAuthService,
	setInjectedGatewayService,
	setInjectedKVProvider,
	setInjectedMediaService,
	setInjectedS3Service,
	setInjectedSearchProviderService,
	setInjectedWorkerService,
} from '@noctis/api/src/middleware/ServiceRegistry';
import type {ISearchProvider} from '@noctis/api/src/search/ISearchProvider';
import {acquireMeilisearchTestServer} from '@noctis/api/src/test/meilisearch/MeilisearchTestServer';
import {MockBlueskyOAuthService} from '@noctis/api/src/test/mocks/MockBlueskyOAuthService';
import {MockKVProvider} from '@noctis/api/src/test/mocks/MockKVProvider';
import {NoopLogger} from '@noctis/api/src/test/mocks/NoopLogger';
import {NoopGatewayService} from '@noctis/api/src/test/NoopGatewayService';
import {NoopWorkerService} from '@noctis/api/src/test/NoopWorkerService';
import {TestMediaService} from '@noctis/api/src/test/TestMediaService';
import {TestS3Service} from '@noctis/api/src/test/TestS3Service';
import type {HonoApp} from '@noctis/api/src/types/HonoEnv';
import {DEFAULT_SEARCH_CLIENT_TIMEOUT_MS} from '@noctis/constants/src/Timeouts';
import type {IKVProvider} from '@noctis/kv_client/src/IKVProvider';

export interface ApiTestHarness {
	app: HonoApp;
	kvProvider: IKVProvider;
	mockBlueskyOAuthService: MockBlueskyOAuthService;
	reset: () => Promise<void>;
	resetData: () => Promise<void>;
	shutdown: () => Promise<void>;
	requestJson: (params: {
		path: string;
		method?: string;
		body?: unknown;
		headers?: Record<string, string>;
	}) => Promise<Response>;
}

export interface CreateApiTestHarnessOptions {
	search?: 'disabled' | 'meilisearch' | 'elasticsearch';
}

export async function createApiTestHarness(options: CreateApiTestHarnessOptions = {}): Promise<ApiTestHarness> {
	const kvProvider = new MockKVProvider();
	setInjectedKVProvider(kvProvider);
	setInjectedGatewayService(new NoopGatewayService());
	setInjectedWorkerService(new NoopWorkerService());

	const s3Service = new TestS3Service();
	await s3Service.initialize();
	setInjectedS3Service(s3Service);

	const mediaService = new TestMediaService();
	mediaService.setS3Service(s3Service);
	setInjectedMediaService(mediaService);

	const harnessLogger = new NoopLogger();
	let searchProvider: ISearchProvider | null = null;
	let releaseMeilisearch: (() => Promise<void>) | null = null;
	if (options.search === 'meilisearch') {
		const server = await acquireMeilisearchTestServer();
		releaseMeilisearch = server.release;
		searchProvider = new MeilisearchSearchProvider({
			config: {
				url: server.url,
				apiKey: server.apiKey,
				timeoutMs: DEFAULT_SEARCH_CLIENT_TIMEOUT_MS,
				taskWaitTimeoutMs: DEFAULT_SEARCH_CLIENT_TIMEOUT_MS,
				taskPollIntervalMs: 50,
			},
			logger: harnessLogger,
		});
		await searchProvider.initialize();
	} else {
		searchProvider = new NullSearchProvider();
		await searchProvider.initialize();
	}
	setInjectedSearchProviderService(searchProvider);

	const mockBlueskyOAuthService = new MockBlueskyOAuthService();
	setInjectedBlueskyOAuthService(mockBlueskyOAuthService);

	const {
		app,
		initialize: initializeApp,
		shutdown: shutdownApp,
	} = await createAPIApp({
		config: Config,
		logger: harnessLogger,
	});

	try {
		await initializeApp();
	} catch (error) {
		console.error('Failed to initialize API app for tests:', error);
		throw error;
	}

	async function reset(): Promise<void> {
		clearSqliteStore();
		kvProvider.reset();
		mockBlueskyOAuthService.reset();
	}

	async function resetData(): Promise<void> {
		kvProvider.reset();
	}

	async function shutdown(): Promise<void> {
		try {
			await shutdownApp();
		} catch (_error) {}
		if (searchProvider) {
			try {
				await searchProvider.shutdown();
			} catch (_error) {}
		}
		setInjectedWorkerService(undefined);
		setInjectedGatewayService(undefined);
		setInjectedKVProvider(undefined);
		setInjectedMediaService(undefined);
		setInjectedS3Service(undefined);
		setInjectedSearchProviderService(undefined);
		setInjectedBlueskyOAuthService(undefined);
		await s3Service.cleanup();
		if (releaseMeilisearch) {
			await releaseMeilisearch();
		}
	}

	async function requestJson(params: {
		path: string;
		method?: string;
		body?: unknown;
		headers?: Record<string, string>;
	}): Promise<Response> {
		const {path, body, method = 'GET', headers} = params;
		const mergedHeaders = new Headers(headers);
		if (!mergedHeaders.has('content-type')) {
			mergedHeaders.set('content-type', 'application/json');
		}
		if (!mergedHeaders.has('x-forwarded-for')) {
			mergedHeaders.set('x-forwarded-for', '127.0.0.1');
		}

		const contentType = mergedHeaders.get('content-type');
		let requestBody: string | undefined;
		if (body !== undefined) {
			if (typeof body === 'string') {
				requestBody = body;
			} else if (contentType === 'application/json') {
				requestBody = JSON.stringify(body);
			} else {
				requestBody = JSON.stringify(body);
			}
		}

		return app.request(path, {
			method,
			headers: mergedHeaders,
			body: requestBody,
		});
	}

	return {app, kvProvider, mockBlueskyOAuthService, reset, resetData, shutdown, requestJson};
}
