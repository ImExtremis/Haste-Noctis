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

import dns from 'node:dns';
import {Config} from '@noctis/api/src/Config';
import type {ICacheService} from '@noctis/cache/src/ICacheService';
import type {GeoipResult} from '@noctis/geoip/src/GeoipLookup';
import {formatGeoipLocation, lookupGeoipByIp} from '@noctis/geoip/src/GeoipLookup';
import {extractClientIp} from '@noctis/ip_utils/src/ClientIp';
import {seconds} from 'itty-time';

const REVERSE_DNS_CACHE_TTL_SECONDS = seconds('1 day');
const REVERSE_DNS_CACHE_PREFIX = 'reverse-dns:';

export async function lookupGeoip(req: Request): Promise<GeoipResult>;
export async function lookupGeoip(ip: string): Promise<GeoipResult>;
export async function lookupGeoip(input: string | Request): Promise<GeoipResult> {
	const ip =
		typeof input === 'string'
			? input
			: extractClientIp(input, {trustCfConnectingIp: Config.proxy.trust_cf_connecting_ip});
	if (!ip) {
		return {countryCode: null, normalizedIp: null, city: null, region: null, countryName: null};
	}
	return lookupGeoipByIp(ip, Config.geoip.maxmindDbPath);
}

export async function getIpAddressReverse(ip: string, cacheService?: ICacheService): Promise<string | null> {
	const cacheKey = `${REVERSE_DNS_CACHE_PREFIX}${ip}`;
	if (cacheService) {
		const cached = await cacheService.get<string | null>(cacheKey);
		if (cached !== null) return cached === '' ? null : cached;
	}

	let result: string | null = null;
	try {
		const hostnames = await dns.promises.reverse(ip);
		result = hostnames[0] ?? null;
	} catch {
		result = null;
	}

	if (cacheService) {
		await cacheService.set(cacheKey, result ?? '', REVERSE_DNS_CACHE_TTL_SECONDS);
	}

	return result;
}

export async function getLocationLabelFromIp(ip: string): Promise<string | null> {
	const result = await lookupGeoipByIp(ip, Config.geoip.maxmindDbPath);
	return formatGeoipLocation(result);
}
