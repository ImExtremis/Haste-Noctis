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

import {createTestAccount} from '@noctis/api/src/auth/tests/AuthTestUtils';
import {createTestGuild, getPngDataUrl, VALID_PNG_BASE64} from '@noctis/api/src/emoji/tests/EmojiTestUtils';
import {type ApiTestHarness, createApiTestHarness} from '@noctis/api/src/test/ApiTestHarness';
import {HTTP_STATUS} from '@noctis/api/src/test/TestConstants';
import {createBuilder} from '@noctis/api/src/test/TestRequestBuilder';
import {afterAll, beforeAll, beforeEach, describe, it} from 'vitest';

describe('Emoji bulk creation', () => {
	let harness: ApiTestHarness;

	beforeAll(async () => {
		harness = await createApiTestHarness();
	});

	beforeEach(async () => {
		await harness.reset();
	});

	afterAll(async () => {
		await harness?.shutdown();
	});

	it('successfully bulk creates multiple emojis', async () => {
		const user = await createTestAccount(harness);
		const guild = await createTestGuild(harness, user.token, 'Emoji Test Guild');

		const emojis = Array.from({length: 5}, (_, i) => ({
			name: `bulk_emoji_${i + 1}`,
			image: getPngDataUrl(VALID_PNG_BASE64),
		}));

		await createBuilder(harness, user.token)
			.post(`/guilds/${guild.id}/emojis/bulk`)
			.body({emojis})
			.expect(HTTP_STATUS.OK)
			.execute();
	});
});
