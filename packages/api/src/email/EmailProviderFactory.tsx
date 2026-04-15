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

import type {APIConfig} from '@noctis/api/src/config/APIConfig';
import type {IEmailProvider} from '@noctis/email/src/EmailProviderTypes';
import {SmtpEmailProvider} from '@noctis/email/src/SmtpEmailProvider';

export function createEmailProvider(emailConfig: APIConfig['email']): IEmailProvider | null {
	if (!emailConfig.enabled) {
		return null;
	}

	switch (emailConfig.provider) {
		case 'smtp':
			return emailConfig.smtp
				? new SmtpEmailProvider({
						host: emailConfig.smtp.host,
						port: emailConfig.smtp.port,
						username: emailConfig.smtp.username,
						password: emailConfig.smtp.password,
						secure: emailConfig.smtp.secure,
					})
				: null;
		default:
			return null;
	}
}
