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

import {channelIdToUserId, type MessageID, type UserID} from '@noctis/api/src/BrandedTypes';
import {Config} from '@noctis/api/src/Config';
import {mapChannelToResponse} from '@noctis/api/src/channel/ChannelMappers';
import {mapMessageToResponse} from '@noctis/api/src/channel/MessageMappers';
import type {IChannelRepositoryAggregate} from '@noctis/api/src/channel/repositories/IChannelRepositoryAggregate';
import {makeAttachmentCdnKey, makeAttachmentCdnUrl} from '@noctis/api/src/channel/services/message/MessageHelpers';
import type {GatewayDispatchEvent} from '@noctis/api/src/constants/Gateway';
import type {IPurgeQueue} from '@noctis/api/src/infrastructure/CloudflarePurgeQueue';
import type {IGatewayService} from '@noctis/api/src/infrastructure/IGatewayService';
import type {IMediaService} from '@noctis/api/src/infrastructure/IMediaService';
import type {IStorageService} from '@noctis/api/src/infrastructure/IStorageService';
import type {UserCacheService} from '@noctis/api/src/infrastructure/UserCacheService';
import type {RequestCache} from '@noctis/api/src/middleware/RequestCacheMiddleware';
import type {Channel} from '@noctis/api/src/models/Channel';
import type {Message} from '@noctis/api/src/models/Message';
import {ChannelTypes} from '@noctis/constants/src/ChannelConstants';

export class ChannelUtilsService {
	constructor(
		private channelRepository: IChannelRepositoryAggregate,
		private userCacheService: UserCacheService,
		private storageService: IStorageService,
		private gatewayService: IGatewayService,
		private purgeQueue: IPurgeQueue,
		private mediaService: IMediaService,
	) {}

	async purgeChannelAttachments(channel: Channel): Promise<void> {
		const batchSize = 100;
		let hasMore = true;
		let beforeMessageId: MessageID | undefined;

		while (hasMore) {
			const messages = await this.channelRepository.messages.listMessages(channel.id, beforeMessageId, batchSize);

			if (messages.length === 0) {
				hasMore = false;
				break;
			}

			await Promise.all(messages.map((message: Message) => this.purgeMessageAttachments(message)));

			if (messages.length < batchSize) {
				hasMore = false;
			} else {
				beforeMessageId = messages[messages.length - 1].id;
			}
		}
	}

	private async purgeMessageAttachments(message: Message): Promise<void> {
		const cdnUrls: Array<string> = [];

		await Promise.all(
			message.attachments.map(async (attachment) => {
				const cdnKey = makeAttachmentCdnKey(message.channelId, attachment.id, attachment.filename);
				await this.storageService.deleteObject(Config.s3.buckets.cdn, cdnKey);

				if (Config.cloudflare.purgeEnabled) {
					const cdnUrl = makeAttachmentCdnUrl(message.channelId, attachment.id, attachment.filename);
					cdnUrls.push(cdnUrl);
				}
			}),
		);

		if (Config.cloudflare.purgeEnabled && cdnUrls.length > 0) {
			await this.purgeQueue.addUrls(cdnUrls);
		}
	}

	private async dispatchEvent(params: {channel: Channel; event: GatewayDispatchEvent; data: unknown}): Promise<void> {
		const {channel, event, data} = params;

		if (channel.type === ChannelTypes.DM_PERSONAL_NOTES) {
			return this.gatewayService.dispatchPresence({
				userId: channelIdToUserId(channel.id),
				event,
				data,
			});
		}

		if (channel.guildId) {
			return this.gatewayService.dispatchGuild({guildId: channel.guildId, event, data});
		} else {
			for (const recipientId of channel.recipientIds) {
				await this.gatewayService.dispatchPresence({userId: recipientId, event, data});
			}
		}
	}

	async dispatchChannelUpdate({channel, requestCache}: {channel: Channel; requestCache: RequestCache}): Promise<void> {
		if (channel.guildId) {
			const channelResponse = await mapChannelToResponse({
				channel,
				currentUserId: null,
				userCacheService: this.userCacheService,
				requestCache,
			});

			await this.dispatchEvent({
				channel,
				event: 'CHANNEL_UPDATE',
				data: channelResponse,
			});
			return;
		}

		for (const userId of channel.recipientIds) {
			const channelResponse = await mapChannelToResponse({
				channel,
				currentUserId: userId,
				userCacheService: this.userCacheService,
				requestCache,
			});

			await this.gatewayService.dispatchPresence({
				userId,
				event: 'CHANNEL_UPDATE',
				data: channelResponse,
			});
		}
	}

	async dispatchChannelDelete({channel, requestCache}: {channel: Channel; requestCache: RequestCache}): Promise<void> {
		const channelResponse = await mapChannelToResponse({
			channel,
			currentUserId: null,
			userCacheService: this.userCacheService,
			requestCache,
		});

		await this.dispatchEvent({
			channel,
			event: 'CHANNEL_DELETE',
			data: channelResponse,
		});
	}

	async dispatchDmChannelDelete({
		channel,
		userId,
		requestCache,
	}: {
		channel: Channel;
		userId: UserID;
		requestCache: RequestCache;
	}): Promise<void> {
		await this.gatewayService.dispatchPresence({
			userId,
			event: 'CHANNEL_DELETE',
			data: await mapChannelToResponse({
				channel,
				currentUserId: null,
				userCacheService: this.userCacheService,
				requestCache,
			}),
		});
	}

	async dispatchMessageCreate({
		channel,
		message,
		requestCache,
	}: {
		channel: Channel;
		message: Message;
		requestCache: RequestCache;
	}): Promise<void> {
		const messageResponse = await mapMessageToResponse({
			message,
			userCacheService: this.userCacheService,
			requestCache,
			mediaService: this.mediaService,
		});

		await this.dispatchEvent({
			channel,
			event: 'MESSAGE_CREATE',
			data: {...messageResponse, channel_type: channel.type},
		});
	}
}
