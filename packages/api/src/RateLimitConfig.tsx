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

import {AdminRateLimitConfigs} from '@noctis/api/src/rate_limit_configs/AdminRateLimitConfig';
import {AuthRateLimitConfigs} from '@noctis/api/src/rate_limit_configs/AuthRateLimitConfig';
import {ChannelRateLimitConfigs} from '@noctis/api/src/rate_limit_configs/ChannelRateLimitConfig';
import {DiscoveryRateLimitConfigs} from '@noctis/api/src/rate_limit_configs/DiscoveryRateLimitConfig';
import {DonationRateLimitConfigs} from '@noctis/api/src/rate_limit_configs/DonationRateLimitConfig';
import {GuildRateLimitConfigs} from '@noctis/api/src/rate_limit_configs/GuildRateLimitConfig';
import {IntegrationRateLimitConfigs} from '@noctis/api/src/rate_limit_configs/IntegrationRateLimitConfig';
import {InviteRateLimitConfigs} from '@noctis/api/src/rate_limit_configs/InviteRateLimitConfig';
import {MiscRateLimitConfigs} from '@noctis/api/src/rate_limit_configs/MiscRateLimitConfig';
import {OAuthRateLimitConfigs} from '@noctis/api/src/rate_limit_configs/OAuthRateLimitConfig';
import {PackRateLimitConfigs} from '@noctis/api/src/rate_limit_configs/PackRateLimitConfig';
import type {RateLimitSection} from '@noctis/api/src/rate_limit_configs/RateLimitHelpers';
import {mergeRateLimitSections} from '@noctis/api/src/rate_limit_configs/RateLimitHelpers';
import {UserRateLimitConfigs} from '@noctis/api/src/rate_limit_configs/UserRateLimitConfig';
import {WebhookRateLimitConfigs} from '@noctis/api/src/rate_limit_configs/WebhookRateLimitConfig';

const rateLimitSections = [
	AuthRateLimitConfigs,
	OAuthRateLimitConfigs,
	UserRateLimitConfigs,
	ChannelRateLimitConfigs,
	DiscoveryRateLimitConfigs,
	DonationRateLimitConfigs,
	GuildRateLimitConfigs,
	InviteRateLimitConfigs,
	WebhookRateLimitConfigs,
	IntegrationRateLimitConfigs,
	AdminRateLimitConfigs,
	MiscRateLimitConfigs,
	PackRateLimitConfigs,
] satisfies ReadonlyArray<RateLimitSection>;

export const RateLimitConfigs = mergeRateLimitSections(...rateLimitSections);
