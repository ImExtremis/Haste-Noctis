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

import type {ChannelID} from '@noctis/api/src/BrandedTypes';
import type {MessageRequest} from '@noctis/api/src/channel/MessageTypes';
import {parseMultipartMessageData} from '@noctis/api/src/channel/services/message/MessageRequestParser';
import type {User} from '@noctis/api/src/models/User';
import type {HonoEnv} from '@noctis/api/src/types/HonoEnv';
import {parseJsonPreservingLargeIntegers} from '@noctis/api/src/utils/LosslessJsonParser';
import {ValidationErrorCodes} from '@noctis/constants/src/ValidationErrorCodes';
import {InputValidationError} from '@noctis/errors/src/domains/core/InputValidationError';
import {MessageRequestSchema} from '@noctis/schema/src/domains/message/MessageRequestSchemas';
import {createStringType} from '@noctis/schema/src/primitives/SchemaPrimitives';
import type {Context} from 'hono';
import {ms} from 'itty-time';
import type {z} from 'zod';

export const ScheduledMessageSchema = MessageRequestSchema.extend({
	scheduled_local_at: createStringType(1, 64),
	timezone: createStringType(1, 128),
});

export type ScheduledMessageSchemaType = z.infer<typeof ScheduledMessageSchema>;

export function extractScheduleFields(data: ScheduledMessageSchemaType): {
	scheduled_local_at: string;
	timezone: string;
	message: MessageRequest;
} {
	const {scheduled_local_at, timezone, ...messageData} = data;
	return {
		scheduled_local_at,
		timezone,
		message: messageData as MessageRequest,
	};
}

export async function parseScheduledMessageInput({
	ctx,
	user,
	channelId,
}: {
	ctx: Context<HonoEnv>;
	user: User;
	channelId: ChannelID;
}): Promise<{message: MessageRequest; scheduledLocalAt: string; timezone: string}> {
	const contentType = ctx.req.header('content-type') ?? '';
	const isMultipart = contentType.includes('multipart/form-data');

	if (isMultipart) {
		let parsedPayload: unknown = null;
		const message = (await parseMultipartMessageData(ctx, user, channelId, MessageRequestSchema, {
			uploadExpiresAt: new Date(Date.now() + ms('32 days')),
			onPayloadParsed(payload) {
				parsedPayload = payload;
			},
		})) as MessageRequest;

		if (!parsedPayload) {
			throw InputValidationError.fromCode('scheduled_message', ValidationErrorCodes.FAILED_TO_PARSE_MULTIPART_PAYLOAD);
		}

		const validation = ScheduledMessageSchema.safeParse(parsedPayload);
		if (!validation.success) {
			throw InputValidationError.fromCode('scheduled_message', ValidationErrorCodes.INVALID_SCHEDULED_MESSAGE_PAYLOAD);
		}

		const {scheduled_local_at, timezone} = extractScheduleFields(validation.data);
		return {message, scheduledLocalAt: scheduled_local_at, timezone};
	}

	let body: unknown;
	try {
		const raw = await ctx.req.text();
		body = raw.trim().length === 0 ? {} : parseJsonPreservingLargeIntegers(raw);
	} catch {
		throw InputValidationError.fromCode('scheduled_message', ValidationErrorCodes.INVALID_SCHEDULED_MESSAGE_PAYLOAD);
	}
	const validation = ScheduledMessageSchema.safeParse(body);
	if (!validation.success) {
		throw InputValidationError.fromCode('scheduled_message', ValidationErrorCodes.INVALID_SCHEDULED_MESSAGE_PAYLOAD);
	}

	const {scheduled_local_at, timezone, message} = extractScheduleFields(validation.data);
	return {message, scheduledLocalAt: scheduled_local_at, timezone};
}
