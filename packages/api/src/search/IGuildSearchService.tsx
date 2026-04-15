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

import type {GuildID} from '@noctis/api/src/BrandedTypes';
import type {Guild} from '@noctis/api/src/models/Guild';
import type {GuildDiscoveryContext} from '@noctis/api/src/search/guild/GuildSearchSerializer';
import type {
	ISearchAdapter as SchemaISearchAdapter,
	SearchResult as SchemaSearchResult,
} from '@noctis/schema/src/contracts/search/SearchAdapterTypes';
import type {GuildSearchFilters, SearchableGuild} from '@noctis/schema/src/contracts/search/SearchDocumentTypes';

export interface IGuildSearchService extends SchemaISearchAdapter<GuildSearchFilters, SearchableGuild> {
	indexGuild(guild: Guild, discovery?: GuildDiscoveryContext): Promise<void>;
	indexGuilds(guilds: Array<Guild>): Promise<void>;
	updateGuild(guild: Guild, discovery?: GuildDiscoveryContext): Promise<void>;
	deleteGuild(guildId: GuildID): Promise<void>;
	deleteGuilds(guildIds: Array<GuildID>): Promise<void>;
	searchGuilds(
		query: string,
		filters: GuildSearchFilters,
		options?: {limit?: number; offset?: number},
	): Promise<SchemaSearchResult<SearchableGuild>>;
}
