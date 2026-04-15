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

import {resolveZodIssueValidationErrorCode} from '@noctis/validation/src/error_map/ZodIssueErrorCodeResolver';
import {isValidationErrorCode} from '@noctis/validation/src/shared/ValidationErrorCodeUtils';
import {z} from 'zod';

let isNoctisErrorMapInitialized = false;

export function noctisZodErrorMap(
	issue: Parameters<z.core.$ZodErrorMap>[0],
): {message: string} | string | undefined | null {
	if (typeof issue.message === 'string' && isValidationErrorCode(issue.message)) {
		return {message: issue.message};
	}

	return {message: resolveZodIssueValidationErrorCode(issue)};
}

export function initializeNoctisErrorMap(): void {
	if (isNoctisErrorMapInitialized) {
		return;
	}

	z.config({customError: noctisZodErrorMap});
	isNoctisErrorMapInitialized = true;
}
