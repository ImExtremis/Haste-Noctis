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

const logger = new Logger('NotificationOverrideActionCreators');

// ─── Types ────────────────────────────────────────────────────────────────────

/** Mirrors MessageNotifications enum: 0=all, 1=mentions-only, 2=none */
export type NotificationLevel = 0 | 1 | 2;

export interface GuildNotificationOverride {
	guildId: string;
	messageNotifications: NotificationLevel;
	/** Whether to mute all audio notifications for this guild */
	muted: boolean;
	/** ISO8601 datetime of when the mute expires, or null for indefinite */
	muteExpiresAt: string | null;
	suppressEveryone: boolean;
	suppressRoles: boolean;
	mobilePush: boolean;
}

export interface ChannelNotificationOverride {
	channelId: string;
	messageNotifications: NotificationLevel;
	muted: boolean;
	muteExpiresAt: string | null;
	/** Whether this channel category is collapsed in sidebar */
	collapsed: boolean;
}

export interface DndSchedule {
	/** 0-6, where 0 = Sunday */
	days: Array<number>;
	/** HH:MM in user's local time */
	startTime: string;
	/** HH:MM in user's local time */
	endTime: string;
	enabled: boolean;
}

// ─── Guild overrides ──────────────────────────────────────────────────────────

export async function setGuildNotificationOverride(
	guildId: string,
	payload: Partial<
		Pick<
			GuildNotificationOverride,
			'messageNotifications' | 'muted' | 'muteExpiresAt' | 'suppressEveryone' | 'suppressRoles' | 'mobilePush'
		>
	>,
): Promise<GuildNotificationOverride> {
	try {
		logger.debug('Setting guild notification override', {guildId, payload});
		const response = await http.patch<GuildNotificationOverride>({
			url: Endpoints.GUILD_NOTIFICATION_OVERRIDE(guildId),
			body: {
				...(payload.messageNotifications !== undefined
					? {message_notifications: payload.messageNotifications}
					: {}),
				...(payload.muted !== undefined ? {muted: payload.muted} : {}),
				...(payload.muteExpiresAt !== undefined ? {mute_expires_at: payload.muteExpiresAt} : {}),
				...(payload.suppressEveryone !== undefined ? {suppress_everyone: payload.suppressEveryone} : {}),
				...(payload.suppressRoles !== undefined ? {suppress_roles: payload.suppressRoles} : {}),
				...(payload.mobilePush !== undefined ? {mobile_push: payload.mobilePush} : {}),
			},
		});
		logger.info('Guild notification override set', {guildId});
		return response.body;
	} catch (error) {
		logger.error(`Failed to set guild notification override for guild ${guildId}:`, error);
		throw error;
	}
}

export async function muteGuild(guildId: string, durationSeconds?: number): Promise<GuildNotificationOverride> {
	const muteExpiresAt = durationSeconds != null
		? new Date(Date.now() + durationSeconds * 1000).toISOString()
		: null;
	return setGuildNotificationOverride(guildId, {muted: true, muteExpiresAt});
}

export async function unmuteGuild(guildId: string): Promise<GuildNotificationOverride> {
	return setGuildNotificationOverride(guildId, {muted: false, muteExpiresAt: null});
}

// ─── Channel overrides ────────────────────────────────────────────────────────

export async function setChannelNotificationOverride(
	channelId: string,
	payload: Partial<
		Pick<ChannelNotificationOverride, 'messageNotifications' | 'muted' | 'muteExpiresAt' | 'collapsed'>
	>,
): Promise<ChannelNotificationOverride> {
	try {
		logger.debug('Setting channel notification override', {channelId, payload});
		const response = await http.patch<ChannelNotificationOverride>({
			url: Endpoints.CHANNEL_NOTIFICATION_OVERRIDE(channelId),
			body: {
				...(payload.messageNotifications !== undefined
					? {message_notifications: payload.messageNotifications}
					: {}),
				...(payload.muted !== undefined ? {muted: payload.muted} : {}),
				...(payload.muteExpiresAt !== undefined ? {mute_expires_at: payload.muteExpiresAt} : {}),
				...(payload.collapsed !== undefined ? {collapsed: payload.collapsed} : {}),
			},
		});
		logger.info('Channel notification override set', {channelId});
		return response.body;
	} catch (error) {
		logger.error(`Failed to set channel notification override for channel ${channelId}:`, error);
		throw error;
	}
}

export async function muteChannel(channelId: string, durationSeconds?: number): Promise<ChannelNotificationOverride> {
	const muteExpiresAt = durationSeconds != null
		? new Date(Date.now() + durationSeconds * 1000).toISOString()
		: null;
	return setChannelNotificationOverride(channelId, {muted: true, muteExpiresAt});
}

export async function unmuteChannel(channelId: string): Promise<ChannelNotificationOverride> {
	return setChannelNotificationOverride(channelId, {muted: false, muteExpiresAt: null});
}

// ─── DND Schedule ─────────────────────────────────────────────────────────────

export async function fetchDndSchedule(): Promise<DndSchedule> {
	try {
		const response = await http.get<DndSchedule>({url: Endpoints.USER_DND_SCHEDULE});
		return response.body;
	} catch (error) {
		logger.error('Failed to fetch DND schedule:', error);
		throw error;
	}
}

export async function updateDndSchedule(schedule: DndSchedule): Promise<DndSchedule> {
	try {
		logger.debug('Updating DND schedule', schedule);
		const response = await http.put<DndSchedule>({
			url: Endpoints.USER_DND_SCHEDULE,
			body: {
				days: schedule.days,
				start_time: schedule.startTime,
				end_time: schedule.endTime,
				enabled: schedule.enabled,
			},
		});
		logger.info('DND schedule updated');
		return response.body;
	} catch (error) {
		logger.error('Failed to update DND schedule:', error);
		throw error;
	}
}
