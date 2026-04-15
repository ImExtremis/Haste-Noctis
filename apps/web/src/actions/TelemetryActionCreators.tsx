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

import {Endpoints} from '@app/Endpoints';
import http from '@app/lib/HttpClient';
import {Logger} from '@app/lib/Logger';

const logger = new Logger('TelemetryActionCreators');

// D8: Telemetry opt-in endpoint
// PUT /users/@me/settings/telemetry  { opt_in: boolean }
const TELEMETRY_SETTINGS_ENDPOINT = `${Endpoints.USER_SETTINGS}/telemetry`;

/**
 * Update the user's telemetry opt-in preference.
 * When opting out, the server purges previously collected data.
 */
export async function updateTelemetryOptIn(optIn: boolean): Promise<void> {
	try {
		logger.debug('Updating telemetry opt-in preference', {optIn});
		await http.put({url: TELEMETRY_SETTINGS_ENDPOINT, body: {opt_in: optIn}});
		logger.info('Telemetry opt-in preference updated', {optIn});
	} catch (error) {
		logger.error('Failed to update telemetry opt-in:', error);
		throw error;
	}
}
