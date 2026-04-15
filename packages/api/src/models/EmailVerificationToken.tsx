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

import type {UserID} from '@noctis/api/src/BrandedTypes';
import {createEmailVerificationToken} from '@noctis/api/src/BrandedTypes';
import type {EmailVerificationTokenRow} from '@noctis/api/src/database/types/AuthTypes';

export class EmailVerificationToken {
	readonly token: string;
	readonly userId: UserID;
	readonly email: string;

	constructor(row: EmailVerificationTokenRow) {
		this.token = row.token_;
		this.userId = row.user_id;
		this.email = row.email;
	}

	toRow(): EmailVerificationTokenRow {
		return {
			token_: createEmailVerificationToken(this.token),
			user_id: this.userId,
			email: this.email,
		};
	}
}
