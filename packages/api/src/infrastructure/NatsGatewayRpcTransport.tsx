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

import {GatewayRpcMethodError, GatewayRpcMethodErrorCodes} from '@noctis/api/src/infrastructure/GatewayRpcError';
import type {IGatewayRpcTransport} from '@noctis/api/src/infrastructure/IGatewayRpcTransport';
import type {INatsConnectionManager} from '@noctis/nats/src/INatsConnectionManager';
import {type Msg, StringCodec} from 'nats';

const NATS_REQUEST_TIMEOUT_MS = 10_000;
const NATS_SUBJECT_PREFIX = 'rpc.gateway.';

interface NatsRpcResponse {
	ok: boolean;
	result?: unknown;
	error?: string;
}

export class NatsGatewayRpcTransport implements IGatewayRpcTransport {
	private readonly connectionManager: INatsConnectionManager;
	private readonly codec = StringCodec();

	constructor(connectionManager: INatsConnectionManager) {
		this.connectionManager = connectionManager;
	}

	async call(method: string, params: Record<string, unknown>): Promise<unknown> {
		const subject = `${NATS_SUBJECT_PREFIX}${method}`;
		const payload = this.codec.encode(JSON.stringify(params));

		let responseMsg: Msg;
		try {
			const connection = this.connectionManager.getConnection();
			responseMsg = await connection.request(subject, payload, {timeout: NATS_REQUEST_TIMEOUT_MS});
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === 'NO_RESPONDERS' || error.name === 'NoRespondersError') {
					throw new GatewayRpcMethodError(GatewayRpcMethodErrorCodes.NO_RESPONDERS);
				}
				if (error.message === 'TIMEOUT' || error.name === 'TimeoutError') {
					throw new GatewayRpcMethodError(GatewayRpcMethodErrorCodes.TIMEOUT);
				}
			}
			throw error;
		}

		const responseText = this.codec.decode(responseMsg.data);
		const response = JSON.parse(responseText) as NatsRpcResponse;

		if (!response.ok) {
			throw new GatewayRpcMethodError(response.error ?? GatewayRpcMethodErrorCodes.INTERNAL_ERROR);
		}

		return response.result;
	}

	async destroy(): Promise<void> {
		await this.connectionManager.drain();
	}
}
