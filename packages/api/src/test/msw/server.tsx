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

import {createDockerEnginePassthroughHandlers} from '@noctis/api/src/test/msw/handlers/DockerEngineHandlers';
import {createMeilisearchPassthroughHandlers} from '@noctis/api/src/test/msw/handlers/MeilisearchHandlers';
import {createNcmecHandlers} from '@noctis/api/src/test/msw/handlers/NcmecHandlers';
import {createPwnedPasswordsRangeHandler} from '@noctis/api/src/test/msw/handlers/PwnedPasswordsHandlers';
import {setupServer} from 'msw/node';

export const server = setupServer(
	...createDockerEnginePassthroughHandlers(),
	...createMeilisearchPassthroughHandlers(),
	createPwnedPasswordsRangeHandler(),
	...createNcmecHandlers(),
);
