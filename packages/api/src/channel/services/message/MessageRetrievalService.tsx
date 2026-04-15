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

import {AttachmentDecayService} from '@noctis/api/src/attachment/AttachmentDecayService';
import type {AttachmentID, ChannelID, MessageID, UserID} from '@noctis/api/src/BrandedTypes';
import {createChannelID, createMessageID} from '@noctis/api/src/BrandedTypes';
import {mapMessageToResponse} from '@noctis/api/src/channel/MessageMappers';
import type {IChannelRepositoryAggregate} from '@noctis/api/src/channel/repositories/IChannelRepositoryAggregate';
import type {AuthenticatedChannel} from '@noctis/api/src/channel/services/AuthenticatedChannel';
import {getDmChannelIdsForScope} from '@noctis/api/src/channel/services/message/DmScopeUtils';
import type {MessageChannelAuthService} from '@noctis/api/src/channel/services/message/MessageChannelAuthService';
import {collectMessageAttachments} from '@noctis/api/src/channel/services/message/MessageHelpers';
import type {MessageProcessingService} from '@noctis/api/src/channel/services/message/MessageProcessingService';
import type {MessageSearchService} from '@noctis/api/src/channel/services/message/MessageSearchService';
import type {IMediaService} from '@noctis/api/src/infrastructure/IMediaService';
import type {UserCacheService} from '@noctis/api/src/infrastructure/UserCacheService';
import type {RequestCache} from '@noctis/api/src/middleware/RequestCacheMiddleware';
import type {Channel} from '@noctis/api/src/models/Channel';
import type {Message} from '@noctis/api/src/models/Message';
import {getMessageSearchService} from '@noctis/api/src/SearchFactory';
import {buildMessageSearchFilters} from '@noctis/api/src/search/BuildMessageSearchFilters';
import {withBusinessSpan} from '@noctis/api/src/telemetry/BusinessSpans';
import {recordMessageRetrievalDuration, recordMessageRetrieved} from '@noctis/api/src/telemetry/MessageTelemetry';
import type {IUserRepository} from '@noctis/api/src/user/IUserRepository';
import {ChannelTypes, MessageFlags, Permissions} from '@noctis/constants/src/ChannelConstants';
import {UnknownMessageError} from '@noctis/errors/src/domains/channel/UnknownMessageError';
import {FeatureTemporarilyDisabledError} from '@noctis/errors/src/domains/core/FeatureTemporarilyDisabledError';
import type {MessageSearchRequest} from '@noctis/schema/src/domains/message/MessageRequestSchemas';
import type {MessageSearchResponse} from '@noctis/schema/src/domains/message/MessageResponseSchemas';
import {snowflakeToDate} from '@noctis/snowflake/src/Snowflake';

export class MessageRetrievalService {
	constructor(
		private channelRepository: IChannelRepositoryAggregate,
		private userCacheService: UserCacheService,
		private mediaService: IMediaService,
		private channelAuthService: MessageChannelAuthService,
		private processingService: MessageProcessingService,
		private searchService: MessageSearchService,
		private userRepository: IUserRepository,
		private attachmentDecayService: AttachmentDecayService = new AttachmentDecayService(),
	) {}

	private isMessageAfterCutoff(messageId: MessageID, cutoffIso: string): boolean {
		const messageTimestamp = snowflakeToDate(messageId).getTime();
		const cutoffTimestamp = new Date(cutoffIso).getTime();
		return messageTimestamp >= cutoffTimestamp;
	}

	private async canAccessMessage(authChannel: AuthenticatedChannel, messageId: MessageID): Promise<boolean> {
		if (!authChannel.guild) {
			return true;
		}

		if (await authChannel.hasPermission(Permissions.READ_MESSAGE_HISTORY)) {
			return true;
		}

		const cutoff = authChannel.guild.message_history_cutoff;
		if (!cutoff) {
			return false;
		}

		return this.isMessageAfterCutoff(messageId, cutoff);
	}

