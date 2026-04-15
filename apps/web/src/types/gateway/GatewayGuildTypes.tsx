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

import type {PresenceRecord} from '@app/types/gateway/GatewayPresenceTypes';
import type {VoiceState} from '@app/types/gateway/GatewayVoiceTypes';
import type {Channel} from '@noctis/schema/src/domains/channel/ChannelSchemas';
import type {GuildEmoji, GuildSticker} from '@noctis/schema/src/domains/guild/GuildEmojiSchemas';
import type {GuildMemberData} from '@noctis/schema/src/domains/guild/GuildMemberSchemas';
import type {Guild} from '@noctis/schema/src/domains/guild/GuildResponseSchemas';
import type {GuildRole} from '@noctis/schema/src/domains/guild/GuildRoleSchemas';

export type GuildReadyData = Readonly<{
	id: string;
	properties: Omit<Guild, 'roles'>;
	channels: ReadonlyArray<Channel>;
	emojis: ReadonlyArray<GuildEmoji>;
	stickers?: ReadonlyArray<GuildSticker>;
	members: ReadonlyArray<GuildMemberData>;
	member_count: number;
	presences?: ReadonlyArray<PresenceRecord>;
	voice_states?: ReadonlyArray<VoiceState>;
	roles: ReadonlyArray<GuildRole>;
	joined_at: string;
	unavailable?: boolean;
}>;
