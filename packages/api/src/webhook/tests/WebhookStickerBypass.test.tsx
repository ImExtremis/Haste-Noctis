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
import {createGuild} from '@noctis/api/src/guild/tests/GuildTestUtils';
import {type ApiTestHarness, createApiTestHarness} from '@noctis/api/src/test/ApiTestHarness';
import {createBuilderWithoutAuth} from '@noctis/api/src/test/TestRequestBuilder';
import {createWebhook, deleteWebhook} from '@noctis/api/src/webhook/tests/WebhookTestUtils';
import {beforeAll, beforeEach, describe, it} from 'vitest';

describe('Webhook sticker bypass', () => {
	let harness: ApiTestHarness;

	beforeAll(async () => {
		harness = await createApiTestHarness();
	});

	beforeEach(async () => {
		await harness.reset();
	});

	it('webhook messages ignore sticker_ids', async () => {
		const user = await createTestAccount(harness);
		const guild = await createGuild(harness, user.token, 'Webhook Sticker Test Guild');
		const channelId = guild.system_channel_id!;

		const webhook = await createWebhook(harness, channelId, user.token, 'Sticker Test Webhook');

		await createBuilderWithoutAuth(harness)
			.post(`/webhooks/${webhook.id}/${webhook.token}`)
			.body({
				content: 'Webhook sticker test',
				sticker_ids: ['999999999999999999'],
			})
			.expect(204)
			.execute();

		await deleteWebhook(harness, webhook.id, user.token);
	});
});
