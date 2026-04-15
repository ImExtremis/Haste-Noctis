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

import type {AuthService} from '@noctis/api/src/auth/AuthService';
import type {UserID} from '@noctis/api/src/BrandedTypes';
import {Config} from '@noctis/api/src/Config';
import type {IGuildRepositoryAggregate} from '@noctis/api/src/guild/repositories/IGuildRepositoryAggregate';
import type {KVAccountDeletionQueueService} from '@noctis/api/src/infrastructure/KVAccountDeletionQueueService';
import type {IUserAccountRepository} from '@noctis/api/src/user/repositories/IUserAccountRepository';
import type {UserAccountUpdatePropagator} from '@noctis/api/src/user/services/UserAccountUpdatePropagator';
import {hasPartialUserFieldsChanged} from '@noctis/api/src/user/UserMappers';
import {DeletionReasons} from '@noctis/constants/src/Core';
import {UserFlags} from '@noctis/constants/src/UserConstants';
import type {IEmailService} from '@noctis/email/src/IEmailService';
import {UserOwnsGuildsError} from '@noctis/errors/src/domains/guild/UserOwnsGuildsError';
import {UnknownUserError} from '@noctis/errors/src/domains/user/UnknownUserError';
import {ms} from 'itty-time';

interface UserAccountLifecycleServiceDeps {
	userAccountRepository: IUserAccountRepository;
	guildRepository: IGuildRepositoryAggregate;
	authService: AuthService;
	emailService: IEmailService;
	updatePropagator: UserAccountUpdatePropagator;
	kvDeletionQueue: KVAccountDeletionQueueService;
}

export class UserAccountLifecycleService {
	constructor(private readonly deps: UserAccountLifecycleServiceDeps) {}

	async selfDisable(userId: UserID): Promise<void> {
		const user = await this.deps.userAccountRepository.findUnique(userId);
		if (!user) {
			throw new UnknownUserError();
		}

		const updatedUser = await this.deps.userAccountRepository.patchUpsert(
			userId,
			{
				flags: user.flags | UserFlags.DISABLED,
			},
			user.toRow(),
		);

		await this.deps.authService.terminateAllUserSessions(userId);

		if (updatedUser) {
			await this.deps.updatePropagator.dispatchUserUpdate(updatedUser);
			if (hasPartialUserFieldsChanged(user, updatedUser)) {
				await this.deps.updatePropagator.updateUserCache(updatedUser);
			}
		}
	}

	async selfDelete(userId: UserID): Promise<void> {
		const user = await this.deps.userAccountRepository.findUnique(userId);
		if (!user) {
			throw new UnknownUserError();
		}

		const ownedGuildIds = await this.deps.guildRepository.listOwnedGuildIds(userId);
		if (ownedGuildIds.length > 0) {
			throw new UserOwnsGuildsError();
		}

		const gracePeriodMs = Config.deletionGracePeriodHours * ms('1 hour');
		const pendingDeletionAt = new Date(Date.now() + gracePeriodMs);

		const updatedUser = await this.deps.userAccountRepository.patchUpsert(
			userId,
			{
				flags: user.flags | UserFlags.SELF_DELETED,
				pending_deletion_at: pendingDeletionAt,
			},
			user.toRow(),
		);

		await this.deps.userAccountRepository.addPendingDeletion(userId, pendingDeletionAt, DeletionReasons.USER_REQUESTED);

		await this.deps.kvDeletionQueue.scheduleDeletion(userId, pendingDeletionAt, DeletionReasons.USER_REQUESTED);

		if (user.email) {
			await this.deps.emailService.sendSelfDeletionScheduledEmail(
				user.email,
				user.username,
				pendingDeletionAt,
				user.locale,
			);
		}

		await this.deps.authService.terminateAllUserSessions(userId);

		if (updatedUser) {
			await this.deps.updatePropagator.dispatchUserUpdate(updatedUser);
			if (hasPartialUserFieldsChanged(user, updatedUser)) {
				await this.deps.updatePropagator.updateUserCache(updatedUser);
			}
		}
	}
}
