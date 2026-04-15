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

import {createUserID} from '@noctis/api/src/BrandedTypes';
import {Logger} from '@noctis/api/src/Logger';
import {processUserDeletion} from '@noctis/api/src/user/services/UserDeletionService';
import {getWorkerDependencies} from '@noctis/api/src/worker/WorkerContext';
import type {WorkerTaskHandler} from '@noctis/worker/src/contracts/WorkerTask';
import {z} from 'zod';

const PayloadSchema = z.object({
	userId: z.string(),
	deletionReasonCode: z.number(),
});

const userProcessPendingDeletion: WorkerTaskHandler = async (payload, helpers) => {
	const validated = PayloadSchema.parse(payload);
	helpers.logger.debug({payload: validated}, 'Processing userProcessPendingDeletion task');

	const userId = createUserID(BigInt(validated.userId));

	try {
		const deps = getWorkerDependencies();
		await processUserDeletion(userId, validated.deletionReasonCode, deps);
	} catch (error) {
		Logger.error({error, userId}, 'Failed to delete user account');
		throw error;
	}
};

export default userProcessPendingDeletion;
