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

import {rm} from 'node:fs/promises';
import {Config} from '@noctis/api/src/Config';
import {NoopLogger} from '@noctis/api/src/test/mocks/NoopLogger';
import type {S3ServiceConfig} from '@noctis/s3/src/s3/S3Service';
import {S3Service} from '@noctis/s3/src/s3/S3Service';
import {temporaryDirectory} from 'tempy';

export class TestS3Service extends S3Service {
	private dataDir: string;

	constructor() {
		const dataDir = temporaryDirectory({prefix: 'noctis_test_s3_'});
		const buckets = Object.values(Config.s3.buckets).filter((bucket): bucket is string => bucket !== '');
		const config: S3ServiceConfig = {
			root: dataDir,
			buckets,
		};
		const logger = new NoopLogger();
		super(config, logger);
		this.dataDir = dataDir;
	}

	async cleanup(): Promise<void> {
		await rm(this.dataDir, {recursive: true, force: true});
	}
}
