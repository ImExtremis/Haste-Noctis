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
import type {IChannelRepository} from '@noctis/api/src/channel/IChannelRepository';
import type {ChannelService} from '@noctis/api/src/channel/services/ChannelService';
import type {GuildAuditLogService} from '@noctis/api/src/guild/GuildAuditLogService';
import {GuildDiscoveryRepository} from '@noctis/api/src/guild/repositories/GuildDiscoveryRepository';
import type {IGuildRepositoryAggregate} from '@noctis/api/src/guild/repositories/IGuildRepositoryAggregate';
import {GuildDataHelpers} from '@noctis/api/src/guild/services/data/GuildDataHelpers';
import {GuildOperationsService} from '@noctis/api/src/guild/services/data/GuildOperationsService';
import {GuildOwnershipService} from '@noctis/api/src/guild/services/data/GuildOwnershipService';
import {GuildVanityService} from '@noctis/api/src/guild/services/data/GuildVanityService';
import type {EntityAssetService} from '@noctis/api/src/infrastructure/EntityAssetService';
import type {IGatewayService} from '@noctis/api/src/infrastructure/IGatewayService';
import type {SnowflakeService} from '@noctis/api/src/infrastructure/SnowflakeService';
import type {InviteRepository} from '@noctis/api/src/invite/InviteRepository';
import type {LimitConfigService} from '@noctis/api/src/limits/LimitConfigService';
import type {RequestCache} from '@noctis/api/src/middleware/RequestCacheMiddleware';
import type {Guild} from '@noctis/api/src/models/Guild';
import type {GuildMember} from '@noctis/api/src/models/GuildMember';
import type {User} from '@noctis/api/src/models/User';
import type {IUserRepository} from '@noctis/api/src/user/IUserRepository';
import type {IWebhookRepository} from '@noctis/api/src/webhook/IWebhookRepository';
import type {GuildCreateRequest, GuildUpdateRequest} from '@noctis/schema/src/domains/guild/GuildRequestSchemas';
import type {
	GuildPartialResponse,
	GuildResponse,
	GuildVanityURLResponse,
} from '@noctis/schema/src/domains/guild/GuildResponseSchemas';

export class GuildDataService {
	private readonly helpers: GuildDataHelpers;
	private readonly operationsService: GuildOperationsService;
	private readonly vanityService: GuildVanityService;
	private readonly ownershipService: GuildOwnershipService;

	constructor(
		private readonly guildRepository: IGuildRepositoryAggregate,
		private readonly channelRepository: IChannelRepository,
		private readonly inviteRepository: InviteRepository,
		private readonly channelService: ChannelService,
		private readonly gatewayService: IGatewayService,
		private readonly entityAssetService: EntityAssetService,
		private readonly userRepository: IUserRepository,
		private readonly snowflakeService: SnowflakeService,
		private readonly webhookRepository: IWebhookRepository,
		private readonly guildAuditLogService: GuildAuditLogService,
		private readonly limitConfigService: LimitConfigService,
	) {
		this.helpers = new GuildDataHelpers(this.gatewayService, this.guildAuditLogService);

		this.operationsService = new GuildOperationsService(
			this.guildRepository,
			this.channelRepository,
			this.inviteRepository,
			this.channelService,
			this.gatewayService,
			this.entityAssetService,
			this.userRepository,
			this.snowflakeService,
			this.webhookRepository,
			this.helpers,
			this.limitConfigService,
			new GuildDiscoveryRepository(),
		);

		this.vanityService = new GuildVanityService(this.guildRepository, this.inviteRepository, this.helpers);

		this.ownershipService = new GuildOwnershipService(this.guildRepository, this.userRepository, this.helpers);
	}

	async getGuild({userId, guildId}: {userId: UserID; guildId: GuildID}): Promise<GuildResponse> {
		return this.operationsService.getGuild({userId, guildId});
	}

	async getUserGuilds(
		userId: UserID,
		options?: {
			before?: GuildID;
			after?: GuildID;
			limit?: number;
			withCounts?: boolean;
		},
	): Promise<Array<GuildResponse>> {
		return this.operationsService.getUserGuilds(userId, options);
	}

	async getPublicGuildData(guildId: GuildID): Promise<GuildPartialResponse> {
		return this.operationsService.getPublicGuildData(guildId);
	}

	async getGuildSystem(guildId: GuildID): Promise<Guild> {
		return this.operationsService.getGuildSystem(guildId);
	}

	async createGuild(
		params: {user: User; data: GuildCreateRequest},
		auditLogReason?: string | null,
	): Promise<GuildResponse> {
		return this.operationsService.createGuild(params, auditLogReason);
	}

	async updateGuild(
		params: {userId: UserID; guildId: GuildID; data: GuildUpdateRequest; requestCache: RequestCache},
		auditLogReason?: string | null,
	): Promise<GuildResponse> {
		return this.operationsService.updateGuild(params, auditLogReason);
	}

	async getVanityURL(params: {userId: UserID; guildId: GuildID}): Promise<GuildVanityURLResponse> {
		return this.vanityService.getVanityURL(params);
	}

	async updateVanityURL(
		params: {userId: UserID; guildId: GuildID; code: string | null; requestCache: RequestCache},
		auditLogReason?: string | null,
	): Promise<{code: string}> {
		return this.vanityService.updateVanityURL(params, auditLogReason);
	}

	async deleteGuild(params: {user: User; guildId: GuildID}, auditLogReason?: string | null): Promise<void> {
		return this.operationsService.deleteGuild(params, auditLogReason);
	}

	async deleteGuildForAdmin(guildId: GuildID, _auditLogReason?: string | null): Promise<void> {
		return this.operationsService.deleteGuildById(guildId);
	}

	async transferOwnership(
		params: {userId: UserID; guildId: GuildID; newOwnerId: UserID},
		auditLogReason?: string | null,
	): Promise<GuildResponse> {
		return this.ownershipService.transferOwnership(params, auditLogReason);
	}

	async checkGuildVerification(params: {user: User; guild: Guild; member: GuildMember}): Promise<void> {
		return this.ownershipService.checkGuildVerification(params);
	}
}