	async getMessage({
		userId,
		channelId,
		messageId,
	}: {
		userId: UserID;
		channelId: ChannelID;
		messageId: MessageID;
	}): Promise<Message> {
		return await withBusinessSpan(
			'noctis.message.get',
			'noctis.messages.retrieved',
			{channel_id: channelId.toString()},
			async () => {
				const authChannel = await this.channelAuthService.getChannelAuthenticated({userId, channelId});

				if (!(await this.canAccessMessage(authChannel, messageId))) {
					throw new UnknownMessageError();
				}

				const message = await this.channelRepository.messages.getMessage(channelId, messageId);
				if (!message) {
					throw new UnknownMessageError();
				}

				await this.extendAttachments([message]);
				recordMessageRetrieved({channelType: authChannel.channel.type, count: 1});
				return message;
			},
		);
	}

	async getMessages({
		userId,
		channelId,
		limit,
		before,
		after,
		around,
	}: {
		userId: UserID;
		channelId: ChannelID;
		limit: number;
		before?: MessageID;
		after?: MessageID;
		around?: MessageID;
	}): Promise<Array<Message>> {
		const startTime = Date.now();
		return await withBusinessSpan(
			'noctis.messages.list',
			'noctis.messages.listed',
			{channel_id: channelId.toString()},
			async () => {
				const authChannel = await this.channelAuthService.getChannelAuthenticated({userId, channelId});

				const hasReadHistory =
					!authChannel.guild || (await authChannel.hasPermission(Permissions.READ_MESSAGE_HISTORY));

				if (!hasReadHistory) {
					const cutoff = authChannel.guild?.message_history_cutoff;
					if (!cutoff) {
						return [];
					}
				}

				let messages = around
					? await this.processingService.fetchMessagesAround({channelId, limit, around})
					: await this.channelRepository.messages.listMessages(channelId, before, limit, after);

				if (!hasReadHistory) {
					const cutoff = authChannel.guild!.message_history_cutoff!;
					messages = messages.filter((message) => this.isMessageAfterCutoff(message.id, cutoff));
				}

				await this.extendAttachments(messages);
				const durationMs = Date.now() - startTime;
				recordMessageRetrievalDuration({channelType: authChannel.channel.type, durationMs});
				recordMessageRetrieved({channelType: authChannel.channel.type, count: messages.length});
				return messages;
			},
		);
	}

