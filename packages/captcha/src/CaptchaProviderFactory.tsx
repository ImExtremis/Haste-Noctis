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

import type {ICaptchaProvider} from '@noctis/captcha/src/ICaptchaProvider';
import {HcaptchaProvider} from '@noctis/captcha/src/providers/HcaptchaProvider';
import type {HttpCaptchaProviderOptions} from '@noctis/captcha/src/providers/HttpCaptchaProvider';
import type {RecaptchaProviderOptions} from '@noctis/captcha/src/providers/RecaptchaProvider';
import {RecaptchaProvider} from '@noctis/captcha/src/providers/RecaptchaProvider';
import {TestCaptchaProvider} from '@noctis/captcha/src/providers/TestProvider';
import {TurnstileProvider} from '@noctis/captcha/src/providers/TurnstileProvider';
import {UnavailableCaptchaProvider} from '@noctis/captcha/src/providers/UnavailableCaptchaProvider';
import type {LoggerInterface} from '@noctis/logger/src/LoggerInterface';

interface BaseCaptchaProviderFactoryParams {
	logger?: LoggerInterface;
}

interface CreateUnavailableCaptchaProviderParams extends BaseCaptchaProviderFactoryParams {
	mode: 'unavailable';
}

interface CreateTestCaptchaProviderParams extends BaseCaptchaProviderFactoryParams {
	mode: 'test';
}

interface CreateHcaptchaProviderParams extends BaseCaptchaProviderFactoryParams {
	mode: 'hcaptcha';
	secretKey: string;
	timeoutMs?: number;
	userAgent?: string;
	fetchFn?: typeof fetch;
}

interface CreateTurnstileProviderParams extends BaseCaptchaProviderFactoryParams {
	mode: 'turnstile';
	secretKey: string;
	timeoutMs?: number;
	userAgent?: string;
	fetchFn?: typeof fetch;
}

interface CreateRecaptchaProviderParams extends BaseCaptchaProviderFactoryParams {
	mode: 'recaptcha';
	secretKey: string;
	minimumScore?: number;
	timeoutMs?: number;
	userAgent?: string;
	fetchFn?: typeof fetch;
}

export type CreateCaptchaProviderParams =
	| CreateUnavailableCaptchaProviderParams
	| CreateTestCaptchaProviderParams
	| CreateHcaptchaProviderParams
	| CreateTurnstileProviderParams
	| CreateRecaptchaProviderParams;

function buildHttpOptions(
	params: CreateHcaptchaProviderParams | CreateTurnstileProviderParams | CreateRecaptchaProviderParams,
): HttpCaptchaProviderOptions {
	return {
		secretKey: params.secretKey,
		logger: params.logger,
		timeoutMs: params.timeoutMs,
		userAgent: params.userAgent,
		fetchFn: params.fetchFn,
	};
}

export function createCaptchaProvider(params: CreateCaptchaProviderParams): ICaptchaProvider {
	if (params.mode === 'test') {
		return new TestCaptchaProvider();
	}

	if (params.mode === 'hcaptcha') {
		return new HcaptchaProvider(buildHttpOptions(params));
	}

	if (params.mode === 'turnstile') {
		return new TurnstileProvider(buildHttpOptions(params));
	}

	if (params.mode === 'recaptcha') {
		const options: RecaptchaProviderOptions = {
			...buildHttpOptions(params),
			minimumScore: params.minimumScore,
		};
		return new RecaptchaProvider(options);
	}

	return new UnavailableCaptchaProvider();
}
