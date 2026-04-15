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

import type {GuildID, MessageID, UserID} from '@noctis/api/src/BrandedTypes';
import type {Message} from '@noctis/api/src/models/Message';
import type {
	ISearchAdapter as SchemaISearchAdapter,
	SearchResult as SchemaSearchResult,
} from '@noctis/schema/src/contracts/search/SearchAdapterTypes';
import type {MessageSearchFilters, SearchableMessage} from '@noctis/schema/src/contracts/search/SearchDocumentTypes';

export interface IMessageSearchService extends SchemaISearchAdapter<MessageSearchFilters, SearchableMessage> {
	indexMessage(message: Message, authorIsBot?: boolean): Promise<void>;
	indexMessages(messages: Array<Message>, authorBotMap?: Map<UserID, boolean>): Promise<void>;
	updateMessage(message: Message, authorIsBot?: boolean): Promise<void>;
	deleteMessage(messageId: MessageID): Promise<void>;
	deleteMessages(messageIds: Array<MessageID>): Promise<void>;
	deleteGuildMessages(guildId: GuildID): Promise<void>;
	searchMessages(
		query: string,
		filters: MessageSearchFilters,
		options?: {hitsPerPage?: number; page?: number},
	): Promise<SchemaSearchResult<SearchableMessage>>;
}
