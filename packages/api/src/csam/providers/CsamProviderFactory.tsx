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

import type {ICsamScanQueueService} from '@noctis/api/src/csam/CsamScanQueueService';
import type {IPhotoDnaHashClient} from '@noctis/api/src/csam/PhotoDnaHashClient';
import {ArachnidShieldProvider} from '@noctis/api/src/csam/providers/ArachnidShieldProvider';
import type {CsamScanProvider, ICsamScanProvider} from '@noctis/api/src/csam/providers/ICsamScanProvider';
import {PhotoDnaProvider} from '@noctis/api/src/csam/providers/PhotoDnaProvider';
import type {ILogger} from '@noctis/api/src/ILogger';
import type {IMediaService} from '@noctis/api/src/infrastructure/IMediaService';
import type {IStorageService} from '@noctis/api/src/infrastructure/IStorageService';

export interface CsamIntegrationConfig {
	enabled: boolean;
	provider: CsamScanProvider;
	photoDna: {
		hashServiceUrl: string;
		hashServiceTimeoutMs: number;
		matchEndpoint: string;
		subscriptionKey: string;
		matchEnhance: boolean;
		rateLimitRps: number;
	};
	arachnidShield: {
		endpoint: string;
		username: string;
		password: string;
		timeoutMs: number;
		maxRetries: number;
		retryBackoffMs: number;
	};
}

export interface CsamProviderFactoryDeps {
	logger: ILogger;
	mediaService: IMediaService;
	storageService: IStorageService;
	hashClient?: IPhotoDnaHashClient;
	queueService?: ICsamScanQueueService;
}

export function createCsamProvider(
	config: CsamIntegrationConfig,
	deps: CsamProviderFactoryDeps,
): ICsamScanProvider | null {
	if (!config.enabled) {
		deps.logger.info('CSAM scanning is disabled');
		return null;
	}

	switch (config.provider) {
		case 'photo_dna': {
			if (!deps.hashClient) {
				deps.logger.error('PhotoDNA hash client is required but not provided');
				return null;
			}
			if (!deps.queueService) {
				deps.logger.error('CSAM scan queue service is required but not provided');
				return null;
			}

			deps.logger.info('Using PhotoDNA provider for CSAM scanning');
			return new PhotoDnaProvider(deps.hashClient, deps.mediaService, deps.queueService, {
				logger: deps.logger,
			});
		}

		case 'arachnid_shield': {
			if (!config.arachnidShield.username || !config.arachnidShield.password) {
				deps.logger.error('Arachnid Shield credentials are required but not configured');
				return null;
			}

			deps.logger.info('Using Arachnid Shield provider for CSAM scanning');
			return new ArachnidShieldProvider({
				config: {
					endpoint: config.arachnidShield.endpoint,
					username: config.arachnidShield.username,
					password: config.arachnidShield.password,
					timeoutMs: config.arachnidShield.timeoutMs,
					maxRetries: config.arachnidShield.maxRetries,
					retryBackoffMs: config.arachnidShield.retryBackoffMs,
				},
				logger: deps.logger,
				storageService: deps.storageService,
			});
		}

		default: {
			deps.logger.error({provider: config.provider}, 'Unknown CSAM provider');
			return null;
		}
	}
}
