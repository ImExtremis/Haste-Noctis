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

import EmojiStore from '@app/stores/EmojiStore';
import type {GatewayHandlerContext} from '@app/stores/gateway/handlers';
import type {GuildEmoji} from '@noctis/schema/src/domains/guild/GuildEmojiSchemas';

interface GuildEmojisUpdatePayload {
	guild_id: string;
	emojis: ReadonlyArray<GuildEmoji>;
}

export function handleGuildEmojisUpdate(data: GuildEmojisUpdatePayload, _context: GatewayHandlerContext): void {
	EmojiStore.handleGuildEmojiUpdated({guildId: data.guild_id, emojis: data.emojis});
}
