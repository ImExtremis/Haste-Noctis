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

import {randomUUID} from 'node:crypto';
import type {
	CsamScanQueueResult,
	CsamScanSubmitParams,
	ICsamScanQueueService,
} from '@noctis/api/src/csam/CsamScanQueueService';
import type {PhotoDnaMatchResult} from '@noctis/api/src/csam/CsamTypes';
import {vi} from 'vitest';

export interface MockCsamScanQueueServiceConfig {
	shouldFail?: boolean;
	matchResult?: PhotoDnaMatchResult;
}

export class MockCsamScanQueueService implements ICsamScanQueueService {
	readonly submitScanSpy = vi.fn();
	private config: MockCsamScanQueueServiceConfig;

	private readonly defaultNoMatchResult: PhotoDnaMatchResult = {
		isMatch: false,
		trackingId: randomUUID(),
		matchDetails: [],
		timestamp: new Date().toISOString(),
	};

	constructor(config: MockCsamScanQueueServiceConfig = {}) {
		this.config = config;
	}

	configure(config: MockCsamScanQueueServiceConfig): void {
		this.config = {...this.config, ...config};
	}

	async submitScan(params: CsamScanSubmitParams): Promise<CsamScanQueueResult> {
		this.submitScanSpy(params);
		if (this.config.shouldFail) {
			throw new Error('Mock queue service failure');
		}
		const result = this.config.matchResult ?? this.defaultNoMatchResult;
		return {
			isMatch: result.isMatch,
			matchResult: result,
		};
	}

	reset(): void {
		this.config = {};
		this.submitScanSpy.mockClear();
	}
}
