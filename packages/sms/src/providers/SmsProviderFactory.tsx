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

import type {LoggerInterface} from '@noctis/logger/src/LoggerInterface';
import type {ISmsProvider} from '@noctis/sms/src/providers/ISmsProvider';
import {TestSmsProvider} from '@noctis/sms/src/providers/TestSmsProvider';
import {TwilioSmsProvider, type TwilioSmsProviderConfig} from '@noctis/sms/src/providers/TwilioSmsProvider';
import {UnavailableSmsProvider} from '@noctis/sms/src/providers/UnavailableSmsProvider';

interface BaseSmsProviderFactoryParams {
	logger?: LoggerInterface;
}

interface CreateUnavailableSmsProviderParams extends BaseSmsProviderFactoryParams {
	mode: 'unavailable';
}

interface CreateTestSmsProviderParams extends BaseSmsProviderFactoryParams {
	mode: 'test';
	verificationCode?: string;
}

interface CreateTwilioSmsProviderParams extends BaseSmsProviderFactoryParams {
	mode: 'twilio';
	config: TwilioSmsProviderConfig;
	fetchFn?: typeof fetch;
}

export type CreateSmsProviderParams =
	| CreateUnavailableSmsProviderParams
	| CreateTestSmsProviderParams
	| CreateTwilioSmsProviderParams;

export function createSmsProvider(params: CreateSmsProviderParams): ISmsProvider {
	if (params.mode === 'test') {
		return new TestSmsProvider({
			logger: params.logger,
			verificationCode: params.verificationCode,
		});
	}

	if (params.mode === 'twilio') {
		return new TwilioSmsProvider({
			config: params.config,
			logger: params.logger,
			fetchFn: params.fetchFn,
		});
	}

	return new UnavailableSmsProvider();
}
