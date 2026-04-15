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

import type {MiddlewareHandler} from 'hono';

export interface SecurityHeadersOptions {
	/**
	 * Whether to include the Strict-Transport-Security header.
	 * Should only be enabled in production behind HTTPS.
	 * @default false
	 */
	hsts?: boolean;
	/**
	 * Max-Age value in seconds for HSTS.
	 * @default 31536000 (1 year)
	 */
	hstsMaxAge?: number;
	/**
	 * Whether to include the HSTS includeSubDomains directive.
	 * @default true
	 */
	hstsIncludeSubDomains?: boolean;
	/**
	 * Content-Security-Policy header value.
	 * Pass `false` to disable.
	 * Pass a string to set a custom policy.
	 * Defaults to a strict API-safe policy (no HTML served from API).
	 */
	csp?: string | false;
	/**
	 * Whether to set X-Content-Type-Options: nosniff.
	 * @default true
	 */
	noSniff?: boolean;
	/**
	 * Whether to set X-Frame-Options: DENY.
	 * @default true
	 */
	noFrame?: boolean;
	/**
	 * Whether to set Referrer-Policy: strict-origin-when-cross-origin.
	 * @default true
	 */
	referrerPolicy?: boolean;
	/**
	 * Permissions-Policy header value.
	 * Pass `false` to disable. Defaults to denying most browser APIs.
	 */
	permissionsPolicy?: string | false;
}

const DEFAULT_CSP =
	"default-src 'none'; frame-ancestors 'none'; base-uri 'self';";

const DEFAULT_PERMISSIONS_POLICY =
	'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()';

/**
 * Adds HTTP security headers to every response.
 *
 * Follows OWASP recommendations:
 * - X-Content-Type-Options: nosniff
 * - X-Frame-Options: DENY
 * - Referrer-Policy: strict-origin-when-cross-origin
 * - Content-Security-Policy (configurable)
 * - Permissions-Policy (configurable)
 * - Strict-Transport-Security (opt-in, requires HTTPS)
 */
export function securityHeaders(options: SecurityHeadersOptions = {}): MiddlewareHandler {
	const {
		hsts = false,
		hstsMaxAge = 31_536_000,
		hstsIncludeSubDomains = true,
		csp = DEFAULT_CSP,
		noSniff = true,
		noFrame = true,
		referrerPolicy = true,
		permissionsPolicy = DEFAULT_PERMISSIONS_POLICY,
	} = options;

	return async (c, next) => {
		await next();

		// X-Content-Type-Options
		if (noSniff) {
			c.header('X-Content-Type-Options', 'nosniff');
		}

		// X-Frame-Options
		if (noFrame) {
			c.header('X-Frame-Options', 'DENY');
		}

		// Referrer-Policy
		if (referrerPolicy) {
			c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
		}

		// Content-Security-Policy
		if (csp !== false) {
			c.header('Content-Security-Policy', csp);
		}

		// Permissions-Policy
		if (permissionsPolicy !== false) {
			c.header('Permissions-Policy', permissionsPolicy);
		}

		// Strict-Transport-Security (HTTPS only)
		if (hsts) {
			const hstsValue = `max-age=${hstsMaxAge}${hstsIncludeSubDomains ? '; includeSubDomains' : ''}; preload`;
			c.header('Strict-Transport-Security', hstsValue);
		}

		// X-DNS-Prefetch-Control
		c.header('X-DNS-Prefetch-Control', 'off');

		// Remove Server header to avoid fingerprinting
		c.res.headers.delete('Server');
		c.res.headers.delete('X-Powered-By');
	};
}
