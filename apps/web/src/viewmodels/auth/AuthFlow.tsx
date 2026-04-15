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

import * as AuthenticationActionCreators from '@app/actions/AuthenticationActionCreators';
import {Endpoints} from '@app/Endpoints';
import http from '@app/lib/HttpClient';
import {Logger} from '@app/lib/Logger';
import {generateKeyPair} from '@app/lib/E2EEncryption';
import {
	clearActiveKey,
	getStoredPublicKeyBase64,
	hasStoredKeyPair,
	loadKeyPair,
	storeKeyPair,
} from '@app/lib/E2EKeyStorage';
import type {AuthenticationResponseJSON, PublicKeyCredentialRequestOptionsJSON} from '@simplewebauthn/browser';

const logger = new Logger('AuthFlow');

export interface LoginSuccessPayload {
	token: string;
	userId: string;
	redirect_to?: string;
}

export interface MfaChallenge {
	ticket: string;
	sms: boolean;
	totp: boolean;
	webauthn: boolean;
}

export interface IpAuthorizationChallenge {
	ticket: string;
	email: string;
	resendAvailableIn: number;
}

export type LoginResult =
	| {type: 'success'; payload: LoginSuccessPayload}
	| {type: 'mfa'; challenge: MfaChallenge}
	| {type: 'ip_authorization'; challenge: IpAuthorizationChallenge};

export async function loginWithPassword({
	email,
	password,
	inviteCode,
}: {
	email: string;
	password: string;
	inviteCode?: string;
}): Promise<LoginResult> {
	const response = await AuthenticationActionCreators.login({
		email,
		password,
		inviteCode,
	});

	if (AuthenticationActionCreators.isIpAuthorizationRequiredResponse(response)) {
		return {
			type: 'ip_authorization',
			challenge: {
				ticket: response.ticket,
				email: response.email,
				resendAvailableIn: response.resend_available_in ?? 30,
			},
		};
	}

	if (response.mfa) {
		return {
			type: 'mfa',
			challenge: {
				ticket: response.ticket,
				sms: response.sms,
				totp: response.totp,
				webauthn: response.webauthn,
			},
		};
	}

	const successResponse = response as {token: string; user_id: string};

	// D3: Attempt to load E2E key pair on login (non-fatal)
	void (async () => {
		try {
			const userId = successResponse.user_id;
			const hasKey = await hasStoredKeyPair(userId);
			if (hasKey) {
				// Key exists — load it using the password the user just typed
				const loaded = await loadKeyPair(userId, password);
				if (loaded) {
					logger.debug('E2E key pair loaded successfully on login');
				} else {
					logger.warn('E2E key pair found but failed to decrypt — password may have changed');
				}
			} else {
				// No key in IndexedDB — generate one and upload asynchronously
				// This handles existing users who pre-date E2E key generation
				logger.debug('No E2E key pair found for user — generating new one in background');
				const keyPair = await generateKeyPair();
				await storeKeyPair(userId, keyPair.privateKey, keyPair.publicKey, keyPair.publicKeyBase64, password);
				await http.put({url: Endpoints.USER_E2E_PUBLIC_KEY, body: {public_key: keyPair.publicKeyBase64}});
				logger.debug('E2E key pair generated and uploaded for existing user on login');
			}
		} catch (e2eError) {
			// Never let E2E failures block the login — it's an enhancement, not a gate
			logger.error('E2E key initialization failed on login (non-fatal):', e2eError);
		}
	})();

	return {
		type: 'success',
		payload: {
			token: successResponse.token,
			userId: successResponse.user_id,
		},
	};
}

export async function completeLoginSession(payload: LoginSuccessPayload): Promise<void> {
	await AuthenticationActionCreators.completeLogin(payload);
}

/** Clear the E2E key from memory — called on logout. */
export function clearE2EKeyOnLogout(): void {
	clearActiveKey();
}

/** Get the stored public key base64 for a user (for key verification UI). */
export async function getE2EPublicKeyForUser(userId: string): Promise<string | null> {
	return getStoredPublicKeyBase64(userId);
}

export async function startSession(token: string): Promise<void> {
	AuthenticationActionCreators.startSession(token, {startGateway: true});
}

export type MfaCodeMethod = 'sms' | 'totp';

export async function loginWithMfaCode({
	code,
	ticket,
	inviteCode,
	method,
}: {
	code: string;
	ticket: string;
	inviteCode?: string;
	method: MfaCodeMethod;
}): Promise<LoginSuccessPayload> {
	const response =
		method === 'sms'
			? await AuthenticationActionCreators.loginMfaSms(code, ticket, inviteCode)
			: await AuthenticationActionCreators.loginMfaTotp(code, ticket, inviteCode);

	return {token: response.token, userId: response.user_id};
}

export async function sendMfaSms(ticket: string): Promise<void> {
	await AuthenticationActionCreators.loginMfaSmsSend(ticket);
}

export async function getWebAuthnMfaOptions(ticket: string): Promise<PublicKeyCredentialRequestOptionsJSON> {
	return AuthenticationActionCreators.getWebAuthnMfaOptions(ticket);
}

