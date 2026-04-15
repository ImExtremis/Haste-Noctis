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

/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */

import {ApiClient, type ApiResult} from '@noctis/admin/src/api/Client';
import type {Session} from '@noctis/admin/src/types/App';
import type {AdminConfig as Config} from '@noctis/admin/src/types/Config';
import type {PurgeGuildAssetsResponse} from '@noctis/schema/src/domains/admin/AdminSchemas';

export async function purgeAssets(
	config: Config,
	session: Session,
	ids: Array<string>,
	reason?: string,
): Promise<ApiResult<PurgeGuildAssetsResponse>> {
	const client = new ApiClient(config, session);
	return client.post<PurgeGuildAssetsResponse>('/admin/assets/purge', {ids}, reason);
}
