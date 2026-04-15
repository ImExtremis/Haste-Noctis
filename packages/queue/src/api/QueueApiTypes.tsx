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

import type {ErrorI18nService} from '@noctis/errors/src/i18n/ErrorI18nService';
import type {LoggerInterface} from '@noctis/logger/src/LoggerInterface';
import type {CronScheduler} from '@noctis/queue/src/cron/CronScheduler';
import type {QueueEngine} from '@noctis/queue/src/engine/QueueEngine';

export interface AppEnv {
	Variables: {
		queueEngine: QueueEngine;
		cronScheduler: CronScheduler;
		logger: LoggerInterface;
		errorI18nService?: ErrorI18nService;
		requestLocale?: string;
		requestId?: string;
	};
}

export const APP_ENV_VARIABLE_KEYS = ['queueEngine', 'cronScheduler', 'logger'] as const;