export async function authenticateMfaWithWebAuthn({
	response,
	challenge,
	ticket,
	inviteCode,
}: {
	response: AuthenticationResponseJSON;
	challenge: string;
	ticket: string;
	inviteCode?: string;
}): Promise<LoginSuccessPayload> {
	const result = await AuthenticationActionCreators.loginMfaWebAuthn(response, challenge, ticket, inviteCode);
	return {token: result.token, userId: result.user_id};
}

export async function getWebAuthnAuthenticationOptions(): Promise<PublicKeyCredentialRequestOptionsJSON> {
	return AuthenticationActionCreators.getWebAuthnAuthenticationOptions();
}

export async function authenticateWithWebAuthn({
	response,
	challenge,
	inviteCode,
}: {
	response: AuthenticationResponseJSON;
	challenge: string;
	inviteCode?: string;
}): Promise<LoginSuccessPayload> {
	const result = await AuthenticationActionCreators.authenticateWithWebAuthn(response, challenge, inviteCode);
	return {token: result.token, userId: result.user_id};
}

export async function startSsoLogin({redirectTo}: {redirectTo?: string}): Promise<{authorizationUrl: string}> {
	const result = await AuthenticationActionCreators.startSso(redirectTo);
	return {authorizationUrl: result.authorization_url};
}

export async function completeSsoLogin({code, state}: {code: string; state: string}): Promise<LoginSuccessPayload> {
	const result = await AuthenticationActionCreators.completeSso({code, state});
	return {
		token: result.token,
		userId: result.user_id,
		redirect_to: result.redirect_to,
	};
}

interface RegisterSuccessResult {
	type: 'success';
	payload: LoginSuccessPayload;
}

export type RegisterResult = RegisterSuccessResult;

export async function registerAccount({
	email,
	globalName,
	username,
	password,
	dateOfBirth,
	consent,
	inviteCode,
	giftCode,
}: {
	email: string;
	globalName?: string;
	username?: string;
	password: string;
	dateOfBirth: string;
	consent: boolean;
	inviteCode?: string;
	giftCode?: string;
}): Promise<RegisterResult> {
	const response = await AuthenticationActionCreators.register({
		email,
		global_name: globalName,
		username,
		password,
		date_of_birth: dateOfBirth,
		consent,
		invite_code: inviteCode ?? giftCode,
	});

	// D3: Generate and persist E2E key pair on registration (non-fatal)
	void (async () => {
		try {
			const userId = response.user_id;
			const keyPair = await generateKeyPair();
			await storeKeyPair(userId, keyPair.privateKey, keyPair.publicKey, keyPair.publicKeyBase64, password);
			await http.put({url: Endpoints.USER_E2E_PUBLIC_KEY, body: {public_key: keyPair.publicKeyBase64}});
			logger.debug('E2E key pair generated and uploaded on registration');
		} catch (e2eError) {
			logger.error('E2E key generation failed on registration (non-fatal):', e2eError);
		}
	})();

	return {
		type: 'success',
		payload: {token: response.token, userId: response.user_id},
	};
}

export async function requestPasswordReset(email: string): Promise<void> {
	return AuthenticationActionCreators.forgotPassword(email);
}

export type PasswordResetResult =
	| {type: 'success'; payload: LoginSuccessPayload}
	| {type: 'mfa'; challenge: MfaChallenge};

export async function resetPassword(token: string, password: string): Promise<PasswordResetResult> {
	const response = await AuthenticationActionCreators.resetPassword(token, password);
	if ('token' in response) {
		return {
			type: 'success',
			payload: {token: response.token, userId: response.user_id},
		};
	}

	return {
		type: 'mfa',
		challenge: {
			ticket: response.ticket,
			sms: response.sms,
			totp: response.totp,
			webauthn: response.webauthn,
		},
	};
}

export async function verifyEmail(token: string): Promise<AuthenticationActionCreators.VerificationResult> {
	return AuthenticationActionCreators.verifyEmail(token);
}

export async function resendVerificationEmail(): Promise<AuthenticationActionCreators.VerificationResult> {
	return AuthenticationActionCreators.resendVerificationEmail();
}

export async function authorizeIp(token: string): Promise<AuthenticationActionCreators.VerificationResult> {
	return AuthenticationActionCreators.authorizeIp(token);
}

export const VerificationResult = AuthenticationActionCreators.VerificationResult;

export async function resendIpAuthorization(ticket: string): Promise<void> {
	return AuthenticationActionCreators.resendIpAuthorization(ticket);
}

export async function pollIpAuthorization(
	ticket: string,
): Promise<AuthenticationActionCreators.IpAuthorizationPollResult> {
	return AuthenticationActionCreators.pollIpAuthorization(ticket);
}

export async function initiateDesktopHandoff() {
	return AuthenticationActionCreators.initiateDesktopHandoff();
}

export async function completeDesktopHandoff(params: {code: string; token: string; userId: string}) {
	return AuthenticationActionCreators.completeDesktopHandoff(params);
}
