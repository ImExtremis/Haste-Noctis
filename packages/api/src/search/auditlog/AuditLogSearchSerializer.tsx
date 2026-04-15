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

import type {AdminAuditLog} from '@noctis/api/src/admin/IAdminRepository';
import type {SearchableAuditLog} from '@noctis/schema/src/contracts/search/SearchDocumentTypes';
import {snowflakeToDate} from '@noctis/snowflake/src/Snowflake';

export function convertToSearchableAuditLog(log: AdminAuditLog): SearchableAuditLog {
	const createdAt = Math.floor(snowflakeToDate(BigInt(log.logId)).getTime() / 1000);

	return {
		id: log.logId.toString(),
		logId: log.logId.toString(),
		adminUserId: log.adminUserId.toString(),
		targetType: log.targetType,
		targetId: log.targetId.toString(),
		action: log.action,
		auditLogReason: log.auditLogReason,
		createdAt,
	};
}
