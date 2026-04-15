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

import {BaseChannelAuthService, type ChannelAuthOptions} from '@noctis/api/src/channel/services/BaseChannelAuthService';
import type {User} from '@noctis/api/src/models/User';
import {checkGuildVerificationWithResponse} from '@noctis/api/src/utils/GuildVerificationUtils';
import type {GuildMemberResponse} from '@noctis/schema/src/domains/guild/GuildMemberSchemas';
import type {GuildResponse} from '@noctis/schema/src/domains/guild/GuildResponseSchemas';

export class MessageChannelAuthService extends BaseChannelAuthService {
	protected readonly options: ChannelAuthOptions = {
		errorOnMissingGuild: 'unknown_channel',
		validateNsfw: true,
	};

	async checkGuildVerification({
		user,
		guild,
		member,
	}: {
		user: User;
		guild: GuildResponse;
		member: GuildMemberResponse;
	}): Promise<void> {
		checkGuildVerificationWithResponse({user, guild, member});
	}
}
