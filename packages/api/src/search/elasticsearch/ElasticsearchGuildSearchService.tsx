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
import {ElasticsearchSearchServiceBase} from '@noctis/api/src/search/elasticsearch/ElasticsearchSearchServiceBase';
import {convertToSearchableGuild, type GuildDiscoveryContext} from '@noctis/api/src/search/guild/GuildSearchSerializer';
import type {IGuildSearchService} from '@noctis/api/src/search/IGuildSearchService';
import {
	ElasticsearchGuildAdapter,
	type ElasticsearchGuildAdapterOptions,
} from '@noctis/elasticsearch_search/src/adapters/ElasticsearchGuildAdapter';
import type {SearchResult as SchemaSearchResult} from '@noctis/schema/src/contracts/search/SearchAdapterTypes';
import type {GuildSearchFilters, SearchableGuild} from '@noctis/schema/src/contracts/search/SearchDocumentTypes';

export interface ElasticsearchGuildSearchServiceOptions extends ElasticsearchGuildAdapterOptions {}

export class ElasticsearchGuildSearchService
	extends ElasticsearchSearchServiceBase<GuildSearchFilters, SearchableGuild, ElasticsearchGuildAdapter>
	implements IGuildSearchService
{
	constructor(options: ElasticsearchGuildSearchServiceOptions) {
		super(new ElasticsearchGuildAdapter({client: options.client}));
	}

	async indexGuild(guild: Guild, discovery?: GuildDiscoveryContext): Promise<void> {
		await this.indexDocument(convertToSearchableGuild(guild, discovery));
	}

	async indexGuilds(guilds: Array<Guild>): Promise<void> {
		if (guilds.length === 0) return;
		await this.indexDocuments(guilds.map((g) => convertToSearchableGuild(g)));
	}

	async updateGuild(guild: Guild, discovery?: GuildDiscoveryContext): Promise<void> {
		await this.updateDocument(convertToSearchableGuild(guild, discovery));
	}

	async deleteGuild(guildId: GuildID): Promise<void> {
		await this.deleteDocument(guildId.toString());
	}

	async deleteGuilds(guildIds: Array<GuildID>): Promise<void> {
		await this.deleteDocuments(guildIds.map((id) => id.toString()));
	}

	searchGuilds(
		query: string,
		filters: GuildSearchFilters,
		options?: {limit?: number; offset?: number},
	): Promise<SchemaSearchResult<SearchableGuild>> {
		return this.search(query, filters, options);
	}
}
