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

import {createGuildID, createUserID} from '@noctis/api/src/BrandedTypes';
import {DefaultUserOnly, LoginRequired} from '@noctis/api/src/middleware/AuthMiddleware';
import {RateLimitMiddleware} from '@noctis/api/src/middleware/RateLimitMiddleware';
import {OpenAPI} from '@noctis/api/src/middleware/ResponseTypeMiddleware';
import {RateLimitConfigs} from '@noctis/api/src/RateLimitConfig';
import type {HonoApp} from '@noctis/api/src/types/HonoEnv';
import {Validator} from '@noctis/api/src/Validator';
import {GuildIdParam} from '@noctis/schema/src/domains/common/CommonParamSchemas';
import {GuildAuditLogListQuery, GuildAuditLogListResponse} from '@noctis/schema/src/domains/guild/GuildAuditLogSchemas';

export function GuildAuditLogController(app: HonoApp) {
	app.get(
		'/guilds/:guild_id/audit-logs',
		RateLimitMiddleware(RateLimitConfigs.GUILD_AUDIT_LOGS),
		LoginRequired,
		DefaultUserOnly,
		Validator('param', GuildIdParam),
		Validator('query', GuildAuditLogListQuery),
		OpenAPI({
			operationId: 'list_guild_audit_logs',
			summary: 'List guild audit logs',
			responseSchema: GuildAuditLogListResponse,
			statusCode: 200,
			security: ['botToken', 'bearerToken', 'sessionToken'],
			tags: ['Guilds'],
			description:
				'List guild audit logs. Only default users can access. Requires view_audit_logs permission. Returns guild activity history with pagination and action filtering.',
		}),
		async (ctx) => {
			const userId = ctx.get('user').id;
			const guildId = createGuildID(ctx.req.valid('param').guild_id);
			const query = ctx.req.valid('query');

			const requestCache = ctx.get('requestCache');
			const response = await ctx.get('guildService').listGuildAuditLogs({
				userId,
				guildId,
				requestCache,
				limit: query.limit ?? undefined,
				beforeLogId: query.before ?? undefined,
				afterLogId: query.after ?? undefined,
				filterUserId: query.user_id ? createUserID(query.user_id) : undefined,
				actionType: query.action_type,
			});

			return ctx.json(response);
		},
	);
}
