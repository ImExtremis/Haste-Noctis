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

import {type ApplicationID, createApplicationID, type UserID} from '@noctis/api/src/BrandedTypes';
import {Config} from '@noctis/api/src/Config';
import {SYSTEM_USER_ID} from '@noctis/api/src/constants/Core';
import {
	BatchBuilder,
	buildPatchFromData,
	executeVersionedUpdate,
	fetchMany,
	fetchOne,
} from '@noctis/api/src/database/Cassandra';
import type {ApplicationByOwnerRow, ApplicationRow} from '@noctis/api/src/database/types/OAuth2Types';
import {APPLICATION_COLUMNS} from '@noctis/api/src/database/types/OAuth2Types';
import {Application} from '@noctis/api/src/models/Application';
import type {IApplicationRepository} from '@noctis/api/src/oauth/repositories/IApplicationRepository';
import {Applications, ApplicationsByOwner} from '@noctis/api/src/Tables';
import {hashPassword} from '@noctis/api/src/utils/PasswordUtils';
import {ADMIN_OAUTH2_APPLICATION_ID} from '@noctis/constants/src/Core';

const SELECT_APPLICATION_CQL = Applications.selectCql({
	where: Applications.where.eq('application_id'),
});

const SELECT_APPLICATION_IDS_BY_OWNER_CQL = ApplicationsByOwner.selectCql({
	columns: ['application_id'],
	where: ApplicationsByOwner.where.eq('owner_user_id'),
});

const FETCH_APPLICATIONS_BY_IDS_CQL = Applications.selectCql({
	where: Applications.where.in('application_id', 'application_ids'),
});

let cachedAdminSecretHash: string | null = null;

async function getAdminSecretHash(): Promise<string | null> {
	const secret = Config.admin.oauthClientSecret;
	if (!secret) {
		return null;
	}
	if (cachedAdminSecretHash === null) {
		cachedAdminSecretHash = await hashPassword(secret);
	}
	return cachedAdminSecretHash;
}

function getAdminRedirectUri(): string {
	return `${Config.endpoints.admin}/oauth2_callback`;
}

function buildAdminApplication(secretHash: string | null): Application {
	const row: ApplicationRow = {
		application_id: createApplicationID(ADMIN_OAUTH2_APPLICATION_ID),
		owner_user_id: SYSTEM_USER_ID,
		name: 'Noctis Admin',
		bot_user_id: null,
		bot_is_public: false,
		bot_require_code_grant: false,
		oauth2_redirect_uris: new Set<string>([getAdminRedirectUri()]),
		client_secret_hash: secretHash,
		bot_token_hash: null,
		bot_token_preview: null,
		bot_token_created_at: null,
		client_secret_created_at: null,
		version: 1,
	};
	return new Application(row);
}

export class ApplicationRepository implements IApplicationRepository {
	async getApplication(applicationId: ApplicationID): Promise<Application | null> {
		if (applicationId === createApplicationID(ADMIN_OAUTH2_APPLICATION_ID)) {
			const secretHash = await getAdminSecretHash();
			if (secretHash === null) {
				return null;
			}
			return buildAdminApplication(secretHash);
		}

		const row = await fetchOne<ApplicationRow>(SELECT_APPLICATION_CQL, {application_id: applicationId});
		return row ? new Application(row) : null;
	}

	async listApplicationsByOwner(ownerUserId: UserID): Promise<Array<Application>> {
		const ids = await fetchMany<ApplicationByOwnerRow>(SELECT_APPLICATION_IDS_BY_OWNER_CQL, {
			owner_user_id: ownerUserId,
		});

		if (ids.length === 0) {
			return [];
		}

		const rows = await fetchMany<ApplicationRow>(FETCH_APPLICATIONS_BY_IDS_CQL, {
			application_ids: ids.map((r) => r.application_id),
		});

		return rows.map((r) => new Application(r));
	}

	async upsertApplication(data: ApplicationRow, oldData?: ApplicationRow | null): Promise<Application> {
		const applicationId = data.application_id;

		if (applicationId === createApplicationID(ADMIN_OAUTH2_APPLICATION_ID)) {
			throw new Error('Cannot modify the built-in admin OAuth2 application');
		}

		const result = await executeVersionedUpdate<ApplicationRow, 'application_id'>(
			async () => fetchOne<ApplicationRow>(SELECT_APPLICATION_CQL, {application_id: applicationId}),
			(current) => ({
				pk: {application_id: applicationId},
				patch: buildPatchFromData(data, current, APPLICATION_COLUMNS, ['application_id']),
			}),
			Applications,
			{initialData: oldData},
		);

		const batch = new BatchBuilder();
		batch.addPrepared(
			ApplicationsByOwner.upsertAll({
				owner_user_id: data.owner_user_id,
				application_id: data.application_id,
			}),
		);
		await batch.execute();

		return new Application({...data, version: result.finalVersion});
	}

	async deleteApplication(applicationId: ApplicationID): Promise<void> {
		if (applicationId === createApplicationID(ADMIN_OAUTH2_APPLICATION_ID)) {
			throw new Error('Cannot delete the built-in admin OAuth2 application');
		}

		const application = await this.getApplication(applicationId);
		if (!application) {
			return;
		}

		const batch = new BatchBuilder();
		batch.addPrepared(Applications.deleteByPk({application_id: applicationId}));
		batch.addPrepared(
			ApplicationsByOwner.deleteByPk({
				owner_user_id: application.ownerUserId,
				application_id: applicationId,
			}),
		);
		await batch.execute();
	}
}
