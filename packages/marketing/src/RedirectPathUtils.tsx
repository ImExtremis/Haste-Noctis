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

const SAFE_REDIRECT_BASE_URL = 'https://marketing.noctis.invalid';

export function sanitizeInternalRedirectPath(rawPath: string): string {
	const trimmedPath = rawPath.trim();
	if (!trimmedPath) {
		return '/';
	}

	try {
		const resolvedUrl = new URL(trimmedPath, SAFE_REDIRECT_BASE_URL);
		if (resolvedUrl.origin !== SAFE_REDIRECT_BASE_URL) {
			return '/';
		}

		if (!resolvedUrl.pathname.startsWith('/')) {
			return '/';
		}

		return `${resolvedUrl.pathname}${resolvedUrl.search}${resolvedUrl.hash}`;
	} catch {
		return '/';
	}
}
