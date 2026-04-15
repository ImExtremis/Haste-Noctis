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

import {Config} from '@noctis/api/src/Config';
import {requireAdminACL} from '@noctis/api/src/middleware/AdminMiddleware';
import {RateLimitMiddleware} from '@noctis/api/src/middleware/RateLimitMiddleware';
import {OpenAPI} from '@noctis/api/src/middleware/ResponseTypeMiddleware';
import {RateLimitConfigs} from '@noctis/api/src/RateLimitConfig';
import {ProductType} from '@noctis/api/src/stripe/ProductRegistry';
import type {HonoApp} from '@noctis/api/src/types/HonoEnv';
import {Validator} from '@noctis/api/src/Validator';
import {AdminACLs} from '@noctis/constants/src/AdminACLs';
import {FeatureNotAvailableSelfHostedError} from '@noctis/errors/src/domains/core/FeatureNotAvailableSelfHostedError';
import {
	CodesResponse,
	GenerateGiftCodesRequest,
	type GiftProductType,
} from '@noctis/schema/src/domains/admin/AdminSchemas';

function trimTrailingSlash(value: string): string {
	return value.endsWith('/') ? value.slice(0, -1) : value;
}

const giftDurations: Record<GiftProductType, number> = {
	[ProductType.GIFT_1_MONTH]: 1,
	[ProductType.GIFT_1_YEAR]: 12,
};

export function CodesAdminController(app: HonoApp) {
	app.post(
		'/admin/codes/gift',
		RateLimitMiddleware(RateLimitConfigs.ADMIN_CODE_GENERATION),
		requireAdminACL(AdminACLs.GIFT_CODES_GENERATE),
		Validator('json', GenerateGiftCodesRequest),
		OpenAPI({
			operationId: 'generate_gift_subscription_codes',
			summary: 'Generate gift subscription codes',
			description:
				'Create redeemable gift codes that grant subscription benefits (e.g. 1 month, 1 year, lifetime). Each code can be used once to activate benefits.',
			responseSchema: CodesResponse,
			statusCode: 200,
			security: 'adminApiKey',
			tags: 'Admin',
		}),
		async (ctx) => {
			if (Config.instance.selfHosted) {
				throw new FeatureNotAvailableSelfHostedError();
			}

			const {count, product_type} = ctx.req.valid('json');
			const durationMonths = giftDurations[product_type];
			const codes = await ctx.get('adminService').generateGiftCodes(count, durationMonths);
			const baseUrl = trimTrailingSlash(Config.endpoints.gift);
			return ctx.json({
				codes: codes.map((code) => `${baseUrl}/${code}`),
			});
		},
	);
}
