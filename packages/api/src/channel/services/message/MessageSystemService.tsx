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

import type {GuildID, UserID} from '@noctis/api/src/BrandedTypes';
import {createMessageID} from '@noctis/api/src/BrandedTypes';
import type {IChannelRepositoryAggregate} from '@noctis/api/src/channel/repositories/IChannelRepositoryAggregate';
import type {MessagePersistenceService} from '@noctis/api/src/channel/services/message/MessagePersistenceService';
import type {IGuildRepositoryAggregate} from '@noctis/api/src/guild/repositories/IGuildRepositoryAggregate';
import type {SnowflakeService} from '@noctis/api/src/infrastructure/SnowflakeService';
import type {RequestCache} from '@noctis/api/src/middleware/RequestCacheMiddleware';
import type {Channel} from '@noctis/api/src/models/Channel';
import type {Message} from '@noctis/api/src/models/Message';
import {MessageTypes} from '@noctis/constants/src/ChannelConstants';

export class MessageSystemService {
	constructor(
		private channelRepository: IChannelRepositoryAggregate,
		private guildRepository: IGuildRepositoryAggregate,
		private snowflakeService: SnowflakeService,
		private persistenceService: MessagePersistenceService,
	) {}

	async sendJoinSystemMessage({
		guildId,
		userId,
		requestCache,
		dispatchMessageCreate,
	}: {
		guildId: GuildID;
		userId: UserID;
		requestCache: RequestCache;
		dispatchMessageCreate: (params: {channel: Channel; message: Message; requestCache: RequestCache}) => Promise<void>;
	}): Promise<void> {
		const guild = await this.guildRepository.findUnique(guildId);
		if (!guild?.systemChannelId) return;

		const systemChannel = await this.channelRepository.channelData.findUnique(guild.systemChannelId);
		if (!systemChannel) return;

		const messageId = createMessageID(await this.snowflakeService.generate());
		const message = await this.persistenceService.createMessage({
			messageId,
			channelId: systemChannel.id,
			userId,
			type: MessageTypes.USER_JOIN,
			content: null,
			flags: 0,
			guildId,
			channel: systemChannel,
		});

		await dispatchMessageCreate({channel: systemChannel, message, requestCache});
	}
}
