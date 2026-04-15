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

import type {IAuditLogSearchService} from '@noctis/api/src/search/IAuditLogSearchService';
import type {IGuildMemberSearchService} from '@noctis/api/src/search/IGuildMemberSearchService';
import type {IGuildSearchService} from '@noctis/api/src/search/IGuildSearchService';
import type {IMessageSearchService} from '@noctis/api/src/search/IMessageSearchService';
import type {IReportSearchService} from '@noctis/api/src/search/IReportSearchService';
import type {ISearchProvider} from '@noctis/api/src/search/ISearchProvider';
import type {IUserSearchService} from '@noctis/api/src/search/IUserSearchService';

export class NullSearchProvider implements ISearchProvider {
	async initialize(): Promise<void> {}

	async shutdown(): Promise<void> {}

	getMessageSearchService(): IMessageSearchService | null {
		return null;
	}

	getGuildSearchService(): IGuildSearchService | null {
		return null;
	}

	getUserSearchService(): IUserSearchService | null {
		return null;
	}

	getReportSearchService(): IReportSearchService | null {
		return null;
	}

	getAuditLogSearchService(): IAuditLogSearchService | null {
		return null;
	}

	getGuildMemberSearchService(): IGuildMemberSearchService | null {
		return null;
	}
}
