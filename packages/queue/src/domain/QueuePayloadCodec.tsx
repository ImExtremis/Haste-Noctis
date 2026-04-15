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

import type {JsonValue} from '@noctis/queue/src/types/JsonTypes';
import {JsonValueSchema} from '@noctis/queue/src/types/JsonTypes';

export function encodeQueuePayload(payload: JsonValue): Uint8Array {
	return new Uint8Array(Buffer.from(JSON.stringify(payload)));
}

export function decodeQueuePayload(payload: Uint8Array): JsonValue {
	return JsonValueSchema.parse(JSON.parse(Buffer.from(payload).toString('utf-8')));
}

export function tryDecodeQueuePayload(payload: Uint8Array): JsonValue | null {
	try {
		return decodeQueuePayload(payload);
	} catch {
		return null;
	}
}

export function decodeQueuePayloadWithFallback(payload: Uint8Array, fallback: JsonValue): JsonValue {
	const decoded = tryDecodeQueuePayload(payload);
	if (decoded === null) {
		return fallback;
	}
	return decoded;
}
