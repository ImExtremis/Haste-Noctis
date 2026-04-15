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

import type {GuildID, UserID, WebhookID} from '@noctis/api/src/BrandedTypes';
import type {IGuildRepositoryAggregate} from '@noctis/api/src/guild/repositories/IGuildRepositoryAggregate';
import type {LimitConfigService} from '@noctis/api/src/limits/LimitConfigService';
import type {Channel} from '@noctis/api/src/models/Channel';
import type {PackService} from '@noctis/api/src/pack/PackService';
import type {IUserRepository} from '@noctis/api/src/user/IUserRepository';
import * as EmojiUtils from '@noctis/api/src/utils/EmojiUtils';
import {ChannelTypes} from '@noctis/constants/src/ChannelConstants';
import {GuildExplicitContentFilterTypes} from '@noctis/constants/src/GuildConstants';
import type {GuildMemberResponse} from '@noctis/schema/src/domains/guild/GuildMemberSchemas';
import type {GuildResponse} from '@noctis/schema/src/domains/guild/GuildResponseSchemas';

export class MessageContentService {
	constructor(
		private userRepository: IUserRepository,
		private guildRepository: IGuildRepositoryAggregate,
		private packService: PackService,
		private limitConfigService: LimitConfigService,
	) {}

	async sanitizeCustomEmojis(params: {
		content: string;
		userId: UserID | null;
		webhookId: WebhookID | null;
		guildId: GuildID | null;
		hasPermission?: (permission: bigint) => Promise<boolean>;
	}): Promise<string> {
		const packResolver = await this.packService.createPackExpressionAccessResolver({
			userId: params.userId,
			type: 'emoji',
		});

		return await EmojiUtils.sanitizeCustomEmojis({
			...params,
			userRepository: this.userRepository,
			guildRepository: this.guildRepository,
			packResolver,
			limitConfigService: this.limitConfigService,
		});
	}

	isNSFWContentAllowed(params: {
		channel?: Channel;
		guild?: GuildResponse | null;
		member?: GuildMemberResponse | null;
	}): boolean {
		const {channel, guild, member} = params;

		if (channel?.type === ChannelTypes.GUILD_TEXT && channel.isNsfw) {
			return true;
		}

		if (!guild) {
			return false;
		}

		const explicitContentFilter = guild.explicit_content_filter;

		if (explicitContentFilter === GuildExplicitContentFilterTypes.DISABLED) {
			return true;
		}

		if (explicitContentFilter === GuildExplicitContentFilterTypes.MEMBERS_WITHOUT_ROLES) {
			const hasRoles = member && member.roles.length > 0;
			return !!hasRoles;
		}

		return false;
	}
}
