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

import type {IBlueskyOAuthService} from '@noctis/api/src/bluesky/IBlueskyOAuthService';
import type {
	ConnectionVerificationParams,
	IConnectionVerifier,
} from '@noctis/api/src/connection/verification/IConnectionVerifier';
import {Logger} from '@noctis/api/src/Logger';

export class BlueskyOAuthVerifier implements IConnectionVerifier {
	constructor(private readonly oauthService: IBlueskyOAuthService) {}

	async verify(params: ConnectionVerificationParams): Promise<boolean> {
		try {
			const result = await this.oauthService.restoreAndVerify(params.identifier);
			return result !== null;
		} catch (error) {
			Logger.error(
				{
					identifier: params.identifier,
					error: error instanceof Error ? error.message : String(error),
				},
				'Failed to verify Bluesky connection',
			);
			return false;
		}
	}
}
