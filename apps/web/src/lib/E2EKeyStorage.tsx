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
 * E2EKeyStorage — Secure IndexedDB-backed key storage for E2E encryption.
 *
 * This module handles the persistence and retrieval of encrypted private keys
 * using the `idb` library (a Promise-based IndexedDB wrapper).
 *
 * Key design decisions:
 * - The user's private key is NEVER stored in plaintext. It is encrypted with
 *   AES-GCM using a key derived from the user's password via PBKDF2.
 * - The decrypted private key is held in module-level memory only and is
 *   cleared on logout or page unload.
 * - The IndexedDB database is keyed by userId so multiple accounts on the
 *   same device each have independent key storage.
 */

import {Logger} from '@app/lib/Logger';
import {openDB, type DBSchema, type IDBPDatabase} from 'idb';

const logger = new Logger('E2EKeyStorage');

const DB_NAME = 'noctis-e2e-keys';
const DB_VERSION = 1;
const STORE_NAME = 'keys';

// Key derivation parameters — these must be identical on store and retrieve.
const PBKDF2_ITERATIONS = 600_000;
const PBKDF2_HASH = 'SHA-256';
const AES_KEY_LENGTH = 256;
const AES_ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12;
const SALT_LENGTH = 16;

interface E2EKeyRecord {
	/** Owning user ID */
	userId: string;
	/** Encrypted private key bytes (AES-GCM ciphertext) */
	encryptedPrivateKey: ArrayBuffer;
	/** AES-GCM IV used during encryption */
	iv: ArrayBuffer;
	/** PBKDF2 salt used during key derivation */
	salt: ArrayBuffer;
	/** Public key (raw bytes, safe to store unencrypted) */
	publicKey: ArrayBuffer;
	/** Public key in base64 format for API upload convenience */
	publicKeyBase64: string;
	/** Timestamp when the key pair was generated */
	createdAt: number;
}

interface E2EKeysSchema extends DBSchema {
	[STORE_NAME]: {
		key: string; // userId
		value: E2EKeyRecord;
	};
}

// In-memory private key — never persisted, cleared on logout
let _decryptedPrivateKey: CryptoKey | null = null;
let _currentUserId: string | null = null;

let _db: IDBPDatabase<E2EKeysSchema> | null = null;

async function getDB(): Promise<IDBPDatabase<E2EKeysSchema>> {
	if (_db) return _db;
	_db = await openDB<E2EKeysSchema>(DB_NAME, DB_VERSION, {
		upgrade(db) {
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME, {keyPath: 'userId'});
			}
		},
	});
	return _db;
}

/**
 * Derives an AES-GCM key from a password and salt using PBKDF2.
 * This is used to encrypt/decrypt the stored private key.
 */
async function deriveWrappingKey(password: string, salt: ArrayBuffer): Promise<CryptoKey> {
	const passwordKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
		'deriveBits',
		'deriveKey',
	]);

	return crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt,
			iterations: PBKDF2_ITERATIONS,
			hash: PBKDF2_HASH,
		},
		passwordKey,
		{name: AES_ALGORITHM, length: AES_KEY_LENGTH},
		false,
		['encrypt', 'decrypt'],
	);
}

/**
 * Store a new key pair in IndexedDB, encrypted with the user's password.
 * Call this after generating a new key pair on registration.
 */
