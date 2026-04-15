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

/**
 * Noctis Opt-In Telemetry (D8)
 *
 * Principles:
 * - DISABLED by default. No data is ever sent until the user explicitly opts in.
 * - All events are anonymized. No user IDs, no device fingerprinting.
 * - Session token rotates every 24 hours, preventing cross-session linkage.
 * - Only three categories of events are ever collected:
 *    1. app_crash  — error message + stack trace (no user data)
 *    2. feature_used — feature name only (e.g. "polls", "voice_message")
 *    3. performance — load time in ms + broad region (not precise location)
 */

import {Logger} from '@app/lib/Logger';

const logger = new Logger('Telemetry');

// ─── Types ────────────────────────────────────────────────────────────────────

type TelemetryEvent =
	| {event: 'app_crash'; data: {errorMessage: string; stackTrace: string}}
	| {event: 'feature_used'; data: {feature: string}}
	| {event: 'performance'; data: {loadTime: number; region: string}};

// ─── Session token management ─────────────────────────────────────────────────

const SESSION_TOKEN_KEY = 'noctis_telemetry_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface SessionData {
	token: string;
	createdAt: number;
}

function generateToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(16));
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

function getSessionToken(): string {
	try {
		const raw = sessionStorage.getItem(SESSION_TOKEN_KEY);
		if (raw) {
			const {token, createdAt} = JSON.parse(raw) as SessionData;
			if (Date.now() - createdAt < SESSION_TTL_MS) {
				return token;
			}
		}
	} catch {
		// Ignore storage errors — just generate a fresh token
	}

	const newSession: SessionData = {token: generateToken(), createdAt: Date.now()};
	try {
		sessionStorage.setItem(SESSION_TOKEN_KEY, JSON.stringify(newSession));
	} catch {
		// Storage unavailable — use in-memory token for this page
	}
	return newSession.token;
}

// ─── Opt-in state ─────────────────────────────────────────────────────────────

let _optedIn = false;

/** Call this on app startup with the user's persisted telemetry preference. */
export function initTelemetry(optedIn: boolean): void {
	_optedIn = optedIn;
	if (optedIn) {
		logger.debug('Telemetry is enabled by user opt-in');
	}
}

/** Update opt-in state at runtime (e.g. when user toggles the setting). */
export function setTelemetryOptIn(optedIn: boolean): void {
	_optedIn = optedIn;
}

/** Returns whether telemetry is currently active. */
export function isTelemetryEnabled(): boolean {
	return _optedIn;
}

// ─── Event emission ───────────────────────────────────────────────────────────

const TELEMETRY_ENDPOINT = '/telemetry/events';

/**
 * Record a telemetry event.
 *
 * If the user has not opted in, this is a no-op.
 * Events are sent via `sendBeacon` (fire-and-forget, survives page unload) with
 * a fallback to fetch for environments where sendBeacon is unavailable.
 */
export function trackEvent(event: TelemetryEvent): void {
	// TELEMETRY: disabled by default, emits only if user opts in
	if (!_optedIn) return;

	const payload = {
		...event,
		sessionToken: getSessionToken(),
		timestamp: Date.now(),
	};

	const body = JSON.stringify(payload);

	try {
		if (typeof navigator.sendBeacon === 'function') {
			navigator.sendBeacon(TELEMETRY_ENDPOINT, new Blob([body], {type: 'application/json'}));
		} else {
			// Fallback: non-blocking fetch
			void fetch(TELEMETRY_ENDPOINT, {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body,
				keepalive: true,
			}).catch(() => {
				// Silently ignore — telemetry failures must never surface to users
			});
		}
	} catch {
		// Silently ignore all errors
	}
}

// ─── Convenience wrappers ─────────────────────────────────────────────────────

/** Track that a named feature was used (e.g. "polls", "voice_message"). */
export function trackFeatureUsed(feature: string): void {
	trackEvent({event: 'feature_used', data: {feature}});
}

/** Track app performance (page load time). Region is coarse (continent). */
export function trackPerformance(loadTime: number): void {
	// TELEMETRY: disabled by default, re-enabled only if user opts in
	// Region is intentionally broad — we only use navigator timezone for continent estimation
	const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'Unknown';
	const region = timeZone.split('/')[0] ?? 'Unknown'; // e.g. "Europe", "America", "Asia"
	trackEvent({event: 'performance', data: {loadTime, region}});
}

/** Track a crash. Only the error message and stack are sent — no user context. */
export function trackCrash(error: Error): void {
	trackEvent({
		event: 'app_crash',
		data: {
			errorMessage: error.message,
			stackTrace: error.stack ?? '',
		},
	});
}
