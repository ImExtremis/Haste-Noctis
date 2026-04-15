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

import {CallController} from '@noctis/api/src/channel/controllers/CallController';
import {ChannelController} from '@noctis/api/src/channel/controllers/ChannelController';
import {MessageController} from '@noctis/api/src/channel/controllers/MessageController';
import {MessageInteractionController} from '@noctis/api/src/channel/controllers/MessageInteractionController';
import {ScheduledMessageController} from '@noctis/api/src/channel/controllers/ScheduledMessageController';
import {StreamController} from '@noctis/api/src/channel/controllers/StreamController';
import type {HonoApp} from '@noctis/api/src/types/HonoEnv';

export function registerChannelControllers(app: HonoApp) {
	ChannelController(app);
	MessageInteractionController(app);
	MessageController(app);
	ScheduledMessageController(app);
	CallController(app);
	StreamController(app);
}
