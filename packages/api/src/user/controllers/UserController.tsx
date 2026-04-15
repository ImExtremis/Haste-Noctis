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

import type {HonoApp} from '@noctis/api/src/types/HonoEnv';
import {UserAccountController} from '@noctis/api/src/user/controllers/UserAccountController';
import {UserAuthController} from '@noctis/api/src/user/controllers/UserAuthController';
import {UserChannelController} from '@noctis/api/src/user/controllers/UserChannelController';
import {UserContentController} from '@noctis/api/src/user/controllers/UserContentController';
import {UserRelationshipController} from '@noctis/api/src/user/controllers/UserRelationshipController';
import {UserScheduledMessageController} from '@noctis/api/src/user/controllers/UserScheduledMessageController';

export function UserController(app: HonoApp) {
	UserAccountController(app);
	UserAuthController(app);
	UserRelationshipController(app);
	UserChannelController(app);
	UserContentController(app);
	UserScheduledMessageController(app);
}
