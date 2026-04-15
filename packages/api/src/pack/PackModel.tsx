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

import type {ExpressionPack} from '@noctis/api/src/models/ExpressionPack';
import type {PackSummaryResponse} from '@noctis/schema/src/domains/pack/PackSchemas';

export function mapPackToSummary(pack: ExpressionPack, installedAt?: Date | null): PackSummaryResponse {
	const summary: PackSummaryResponse = {
		id: pack.id.toString(),
		name: pack.name,
		description: pack.description,
		type: pack.type,
		creator_id: pack.creatorId.toString(),
		created_at: pack.createdAt.toISOString(),
		updated_at: pack.updatedAt.toISOString(),
	};
	if (installedAt) {
		summary.installed_at = installedAt.toISOString();
	}
	return summary;
}
