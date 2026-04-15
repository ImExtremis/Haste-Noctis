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

import {resolve} from 'node:dns/promises';
import type {
	ConnectionVerificationParams,
	IConnectionVerifier,
} from '@noctis/api/src/connection/verification/IConnectionVerifier';
import {Logger} from '@noctis/api/src/Logger';
import * as FetchUtils from '@noctis/api/src/utils/FetchUtils';

const VERIFICATION_TIMEOUT_MS = 5000;

export class DomainConnectionVerifier implements IConnectionVerifier {
	async verify(params: ConnectionVerificationParams): Promise<boolean> {
		const domain = params.identifier;
		const token = params.verification_token;

		const dnsResult = await this.checkDnsTxt(domain, token);
		if (dnsResult) {
			return true;
		}

		return this.checkWellKnown(domain, token);
	}

	private async checkDnsTxt(domain: string, token: string): Promise<boolean> {
		try {
			const records = await resolve(`_noctis.${domain}`, 'TXT');
			for (const record of records) {
				const value = record.join('');
				if (value === `noctis-verification=${token}`) {
					return true;
				}
			}
		} catch (error) {
			Logger.debug({domain, error}, 'DNS TXT verification lookup failed');
		}
		return false;
	}

	private async checkWellKnown(domain: string, token: string): Promise<boolean> {
		try {
			const response = await FetchUtils.sendRequest({
				url: `https://${domain}/.well-known/noctis-verification`,
				method: 'GET',
				timeout: VERIFICATION_TIMEOUT_MS,
				serviceName: 'connection_verification',
			});
			if (response.status < 200 || response.status >= 300) {
				return false;
			}

			const body = await FetchUtils.streamToString(response.stream);
			return body.trim() === token;
		} catch (error) {
			Logger.debug({domain, error}, 'Well-known verification lookup failed');
			return false;
		}
	}
}
