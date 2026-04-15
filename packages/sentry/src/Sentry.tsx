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

import type {SentryConfig, SentryContext, SentryUser} from '@noctis/sentry/src/SentryContracts';
import {DefaultSentryLogger} from '@noctis/sentry/src/SentryLogger';
import {SentryNodeClient} from '@noctis/sentry/src/SentryNodeClient';
import {SentryService} from '@noctis/sentry/src/SentryService';
import type {SeverityLevel} from '@sentry/node';

const sentryService = new SentryService({
	client: SentryNodeClient,
	logger: DefaultSentryLogger,
});

export function initSentry(config?: SentryConfig): void {
	sentryService.init(config);
}

export function captureException(error: Error, context?: SentryContext): void {
	sentryService.captureException(error, context);
}

export function captureMessage(message: string, level: SeverityLevel = 'info', context?: SentryContext): void {
	sentryService.captureMessage(message, level, context);
}

export async function flushSentry(timeout = 2000): Promise<void> {
	await sentryService.flush(timeout);
}

export function setUser(user: SentryUser | null): void {
	sentryService.setUser(user);
}
