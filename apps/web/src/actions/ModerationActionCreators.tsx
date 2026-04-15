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

import {Endpoints} from '@app/Endpoints';
import http from '@app/lib/HttpClient';
import {Logger} from '@app/lib/Logger';

const logger = new Logger('ModerationActionCreators');

// ─── Types ────────────────────────────────────────────────────────────────────

export type ModCaseType = 'warn' | 'kick' | 'ban' | 'timeout' | 'note';
export type ModCaseStatus = 'active' | 'dismissed' | 'expired';

export interface ModCase {
	id: string;
	guildId: string;
	targetUserId: string;
	moderatorId: string;
	type: ModCaseType;
	reason: string | null;
	status: ModCaseStatus;
	/** ISO8601 timestamp */
	createdAt: string;
	/** ISO8601 timestamp — only for timeout cases */
	expiresAt: string | null;
	/** Count of total warnings for this user in this guild */
	warnCount?: number;
}

export interface WarnUserPayload {
	reason: string;
	/** If set, sends a DM to the user with the reason */
	notifyUser?: boolean;
}

export interface WarnUserResponse {
	case: ModCase;
	/** Total number of active warnings the user now has */
	warnCount: number;
	/** Whether an automod action was triggered (e.g. kick/ban) */
	automodActionTriggered: boolean;
	/** The automod action type that was triggered, if any */
	automodAction?: ModCaseType;
}

export interface ModCaseUpdatePayload {
	reason?: string;
	status?: ModCaseStatus;
}

export interface AutomodThresholds {
	warnThresholdKick: number | null;
	warnThresholdBan: number | null;
	warnCountResetDays: number | null;
}

// ─── Action Creators ──────────────────────────────────────────────────────────

/**
 * Issue a formal warning to a guild member.
 * May trigger automod actions (kick/ban) if thresholds are configured.
 */
export async function warnUser(
	guildId: string,
	userId: string,
	payload: WarnUserPayload,
): Promise<WarnUserResponse> {
	try {
		logger.debug('Issuing warning to user', {guildId, userId, reason: payload.reason});
		const response = await http.post<WarnUserResponse>({
			url: Endpoints.GUILD_MEMBER_WARN(guildId, userId),
			body: {
				reason: payload.reason,
				notify_user: payload.notifyUser ?? true,
			},
		});
		logger.info('Warning issued', {guildId, userId, caseId: response.body.case.id});
		return response.body;
	} catch (error) {
		logger.error(`Failed to warn user ${userId} in guild ${guildId}:`, error);
		throw error;
	}
}

/**
 * Fetch all mod cases for a guild.
 * Optionally filter by target user or type.
 */
export async function fetchModCases(
	guildId: string,
	params?: {
		userId?: string;
		type?: ModCaseType;
		status?: ModCaseStatus;
		limit?: number;
		beforeId?: string;
	},
): Promise<Array<ModCase>> {
	try {
		const query: Record<string, string | number> = {};
		if (params?.userId) query.user_id = params.userId;
		if (params?.type) query.type = params.type;
		if (params?.status) query.status = params.status;
		if (params?.limit !== undefined) query.limit = params.limit;
		if (params?.beforeId) query.before = params.beforeId;

		const response = await http.get<Array<ModCase>>({
			url: Endpoints.GUILD_MOD_CASES(guildId),
			query,
		});
		logger.debug(`Fetched ${response.body.length} mod cases for guild ${guildId}`);
		return response.body;
	} catch (error) {
		logger.error(`Failed to fetch mod cases for guild ${guildId}:`, error);
		throw error;
	}
}

/**
 * Dismiss a mod case (marks it as reviewed / no longer active).
 */
export async function dismissModCase(guildId: string, caseId: string): Promise<ModCase> {
	try {
		logger.debug('Dismissing mod case', {guildId, caseId});
		const response = await http.post<ModCase>({
			url: Endpoints.GUILD_MOD_CASE_DISMISS(guildId, caseId),
			body: {},
		});
		logger.info('Mod case dismissed', {guildId, caseId});
		return response.body;
	} catch (error) {
		logger.error(`Failed to dismiss mod case ${caseId} in guild ${guildId}:`, error);
		throw error;
	}
}

/**
 * Update a mod case (change reason, etc).
 */
export async function updateModCase(
	guildId: string,
	caseId: string,
	updates: ModCaseUpdatePayload,
): Promise<ModCase> {
	try {
		logger.debug('Updating mod case', {guildId, caseId});
		const response = await http.patch<ModCase>({
			url: Endpoints.GUILD_MOD_CASE(guildId, caseId),
			body: {
				...(updates.reason !== undefined ? {reason: updates.reason} : {}),
				...(updates.status !== undefined ? {status: updates.status} : {}),
			},
		});
		logger.info('Mod case updated', {guildId, caseId});
		return response.body;
	} catch (error) {
		logger.error(`Failed to update mod case ${caseId} in guild ${guildId}:`, error);
		throw error;
	}
}

/**
 * Fetch the automod threshold configuration for a guild.
 */
export async function fetchAutomodThresholds(guildId: string): Promise<AutomodThresholds> {
	try {
		const response = await http.get<AutomodThresholds>({
			url: Endpoints.GUILD_MOD_THRESHOLDS(guildId),
		});
		return response.body;
	} catch (error) {
		logger.error(`Failed to fetch automod thresholds for guild ${guildId}:`, error);
		throw error;
	}
}

/**
 * Update the automod threshold configuration for a guild.
 * Requires the Manage Guild permission.
 */
export async function updateAutomodThresholds(
	guildId: string,
	thresholds: Partial<AutomodThresholds>,
): Promise<AutomodThresholds> {
	try {
		logger.debug('Updating automod thresholds', {guildId, thresholds});
		const response = await http.patch<AutomodThresholds>({
			url: Endpoints.GUILD_MOD_THRESHOLDS(guildId),
			body: {
				...(thresholds.warnThresholdKick !== undefined
					? {warn_threshold_kick: thresholds.warnThresholdKick}
					: {}),
				...(thresholds.warnThresholdBan !== undefined
					? {warn_threshold_ban: thresholds.warnThresholdBan}
					: {}),
				...(thresholds.warnCountResetDays !== undefined
					? {warn_count_reset_days: thresholds.warnCountResetDays}
					: {}),
			},
		});
		logger.info('Automod thresholds updated', {guildId});
		return response.body;
	} catch (error) {
		logger.error(`Failed to update automod thresholds for guild ${guildId}:`, error);
		throw error;
	}
}
