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

import {createAuthHarness, createTestAccount} from '@noctis/api/src/auth/tests/AuthTestUtils';
import {
	createTotpSecret,
	decodeBase64URL,
	generateTotpCode,
	type WebAuthnRegistrationOptions,
} from '@noctis/api/src/auth/tests/WebAuthnTestUtils';
import type {ApiTestHarness} from '@noctis/api/src/test/ApiTestHarness';
import {createBuilder} from '@noctis/api/src/test/TestRequestBuilder';
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest';

describe('WebAuthn registration user handle', () => {
	let harness: ApiTestHarness;

	beforeAll(async () => {
		harness = await createAuthHarness();
	});

	beforeEach(async () => {
		await harness.reset();
	});

	afterAll(async () => {
		await harness?.shutdown();
	});

	it('ensures registration options carry the stable user identifier', async () => {
		const account = await createTestAccount(harness);
		const secret = createTotpSecret();

		await createBuilder(harness, account.token)
			.post('/users/@me/mfa/totp/enable')
			.body({secret, code: generateTotpCode(secret), password: account.password})
			.expect(200)
			.execute();

		const regOptions = await createBuilder<WebAuthnRegistrationOptions>(harness, account.token)
			.post('/users/@me/mfa/webauthn/credentials/registration-options')
			.body({mfa_method: 'totp', mfa_code: generateTotpCode(secret)})
			.execute();

		const handle = decodeBase64URL(regOptions.user.id).toString();
		expect(handle).toBe(account.userId);
	});
});
