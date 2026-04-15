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
import {InstanceConfigRepository} from '@noctis/api/src/instance/InstanceConfigRepository';
import {Logger} from '@noctis/api/src/Logger';
import type {ICacheService} from '@noctis/cache/src/ICacheService';
import {VirusHashCache} from '@noctis/virus_scan/src/cache/VirusHashCache';
import {WebhookVirusScanFailureReporter} from '@noctis/virus_scan/src/failures/WebhookVirusScanFailureReporter';
import type {IVirusScanService} from '@noctis/virus_scan/src/IVirusScanService';
import {ClamAVProvider} from '@noctis/virus_scan/src/providers/ClamAVProvider';
import type {VirusScanResult} from '@noctis/virus_scan/src/VirusScanResult';
import {VirusScanService as SharedVirusScanService} from '@noctis/virus_scan/src/VirusScanService';

export class VirusScanService implements IVirusScanService {
	private readonly instanceConfigRepository: InstanceConfigRepository;
	private readonly service: SharedVirusScanService;

	constructor(cacheService: ICacheService) {
		this.instanceConfigRepository = new InstanceConfigRepository();

		const provider = new ClamAVProvider({
			host: Config.clamav.host,
			port: Config.clamav.port,
		});
		const virusHashCache = new VirusHashCache(cacheService);
		const failureReporter = new WebhookVirusScanFailureReporter({
			getWebhookUrl: async () => {
				const instanceConfig = await this.instanceConfigRepository.getInstanceConfig();
				return instanceConfig.systemAlertsWebhookUrl ?? undefined;
			},
			logger: Logger,
		});

		this.service = new SharedVirusScanService({
			provider,
			virusHashCache,
			logger: Logger,
			config: {
				failOpen: Config.clamav.failOpen,
			},
			failureReporter,
		});
	}

	async initialize(): Promise<void> {
		await this.service.initialize();
	}

	async scanFile(filePath: string): Promise<VirusScanResult> {
		return this.service.scanFile(filePath);
	}

	async scanBuffer(buffer: Buffer, filename: string): Promise<VirusScanResult> {
		return this.service.scanBuffer(buffer, filename);
	}
}
