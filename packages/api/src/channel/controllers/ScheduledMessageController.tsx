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

import {createChannelID} from '@noctis/api/src/BrandedTypes';
import {parseScheduledMessageInput} from '@noctis/api/src/channel/controllers/ScheduledMessageParsing';
import {DefaultUserOnly, LoginRequired} from '@noctis/api/src/middleware/AuthMiddleware';
import {RateLimitMiddleware} from '@noctis/api/src/middleware/RateLimitMiddleware';
import {OpenAPI} from '@noctis/api/src/middleware/ResponseTypeMiddleware';
import {RateLimitConfigs} from '@noctis/api/src/RateLimitConfig';
import type {HonoApp} from '@noctis/api/src/types/HonoEnv';
import {Validator} from '@noctis/api/src/Validator';
import {ChannelIdParam} from '@noctis/schema/src/domains/common/CommonParamSchemas';
import {ScheduledMessageResponseSchema} from '@noctis/schema/src/domains/message/ScheduledMessageSchemas';

export function ScheduledMessageController(app: HonoApp) {
	app.post(
		'/channels/:channel_id/messages/schedule',
		RateLimitMiddleware(RateLimitConfigs.CHANNEL_MESSAGE_CREATE),
		LoginRequired,
		DefaultUserOnly,
		Validator('param', ChannelIdParam),
		OpenAPI({
			operationId: 'schedule_message',
			summary: 'Schedule a message to send later',
			description:
				'Schedules a message to be sent at a specified time. Only available for regular user accounts. Requires permission to send messages in the target channel. Message is sent automatically at the scheduled time. Returns the scheduled message object with delivery time.',
			responseSchema: ScheduledMessageResponseSchema,
			statusCode: 201,
			security: ['bearerToken', 'sessionToken'],
			tags: 'Channels',
		}),
		async (ctx) => {
			const user = ctx.get('user');
			const channelId = createChannelID(ctx.req.valid('param').channel_id);
			const scheduledMessageService = ctx.get('scheduledMessageService');

			const {message, scheduledLocalAt, timezone} = await parseScheduledMessageInput({
				ctx,
				user,
				channelId,
			});

			const scheduledMessage = await scheduledMessageService.createScheduledMessage({
				user,
				channelId,
				data: message,
				scheduledLocalAt,
				timezone,
			});

			return ctx.json(scheduledMessage.toResponse(), 201);
		},
	);
}
