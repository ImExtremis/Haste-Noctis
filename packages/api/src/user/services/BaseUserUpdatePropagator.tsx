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
import type {IGatewayService} from '@noctis/api/src/infrastructure/IGatewayService';
import type {UserCacheService} from '@noctis/api/src/infrastructure/UserCacheService';
import type {User} from '@noctis/api/src/models/User';
import {invalidateUserCache, updateUserCache} from '@noctis/api/src/user/UserCacheHelpers';
import {mapUserToPrivateResponse} from '@noctis/api/src/user/UserMappers';

export interface BaseUserUpdatePropagatorDeps {
	userCacheService: UserCacheService;
	gatewayService: IGatewayService;
}

export class BaseUserUpdatePropagator {
	constructor(protected readonly baseDeps: BaseUserUpdatePropagatorDeps) {}

	async dispatchUserUpdate(user: User): Promise<void> {
		await this.baseDeps.gatewayService.dispatchPresence({
			userId: user.id,
			event: 'USER_UPDATE',
			data: mapUserToPrivateResponse(user),
		});
	}

	async invalidateUserCache(userId: UserID): Promise<void> {
		await invalidateUserCache({
			userId,
			userCacheService: this.baseDeps.userCacheService,
		});
	}

	async updateUserCache(user: User): Promise<void> {
		await updateUserCache({
			user,
			userCacheService: this.baseDeps.userCacheService,
		});
	}
}
