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

import type {UserID} from '@noctis/api/src/BrandedTypes';
import {createChannelID, createMessageID} from '@noctis/api/src/BrandedTypes';
import type {IChannelRepository} from '@noctis/api/src/channel/IChannelRepository';
import {mapMessageToResponse} from '@noctis/api/src/channel/MessageMappers';
import type {ChannelService} from '@noctis/api/src/channel/services/ChannelService';
import type {IMediaService} from '@noctis/api/src/infrastructure/IMediaService';
import type {UserCacheService} from '@noctis/api/src/infrastructure/UserCacheService';
import type {RequestCache} from '@noctis/api/src/middleware/RequestCacheMiddleware';
import type {Message} from '@noctis/api/src/models/Message';
import type {MessageSearchResultsResponse} from '@noctis/schema/src/domains/message/MessageResponseSchemas';

export class MessageSearchResponseMapper {
	constructor(
		private readonly channelRepository: IChannelRepository,
		private readonly channelService: ChannelService,
		private readonly userCacheService: UserCacheService,
		private readonly mediaService: IMediaService,
	) {}

	async mapSearchResultToResponses(
		result: {hits: Array<{channelId: string; id: string}>; total: number},
		userId: UserID,
		requestCache: RequestCache,
	): Promise<Array<MessageSearchResultsResponse['messages'][number]>> {
		const messageEntries = result.hits.map((hit) => ({
			channelId: createChannelID(BigInt(hit.channelId)),
			messageId: createMessageID(BigInt(hit.id)),
		}));

		const messages = await Promise.all(
			messageEntries.map(({channelId, messageId}) => this.channelRepository.messages.getMessage(channelId, messageId)),
		);

		const validMessages = messages.filter((message): message is Message => message !== null);

		const messageResponses = await Promise.all(
			validMessages.map((message) =>
				mapMessageToResponse({
					message,
					currentUserId: userId,
					userCacheService: this.userCacheService,
					requestCache,
					mediaService: this.mediaService,
					getReactions: (channelId, messageId) =>
						this.channelService.getMessageReactions({
							userId,
							channelId,
							messageId,
						}),
				}),
			),
		);

		return messageResponses;
	}
}
