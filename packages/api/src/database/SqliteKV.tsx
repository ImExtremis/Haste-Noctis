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

import {mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {DatabaseSync, type StatementSync} from 'node:sqlite';
import {Config} from '@noctis/api/src/Config';
import {Logger} from '@noctis/api/src/Logger';

export interface KvEntry<T = Record<string, unknown>> {
	key: string;
	table: string;
	value: T;
	expiresAt: number | null;
}

interface SqliteExecutor {
	exec(sql: string): void;
}

export function executeSqliteTransaction<T>(db: SqliteExecutor, fn: () => T): T {
	db.exec('BEGIN');
	try {
		const result = fn();
		db.exec('COMMIT');
		return result;
	} catch (error) {
		try {
			db.exec('ROLLBACK');
		} catch {}
		throw error;
	}
}

function upperBound(prefix: string): string {
	return `${prefix}\u{10FFFF}`;
}

const NOCTIS_TAG = '__noctis__' as const;
const NOCTIS_TAG_VERSION = 1 as const;

type NoctisTagType = 'bigint' | 'date' | 'set' | 'map' | 'buffer' | 'uint8array';

type NoctisTagged =
	| {[NOCTIS_TAG]: {v: typeof NOCTIS_TAG_VERSION; t: 'bigint'; d: string}}
	| {[NOCTIS_TAG]: {v: typeof NOCTIS_TAG_VERSION; t: 'date'; d: string}}
	| {[NOCTIS_TAG]: {v: typeof NOCTIS_TAG_VERSION; t: 'set'; d: Array<unknown>}}
	| {[NOCTIS_TAG]: {v: typeof NOCTIS_TAG_VERSION; t: 'map'; d: Array<[unknown, unknown]>}}
	| {[NOCTIS_TAG]: {v: typeof NOCTIS_TAG_VERSION; t: 'buffer'; d: string}}
	| {[NOCTIS_TAG]: {v: typeof NOCTIS_TAG_VERSION; t: 'uint8array'; d: string}};

class NoctisSerialisationError extends Error {
	override name = 'NoctisSerialisationError';
}

class NoctisDeserialisationError extends Error {
	override name = 'NoctisDeserialisationError';
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	if (value === null || typeof value !== 'object') return false;
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
}

function tag<T extends NoctisTagged[typeof NOCTIS_TAG]['t']>(
	t: T,
	d: Extract<NoctisTagged, {[NOCTIS_TAG]: {t: T}}>['__noctis__']['d'],
): Extract<NoctisTagged, {[NOCTIS_TAG]: {t: T}}> {
	return {[NOCTIS_TAG]: {v: NOCTIS_TAG_VERSION, t, d}} as Extract<NoctisTagged, {[NOCTIS_TAG]: {t: T}}>;
}

function isKnownTagType(t: unknown): t is NoctisTagType {
	return t === 'bigint' || t === 'date' || t === 'set' || t === 'map' || t === 'buffer' || t === 'uint8array';
}

function assertNever(_x: never, msg: string): never {
	throw new NoctisDeserialisationError(msg);
}

function noctisReplacer(this: unknown, key: string, value: unknown): unknown {
	const holder = this as Record<string, unknown> | null;
	const original = key === '' ? value : holder?.[key];

	if (typeof original === 'bigint') {
		return tag('bigint', original.toString());
	}

	if (original instanceof Date) {
		return tag('date', original.toISOString());
	}

	if (original instanceof Set) {
		return tag('set', Array.from(original));
	}

	if (original instanceof Map) {
		return tag('map', Array.from(original.entries()));
	}

	if (Buffer.isBuffer(original)) {
		return tag('buffer', original.toString('base64'));
	}

	if (original instanceof Uint8Array && !Buffer.isBuffer(original)) {
		return tag('uint8array', Buffer.from(original).toString('base64'));
	}

	return value;
}

function decodeTagged(meta: unknown): unknown {
	if (!isPlainObject(meta)) {
		throw new NoctisDeserialisationError('Malformed __noctis__ tag: meta is not an object');
	}

	const v = meta['v'];
	const t = meta['t'];
	const d = meta['d'];

	if (v !== NOCTIS_TAG_VERSION) {
		throw new NoctisDeserialisationError(
			`Unsupported __noctis__ tag version: ${String(v)} (expected ${String(NOCTIS_TAG_VERSION)})`,
		);
	}

	if (!isKnownTagType(t)) {
		throw new NoctisDeserialisationError(`Unknown __noctis__ tag type: ${String(t)}`);
	}

	switch (t) {
		case 'bigint': {
			if (typeof d !== 'string') throw new NoctisDeserialisationError('Malformed bigint tag: d must be a string');
			try {
				return BigInt(d);
			} catch (_e) {
				throw new NoctisDeserialisationError(`Invalid bigint payload: ${String(d)}`);
			}
		}

		case 'date': {
			if (typeof d !== 'string') throw new NoctisDeserialisationError('Malformed date tag: d must be a string');
			const dt = new Date(d);
			if (Number.isNaN(dt.getTime())) {
				throw new NoctisDeserialisationError(`Invalid date payload: ${String(d)}`);
			}
			return dt;
		}

		case 'set': {
			if (!Array.isArray(d)) throw new NoctisDeserialisationError('Malformed set tag: d must be an array');
			return new Set(d);
		}

		case 'map': {
			if (!Array.isArray(d)) throw new NoctisDeserialisationError('Malformed map tag: d must be an array');
			for (const entry of d) {
				if (!Array.isArray(entry) || entry.length !== 2) {
					throw new NoctisDeserialisationError('Malformed map tag: every entry must be a [k, v] tuple');
				}
			}
			return new Map(d as Array<[unknown, unknown]>);
		}

		case 'buffer': {
			if (typeof d !== 'string') throw new NoctisDeserialisationError('Malformed buffer tag: d must be a string');
			try {
				return Buffer.from(d, 'base64');
			} catch {
				throw new NoctisDeserialisationError('Invalid buffer payload: base64 decode failed');
			}
		}

		case 'uint8array': {
			if (typeof d !== 'string') throw new NoctisDeserialisationError('Malformed uint8array tag: d must be a string');
			let buf: Buffer;
			try {
				buf = Buffer.from(d, 'base64');
			} catch {
				throw new NoctisDeserialisationError('Invalid uint8array payload: base64 decode failed');
			}
			return new Uint8Array(buf);
		}

		default:
			return assertNever(t, `Unhandled __noctis__ tag type: ${String(t)}`);
	}
}

function noctisReviver(_key: string, value: unknown): unknown {
	if (isPlainObject(value)) {
		const keys = Object.keys(value);

		if (keys.length === 1 && keys[0] === NOCTIS_TAG) {
			const meta = (value as Record<string, unknown>)[NOCTIS_TAG];
			return decodeTagged(meta);
		}

		if (value['type'] === 'Buffer') {
			const data = (value as Record<string, unknown>)['data'];
			if (!Array.isArray(data)) throw new NoctisDeserialisationError('Malformed Buffer JSON: data must be an array');

			for (const n of data) {
				if (typeof n !== 'number' || !Number.isInteger(n) || n < 0 || n > 255) {
					throw new NoctisDeserialisationError('Malformed Buffer JSON: data must be byte integers 0..255');
				}
			}

			return Buffer.from(data as Array<number>);
		}
	}

	return value;
}

function serialize(value: unknown): Buffer {
	try {
		const json = JSON.stringify(value, noctisReplacer);
		if (json === undefined) {
			throw new NoctisSerialisationError('Value is not JSON serialisable');
		}
		return Buffer.from(json, 'utf8');
	} catch (e) {
		if (e instanceof NoctisSerialisationError) throw e;
		throw new NoctisSerialisationError(`Failed to serialise value: ${e instanceof Error ? e.message : String(e)}`);
	}
}

function deserialize<T>(blob: Buffer | Uint8Array | string): T {
	const text =
		typeof blob === 'string'
			? blob
			: Buffer.isBuffer(blob)
				? blob.toString('utf8')
				: Buffer.from(blob).toString('utf8');

	try {
		return JSON.parse(text, noctisReviver) as T;
	} catch (e) {
		if (e instanceof NoctisDeserialisationError) throw e;
		throw new NoctisDeserialisationError(`Failed to deserialise value: ${e instanceof Error ? e.message : String(e)}`);
	}
}

type KvRow = {
	key: string;
	value: Uint8Array | Buffer | string;
	expires_at: number | null;
};

class SqliteKvStore {
	private db: DatabaseSync;

	private purgeExpiredStmt: StatementSync;
	private putStmt: StatementSync;
	private getStmt: StatementSync;
	private deleteStmt: StatementSync;
	private deletePrefixStmt: StatementSync;
	private scanPrefixStmt: StatementSync;
	private scanAllStmt: StatementSync;

	constructor(path: string) {
		this.db = new DatabaseSync(path);

		this.db.exec(`
			PRAGMA journal_mode = WAL;
			PRAGMA synchronous = NORMAL;
			PRAGMA busy_timeout = 5000;

			CREATE TABLE IF NOT EXISTS kv_store (
				table_name TEXT NOT NULL,
				key TEXT NOT NULL,
				value BLOB NOT NULL,
				expires_at INTEGER,
				PRIMARY KEY(table_name, key)
			) WITHOUT ROWID;

			CREATE INDEX IF NOT EXISTS kv_store_expires_idx ON kv_store(expires_at);
		`);

		this.purgeExpiredStmt = this.db.prepare(`DELETE FROM kv_store WHERE expires_at IS NOT NULL AND expires_at <= ?;`);

		this.putStmt = this.db.prepare(`
			INSERT INTO kv_store (table_name, key, value, expires_at)
			VALUES (?, ?, ?, ?)
			ON CONFLICT(table_name, key) DO UPDATE SET
				value = excluded.value,
				expires_at = excluded.expires_at;
		`);

		this.getStmt = this.db.prepare(`SELECT value, expires_at FROM kv_store WHERE table_name = ? AND key = ?;`);
		this.deleteStmt = this.db.prepare(`DELETE FROM kv_store WHERE table_name = ? AND key = ?;`);
		this.deletePrefixStmt = this.db.prepare(`DELETE FROM kv_store WHERE table_name = ? AND key >= ? AND key < ?;`);

		this.scanPrefixStmt = this.db.prepare(`
			SELECT key, value, expires_at
			FROM kv_store
			WHERE table_name = ? AND key >= ? AND key < ?
			ORDER BY key ASC;
		`);

		this.scanAllStmt = this.db.prepare(`
			SELECT key, value, expires_at
			FROM kv_store
			WHERE table_name = ?
			ORDER BY key ASC;
		`);
	}

	private purgeExpired(now: number): void {
		this.purgeExpiredStmt.run(now);
	}

	private runInTransaction<T>(fn: () => T): T {
		return executeSqliteTransaction(this.db, fn);
	}

	put(table: string, key: string, value: unknown, ttlSeconds?: number): void {
		let expiresAt: number | null = null;

		if (ttlSeconds !== undefined) {
			if (!Number.isFinite(ttlSeconds)) throw new TypeError('ttlSeconds must be a finite number');

			if (ttlSeconds <= 0) {
				expiresAt = Date.now();
			} else {
				const ms = ttlSeconds * 1000;
				const now = Date.now();
				const sum = now + ms;
				expiresAt = Number.isSafeInteger(sum) ? sum : Number.MAX_SAFE_INTEGER;
			}
		}

		this.putStmt.run(table, key, serialize(value), expiresAt);
	}

	get<T>(table: string, key: string): T | null {
		const row = this.getStmt.get(table, key) as
			| {value: Uint8Array | Buffer | string; expires_at: number | null}
			| undefined;

		if (!row) return null;

		const now = Date.now();
		if (row.expires_at !== null && row.expires_at <= now) {
			this.delete(table, key);
			return null;
		}

		return deserialize<T>(row.value);
	}

	delete(table: string, key: string): void {
		this.deleteStmt.run(table, key);
	}

	deletePrefix(table: string, prefix: string): void {
		this.deletePrefixStmt.run(table, prefix, upperBound(prefix));
	}

	scan<T>(table: string, prefix?: string): Array<KvEntry<T>> {
		const now = Date.now();

		return this.runInTransaction(() => {
			this.purgeExpired(now);

			const rows: Array<KvRow> = prefix
				? (this.scanPrefixStmt.all(table, prefix, upperBound(prefix)) as Array<KvRow>)
				: (this.scanAllStmt.all(table) as Array<KvRow>);

			const out: Array<KvEntry<T>> = [];

			for (const row of rows) {
				if (row.expires_at !== null && row.expires_at <= now) continue;

				out.push({
					key: row.key,
					table,
					value: deserialize<T>(row.value),
					expiresAt: row.expires_at,
				});
			}

			return out;
		});
	}

	clearAll(): void {
		executeSqliteTransaction(this.db, () => {
			this.db.exec('DELETE FROM kv_store;');
			return undefined;
		});
	}

	getDatabase(): DatabaseSync {
		return this.db;
	}
}

let kvStore: SqliteKvStore | null = null;

export function getKvStore(): SqliteKvStore {
	if (!kvStore) {
		const path = Config.database?.sqlitePath ?? ':memory:';

		if (path !== ':memory:') {
			mkdirSync(dirname(path), {recursive: true});
		}

		Logger.info({path}, 'Initialising SQLite KV backend');
		kvStore = new SqliteKvStore(path);
	}

	return kvStore;
}

export function clearSqliteStore(): void {
	const store = getKvStore();
	store.clearAll();
}

function encodeKeyPart(part: unknown): string {
	if (part === null) return encodeURIComponent('null');
	if (part === undefined) return encodeURIComponent('undefined');

	switch (typeof part) {
		case 'string':
		case 'number':
		case 'boolean':
		case 'bigint':
			return encodeURIComponent(String(part));
		default: {
			const normalised = part instanceof Uint8Array && !(part instanceof Buffer) ? Buffer.from(part) : part;
			return encodeURIComponent(serialize(normalised).toString('utf8'));
		}
	}
}

export function encodeKey(parts: ReadonlyArray<unknown>): string {
	return parts.map(encodeKeyPart).join('|');
}