export async function storeKeyPair(
	userId: string,
	privateKey: CryptoKey,
	publicKey: CryptoKey,
	publicKeyBase64: string,
	password: string,
): Promise<void> {
	logger.debug('Storing E2E key pair for user', userId);

	const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH)).buffer as ArrayBuffer;
	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH)).buffer as ArrayBuffer;
	const wrappingKey = await deriveWrappingKey(password, salt);

	// Export the private key to raw JWK bytes for encryption
	const privateKeyJwk = await crypto.subtle.exportKey('jwk', privateKey);
	const privateKeyBytes = new TextEncoder().encode(JSON.stringify(privateKeyJwk));

	const encryptedPrivateKey = await crypto.subtle.encrypt(
		{name: AES_ALGORITHM, iv, tagLength: 128},
		wrappingKey,
		privateKeyBytes,
	);

	const publicKeyRaw = await crypto.subtle.exportKey('raw', publicKey);

	const record: E2EKeyRecord = {
		userId,
		encryptedPrivateKey,
		iv,
		salt,
		publicKey: publicKeyRaw,
		publicKeyBase64,
		createdAt: Date.now(),
	};

	const db = await getDB();
	await db.put(STORE_NAME, record);

	// Also set the in-memory key
	_decryptedPrivateKey = privateKey;
	_currentUserId = userId;

	logger.debug('E2E key pair stored and activated for user', userId);
}

/**
 * Retrieve and decrypt the private key from IndexedDB using the user's password.
 * Call this on login. Returns true if successful, false if no key found.
 */
export async function loadKeyPair(userId: string, password: string): Promise<boolean> {
	logger.debug('Loading E2E key pair for user', userId);

	const db = await getDB();
	const record = await db.get(STORE_NAME, userId);

	if (!record) {
		logger.debug('No E2E key pair found in storage for user', userId);
		return false;
	}

	try {
		const wrappingKey = await deriveWrappingKey(password, record.salt);

		const privateKeyBytes = await crypto.subtle.decrypt(
			{name: AES_ALGORITHM, iv: record.iv, tagLength: 128},
			wrappingKey,
			record.encryptedPrivateKey,
		);

		const privateKeyJwk = JSON.parse(new TextDecoder().decode(privateKeyBytes)) as JsonWebKey;
		const privateKey = await crypto.subtle.importKey('jwk', privateKeyJwk, {name: 'X25519'}, true, ['deriveBits']);

		_decryptedPrivateKey = privateKey;
		_currentUserId = userId;

		logger.debug('E2E key pair decrypted and active for user', userId);
		return true;
	} catch (error) {
		logger.error('Failed to decrypt E2E private key — wrong password or corrupted data:', error);
		return false;
	}
}

/**
 * Get the currently active in-memory private key.
 * Returns null if not loaded (user hasn't called loadKeyPair yet).
 */
export function getActivePrivateKey(): CryptoKey | null {
	return _decryptedPrivateKey;
}

/**
 * Get the current active user ID for E2E operations.
 */
export function getActiveUserId(): string | null {
	return _currentUserId;
}

/**
 * Retrieve the public key for the current user from IndexedDB.
 * Returns null if no key pair is stored.
 */
export async function getStoredPublicKeyBase64(userId: string): Promise<string | null> {
	const db = await getDB();
	const record = await db.get(STORE_NAME, userId);
	return record?.publicKeyBase64 ?? null;
}

/**
 * Check whether a key pair exists in storage for the given user.
 */
export async function hasStoredKeyPair(userId: string): Promise<boolean> {
	const db = await getDB();
	const key = await db.getKey(STORE_NAME, userId);
	return key !== undefined;
}

/**
 * Clear the in-memory private key and reset the active user.
 * Call this on logout. Does NOT remove the key from IndexedDB —
 * the user can re-load it on next login.
 */
export function clearActiveKey(): void {
	logger.debug('Clearing E2E private key from memory for user', _currentUserId);
	_decryptedPrivateKey = null;
	_currentUserId = null;
}

/**
 * Permanently delete the stored key pair from IndexedDB for a user.
 * Call this on account deletion or explicit key reset.
 * Also clears the in-memory key.
 */
export async function deleteStoredKeyPair(userId: string): Promise<void> {
	logger.debug('Deleting E2E key pair from storage for user', userId);
	const db = await getDB();
	await db.delete(STORE_NAME, userId);

	if (_currentUserId === userId) {
		clearActiveKey();
	}

	logger.debug('E2E key pair deleted for user', userId);
}

// Clear key from memory on page unload to avoid key leakage
if (typeof window !== 'undefined') {
	window.addEventListener('beforeunload', () => {
		clearActiveKey();
	});
}
