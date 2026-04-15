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

import type {ChannelID, GuildID, UserID} from '@noctis/api/src/BrandedTypes';
import {mapChannelToResponse} from '@noctis/api/src/channel/ChannelMappers';
import type {IChannelRepository} from '@noctis/api/src/channel/IChannelRepository';
import type {GuildAuditLogService} from '@noctis/api/src/guild/GuildAuditLogService';
import type {IGuildRepositoryAggregate} from '@noctis/api/src/guild/repositories/IGuildRepositoryAggregate';
import {ChannelOperationsService} from '@noctis/api/src/guild/services/channel/ChannelOperationsService';
import type {IGatewayService} from '@noctis/api/src/infrastructure/IGatewayService';
import type {SnowflakeService} from '@noctis/api/src/infrastructure/SnowflakeService';
import type {UserCacheService} from '@noctis/api/src/infrastructure/UserCacheService';
import type {LimitConfigService} from '@noctis/api/src/limits/LimitConfigService';
import type {RequestCache} from '@noctis/api/src/middleware/RequestCacheMiddleware';
import type {ICacheService} from '@noctis/cache/src/ICacheService';
import {Permissions} from '@noctis/constants/src/ChannelConstants';
import {MissingPermissionsError} from '@noctis/errors/src/domains/core/MissingPermissionsError';
import {UnknownGuildError} from '@noctis/errors/src/domains/guild/UnknownGuildError';
import type {ChannelCreateRequest} from '@noctis/schema/src/domains/channel/ChannelRequestSchemas';
import type {ChannelResponse} from '@noctis/schema/src/domains/channel/ChannelSchemas';

export class GuildChannelService {
	private readonly channelOps: ChannelOperationsService;

	constructor(
		private readonly channelRepository: IChannelRepository,
		guildRepository: IGuildRepositoryAggregate,
		private readonly userCacheService: UserCacheService,
		private readonly gatewayService: IGatewayService,
		cacheService: ICacheService,
		snowflakeService: SnowflakeService,
		guildAuditLogService: GuildAuditLogService,
		limitConfigService: LimitConfigService,
	) {
		this.channelOps = new ChannelOperationsService(
			channelRepository,
			guildRepository,
			userCacheService,
			gatewayService,
			cacheService,
			snowflakeService,
			guildAuditLogService,
			limitConfigService,
		);
	}

	async getChannels(params: {
		userId: UserID;
		guildId: GuildID;
		requestCache: RequestCache;
	}): Promise<Array<ChannelResponse>> {
		try {
			await this.gatewayService.getGuildData({guildId: params.guildId, userId: params.userId});
		} catch (error) {
			if (error instanceof UnknownGuildError) {
				throw error;
			}
			throw error;
		}
		const viewableChannelIds = await this.gatewayService.getViewableChannels({
			guildId: params.guildId,
			userId: params.userId,
		});
		const channels = await this.channelRepository.listGuildChannels(params.guildId);
		const viewableChannels = channels.filter((channel) => viewableChannelIds.includes(channel.id));

		return Promise.all(
			viewableChannels.map((channel) => {
				return mapChannelToResponse({
					channel,
					currentUserId: null,
					userCacheService: this.userCacheService,
					requestCache: params.requestCache,
				});
			}),
		);
	}

	async createChannel(
		params: {userId: UserID; guildId: GuildID; data: ChannelCreateRequest; requestCache: RequestCache},
		auditLogReason?: string | null,
	): Promise<ChannelResponse> {
		await this.checkPermission({
			userId: params.userId,
			guildId: params.guildId,
			permission: Permissions.MANAGE_CHANNELS,
		});
		return this.channelOps.createChannel(params, auditLogReason);
	}

	async updateChannelPositions(
		params: {
			userId: UserID;
			guildId: GuildID;
			updates: Array<{
				channelId: ChannelID;
				position?: number;
				parentId: ChannelID | null | undefined;
				precedingSiblingId: ChannelID | null | undefined;
				lockPermissions: boolean;
			}>;
			requestCache: RequestCache;
		},
		auditLogReason?: string | null,
	): Promise<void> {
		await this.checkPermission({
			userId: params.userId,
			guildId: params.guildId,
			permission: Permissions.MANAGE_CHANNELS,
		});
		await this.channelOps.updateChannelPositionsByList({
			userId: params.userId,
			guildId: params.guildId,
			updates: params.updates,
			requestCache: params.requestCache,
			auditLogReason: auditLogReason ?? null,
		});
	}

	async sanitizeTextChannelNames(params: {guildId: GuildID; requestCache: RequestCache}): Promise<void> {
		await this.channelOps.sanitizeTextChannelNames(params);
	}

	private async checkPermission(params: {userId: UserID; guildId: GuildID; permission: bigint}): Promise<void> {
		const hasPermission = await this.gatewayService.checkPermission({
			guildId: params.guildId,
			userId: params.userId,
			permission: params.permission,
		});
		if (!hasPermission) throw new MissingPermissionsError();
	}
}
