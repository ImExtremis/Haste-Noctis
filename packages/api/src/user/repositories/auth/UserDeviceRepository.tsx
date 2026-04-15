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

import type {UserID} from '@noctis/api/src/BrandedTypes';
import {Db, fetchOne, upsertOne} from '@noctis/api/src/database/Cassandra';
import type {UserDeviceRow} from '@noctis/api/src/database/types/UserDeviceTypes';
import {UserDevices} from '@noctis/api/src/Tables';

const FETCH_USER_DEVICE_CQL = UserDevices.selectCql({
	where: [UserDevices.where.eq('user_id'), UserDevices.where.eq('device_hash')],
	limit: 1,
});

export class UserDeviceRepository {
	async checkAndRecordDevice(userId: UserID, deviceHash: string): Promise<boolean> {
		const device = await fetchOne<UserDeviceRow>(FETCH_USER_DEVICE_CQL, {
			user_id: userId,
			device_hash: deviceHash,
		});

		const now = new Date();

		if (!device) {
			await upsertOne(
				UserDevices.insert({
					user_id: userId,
					device_hash: deviceHash,
					last_seen: now,
					created_at: now,
				}),
			);
			return true; // Is new device
		}

		// Update last seen
		await upsertOne(
			UserDevices.patchByPk(
				{user_id: userId, device_hash: deviceHash},
				{last_seen: Db.set(now)},
			),
		);

		return false; // Not a new device
	}
}
