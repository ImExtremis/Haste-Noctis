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

import {registerAdminControllers} from '@noctis/api/src/admin/controllers';
import {AuthController} from '@noctis/api/src/auth/AuthController';
import {BlueskyOAuthController} from '@noctis/api/src/bluesky/BlueskyOAuthController';
import {ChannelController} from '@noctis/api/src/channel/ChannelController';
import type {APIConfig} from '@noctis/api/src/config/APIConfig';
import {ConnectionController} from '@noctis/api/src/connection/ConnectionController';
import {DonationController} from '@noctis/api/src/donation/DonationController';
import {DownloadController} from '@noctis/api/src/download/DownloadController';
import {FavoriteMemeController} from '@noctis/api/src/favorite_meme/FavoriteMemeController';
import {GatewayController} from '@noctis/api/src/gateway/GatewayController';
import {GuildController} from '@noctis/api/src/guild/GuildController';
import {InstanceController} from '@noctis/api/src/instance/InstanceController';
import {InviteController} from '@noctis/api/src/invite/InviteController';
import {KlipyController} from '@noctis/api/src/klipy/KlipyController';
import {OAuth2ApplicationsController} from '@noctis/api/src/oauth/OAuth2ApplicationsController';
import {OAuth2Controller} from '@noctis/api/src/oauth/OAuth2Controller';
import {registerPackControllers} from '@noctis/api/src/pack/controllers';
import {ReadStateController} from '@noctis/api/src/read_state/ReadStateController';
import {ReportController} from '@noctis/api/src/report/ReportController';
import {SearchController} from '@noctis/api/src/search/controllers/SearchController';
import {StripeController} from '@noctis/api/src/stripe/StripeController';
import {TenorController} from '@noctis/api/src/tenor/TenorController';
import {TestHarnessController} from '@noctis/api/src/test/TestHarnessController';
import {ThemeController} from '@noctis/api/src/theme/ThemeController';
import type {HonoApp} from '@noctis/api/src/types/HonoEnv';
import {UserController} from '@noctis/api/src/user/controllers/UserController';
import {WebhookController} from '@noctis/api/src/webhook/WebhookController';

export function registerControllers(routes: HonoApp, config: APIConfig): void {
	GatewayController(routes);
	registerAdminControllers(routes);
	AuthController(routes);
	ChannelController(routes);
	ConnectionController(routes);
	BlueskyOAuthController(routes);
	InstanceController(routes);
	DownloadController(routes);
	FavoriteMemeController(routes);
	InviteController(routes);
	registerPackControllers(routes);
	ReadStateController(routes);
	ReportController(routes);
	GuildController(routes);
	SearchController(routes);
	KlipyController(routes);
	TenorController(routes);
	ThemeController(routes);

	if (config.dev.testModeEnabled || config.nodeEnv === 'development') {
		TestHarnessController(routes);
	}

	UserController(routes);
	WebhookController(routes);
	OAuth2Controller(routes);
	OAuth2ApplicationsController(routes);

	if (!config.instance.selfHosted) {
		DonationController(routes);
		StripeController(routes);
	}
}
