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

import type {ChannelID} from '@noctis/api/src/BrandedTypes';
import type {User} from '@noctis/api/src/models/User';
import type {ReadStateService} from '@noctis/api/src/read_state/ReadStateService';

interface IncrementDmMentionCountsParams {
	readStateService: ReadStateService;
	user: User | null;
	recipients: Array<User>;
	channelId: ChannelID;
}

export async function incrementDmMentionCounts(params: IncrementDmMentionCountsParams): Promise<void> {
	const {readStateService, user, recipients, channelId} = params;

	if (!user || user.isBot) return;

	const validRecipients = recipients.filter((recipient) => recipient.id !== user.id && !recipient.isBot);

	if (validRecipients.length === 0) return;

	await readStateService.bulkIncrementMentionCounts(
		validRecipients.map((recipient) => ({
			userId: recipient.id,
			channelId,
		})),
	);
}
