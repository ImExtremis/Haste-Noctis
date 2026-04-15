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

import {HTTPException} from 'hono/http-exception';

export type NoctisErrorData = Record<string, unknown>;
export type NoctisErrorStatus = HTTPException['status'];
export interface NoctisErrorOptions {
	code: string;
	message?: string;
	status: NoctisErrorStatus;
	data?: NoctisErrorData;
	headers?: Record<string, string>;
	messageVariables?: Record<string, unknown>;
	cause?: Error;
}

export class NoctisError extends HTTPException {
	readonly code: string;
	override readonly message: string;
	override readonly status: NoctisErrorStatus;
	readonly data?: NoctisErrorData;
	readonly headers?: Record<string, string>;
	readonly messageVariables?: Record<string, unknown>;

	constructor(options: NoctisErrorOptions) {
		const resolvedMessage = options.message ?? options.code;
		super(options.status, {message: resolvedMessage, cause: options.cause});
		this.code = options.code;
		this.message = resolvedMessage;
		this.status = options.status;
		this.data = options.data;
		this.headers = options.headers;
		this.messageVariables = options.messageVariables;
		this.name = 'NoctisError';
	}

	override getResponse(): Response {
		return new Response(
			JSON.stringify({
				code: this.code,
				message: this.message,
				...this.data,
			}),
			{
				status: this.status,
				headers: {
					'Content-Type': 'application/json',
					...this.headers,
				},
			},
		);
	}

	toJSON(): Record<string, unknown> {
		return {
			code: this.code,
			message: this.message,
			...this.data,
		};
	}
}
