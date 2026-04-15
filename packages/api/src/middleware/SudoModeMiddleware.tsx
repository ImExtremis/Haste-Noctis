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

import {getSudoModeService} from '@noctis/api/src/auth/services/SudoModeService';
import type {HonoEnv} from '@noctis/api/src/types/HonoEnv';
import {getSudoCookie} from '@noctis/api/src/utils/SudoCookieUtils';
import {createMiddleware} from 'hono/factory';

export const SUDO_MODE_HEADER = 'X-Noctis-Sudo-Mode-JWT';
export const SudoModeMiddleware = createMiddleware<HonoEnv>(async (ctx, next) => {
	const user = ctx.get('user');

	ctx.set('sudoModeValid', false);
	ctx.set('sudoModeToken', null);

	if (!user) {
		await next();
		return;
	}

	if (user.isBot) {
		ctx.set('sudoModeValid', true);
		await next();
		return;
	}

	const sudoToken = ctx.req.header(SUDO_MODE_HEADER);

	let tokenToVerify: string | undefined = sudoToken;

	if (!tokenToVerify) {
		tokenToVerify = getSudoCookie(ctx, user.id.toString());
	}

	if (!tokenToVerify) {
		await next();
		return;
	}

	const sudoModeService = getSudoModeService();
	const isValid = await sudoModeService.verifySudoToken(tokenToVerify, user.id);

	if (isValid) {
		ctx.set('sudoModeValid', true);
		ctx.set('sudoModeToken', tokenToVerify);
	}

	await next();
});