	async searchMessages({
		userId,
		channelId,
		searchParams,
		requestCache,
	}: {
		userId: UserID;
		channelId: ChannelID;
		searchParams: MessageSearchRequest;
		requestCache: RequestCache;
	}): Promise<MessageSearchResponse> {
		const authChannel = await this.channelAuthService.getChannelAuthenticated({userId, channelId});
		const {channel} = authChannel;

		const hasReadHistory = !authChannel.guild || (await authChannel.hasPermission(Permissions.READ_MESSAGE_HISTORY));

		if (!hasReadHistory) {
			const cutoff = authChannel.guild?.message_history_cutoff;
			if (!cutoff) {
				return {messages: [], total: 0, hits_per_page: searchParams.hits_per_page ?? 25, page: searchParams.page ?? 1};
			}
		}

		const searchService = getMessageSearchService();
		if (!searchService) {
			throw new FeatureTemporarilyDisabledError();
		}

		let channelIndexedAt: Date | null = channel.indexedAt;
		if (channel.type === ChannelTypes.DM_PERSONAL_NOTES) {
			const persistedChannel = await this.channelRepository.channelData.findUnique(channelId);
			if (persistedChannel?.indexedAt) {
				channelIndexedAt = persistedChannel.indexedAt;
			}
		}

		if (!channelIndexedAt) {
			await this.searchService.triggerChannelIndexing(channelId);
			return {indexing: true as const};
		}

		const resolvedSearchParams = await this.applyDmScopeToSearchParams({
			userId,
			channel,
			channelId,
			searchParams,
		});
		const scope = resolvedSearchParams.scope ?? 'current';
		const channelIdStrings =
			scope === 'current'
				? [channelId.toString()]
				: resolvedSearchParams.channel_id
					? resolvedSearchParams.channel_id.map((id) => id.toString())
					: [channelId.toString()];
		const normalizedSearchParams =
			scope === 'current' ? {...resolvedSearchParams, channel_id: undefined} : resolvedSearchParams;
		const filters = buildMessageSearchFilters(normalizedSearchParams, channelIdStrings);

		const hitsPerPage = resolvedSearchParams.hits_per_page ?? 25;
		const page = resolvedSearchParams.page ?? 1;
		const result = await searchService.searchMessages(resolvedSearchParams.content ?? '', filters, {
			hitsPerPage,
			page,
		});

		const messageEntries = result.hits.map((hit) => ({
			channelId: createChannelID(BigInt(hit.channelId)),
			messageId: createMessageID(BigInt(hit.id)),
		}));
		const messages = await Promise.all(
			messageEntries.map(({channelId, messageId}) => this.channelRepository.messages.getMessage(channelId, messageId)),
		);

		let validMessages = messages.filter((msg: Message | null): msg is Message => msg !== null);

		if (!hasReadHistory) {
			const cutoff = authChannel.guild!.message_history_cutoff!;
			validMessages = validMessages.filter((message) => this.isMessageAfterCutoff(message.id, cutoff));
		}

		if (validMessages.length > 0) {
			await this.extendAttachments(validMessages);
		}

		const attachmentPayloads = validMessages.flatMap((message) => this.buildAttachmentDecayEntriesForMessage(message));
		const attachmentDecayMap =
			attachmentPayloads.length > 0
				? await this.attachmentDecayService.fetchMetadata(
						attachmentPayloads.map((payload) => ({attachmentId: payload.attachmentId})),
					)
				: undefined;

		const effectiveCutoff = !hasReadHistory ? authChannel.guild?.message_history_cutoff : undefined;

		const messageResponses = await Promise.all(
			validMessages.map((message: Message) =>
				mapMessageToResponse({
					message,
					currentUserId: userId,
					userCacheService: this.userCacheService,
					requestCache,
					mediaService: this.mediaService,
					attachmentDecayMap,
					messageHistoryCutoff: effectiveCutoff,
					getReactions: (channelId, messageId) =>
						this.channelRepository.messageInteractions.listMessageReactions(channelId, messageId),
					setHasReaction: (channelId, messageId, hasReaction) =>
						this.channelRepository.messageInteractions.setHasReaction(channelId, messageId, hasReaction),
					getReferencedMessage: (channelId, messageId) =>
						this.channelRepository.messages.getMessage(channelId, messageId),
				}),
			),
		);

		return {
			messages: messageResponses,
			total: hasReadHistory ? result.total : messageResponses.length,
			hits_per_page: hitsPerPage,
			page,
		};
	}

	private async extendAttachments(messages: Array<Message>): Promise<void> {
		const payloads = messages.flatMap((message) => {
			if (message.flags & MessageFlags.COMPACT_ATTACHMENTS) {
				return [];
			}
			return this.buildAttachmentDecayEntriesForMessage(message);
		});

		if (payloads.length === 0) return;

		await this.attachmentDecayService.extendForAttachments(payloads);
	}

	private buildAttachmentDecayEntriesForMessage(message: Message): Array<{
		attachmentId: AttachmentID;
		channelId: ChannelID;
		messageId: MessageID;
		filename: string;
		sizeBytes: bigint;
		uploadedAt: Date;
	}> {
		const attachments = collectMessageAttachments(message);

		if (attachments.length === 0) return [];

		const uploadedAt = snowflakeToDate(message.id);
		return attachments.map((attachment) => ({
			attachmentId: attachment.id,
			channelId: message.channelId,
			messageId: message.id,
			filename: attachment.filename,
			sizeBytes: attachment.size,
			uploadedAt,
		}));
	}

	private async applyDmScopeToSearchParams({
		userId,
		channel,
		channelId,
		searchParams,
	}: {
		userId: UserID;
		channel: Channel;
		channelId: ChannelID;
		searchParams: MessageSearchRequest;
	}): Promise<MessageSearchRequest> {
		const scope = searchParams.scope;
		const isDmSearch = channel.type === ChannelTypes.DM || channel.type === ChannelTypes.GROUP_DM;
		if (!isDmSearch || !scope || scope === 'current') {
			return searchParams;
		}

		if (scope !== 'all_dms' && scope !== 'open_dms') {
			return searchParams;
		}

		const targetChannelIds = await getDmChannelIdsForScope({
			scope,
			userId,
			userRepository: this.userRepository,
			includeChannelId: channelId,
		});
		if (targetChannelIds.length === 0) {
			return searchParams;
		}

		return {...searchParams, channel_id: targetChannelIds.map((id) => BigInt(id))};
	}
}
