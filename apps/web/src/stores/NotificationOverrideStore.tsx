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

import {
	type ChannelNotificationOverride,
	type DndSchedule,
	type GuildNotificationOverride,
	type NotificationLevel,
	fetchDndSchedule,
	muteChannel,
	muteGuild,
	setChannelNotificationOverride,
	setGuildNotificationOverride,
	unmuteChannel,
	unmuteGuild,
	updateDndSchedule,
} from '@app/actions/NotificationOverrideActionCreators';
import {Logger} from '@app/lib/Logger';
import {makePersistent} from '@app/lib/MobXPersistence';
import {makeAutoObservable, runInAction} from 'mobx';

const logger = new Logger('NotificationOverrideStore');

// ─── DND Schedule helpers ──────────────────────────────────────────────────────

function parseTime(hhMm: string): {h: number; m: number} {
	const [h = 0, m = 0] = hhMm.split(':').map(Number);
	return {h, m};
}

function currentMinutesOfDay(): number {
	const now = new Date();
	return now.getHours() * 60 + now.getMinutes();
}

function isDndActive(schedule: DndSchedule): boolean {
	if (!schedule.enabled) return false;
	const todayDay = new Date().getDay(); // 0 = Sunday
	if (!schedule.days.includes(todayDay)) return false;

	const nowMins = currentMinutesOfDay();
	const {h: sh, m: sm} = parseTime(schedule.startTime);
	const {h: eh, m: em} = parseTime(schedule.endTime);
	const startMins = sh * 60 + sm;
	const endMins = eh * 60 + em;

	if (startMins <= endMins) {
		// Same-day window e.g. 22:00–23:59
		return nowMins >= startMins && nowMins < endMins;
	} else {
		// Overnight window e.g. 23:00–07:00
		return nowMins >= startMins || nowMins < endMins;
	}
}

// ─── Store ─────────────────────────────────────────────────────────────────────

class NotificationOverrideStore {
	/** Map of guildId → override */
	private guildOverrides: Map<string, GuildNotificationOverride> = new Map();
	/** Map of channelId → override */
	private channelOverrides: Map<string, ChannelNotificationOverride> = new Map();
	/** DND schedule */
	dndSchedule: DndSchedule = {
		days: [],
		startTime: '22:00',
		endTime: '08:00',
		enabled: false,
	};
	/** Computed: whether DND mode is currently active based on schedule */
	dndActive = false;

	private dndCheckInterval: ReturnType<typeof setInterval> | null = null;
	private isPersisting = false;

	constructor() {
		makeAutoObservable(this, {}, {autoBind: true});
		this.initPersistence();
		this.startDndCheck();
		void this.loadDndSchedule();
	}

	private async initPersistence(): Promise<void> {
		if (this.isPersisting) return;
		this.isPersisting = true;
		await makePersistent(this, 'NotificationOverrideStore', ['dndSchedule']);
	}

	// ── DND  ─────────────────────────────────────────────────────────────────

	private startDndCheck(): void {
		// Re-evaluate DND every 60 seconds to match the server's job cadence
		this.dndActive = isDndActive(this.dndSchedule);
		this.dndCheckInterval = setInterval(() => {
			runInAction(() => {
				this.dndActive = isDndActive(this.dndSchedule);
			});
		}, 60_000);
	}

	private async loadDndSchedule(): Promise<void> {
		try {
			const schedule = await fetchDndSchedule();
			runInAction(() => {
				this.dndSchedule = schedule;
				this.dndActive = isDndActive(schedule);
			});
		} catch {
			// Not fatal — we'll use the persisted / default schedule
		}
	}

	async saveDndSchedule(schedule: DndSchedule): Promise<void> {
		try {
			const saved = await updateDndSchedule(schedule);
			runInAction(() => {
				this.dndSchedule = saved;
				this.dndActive = isDndActive(saved);
			});
		} catch (error) {
			logger.error('Failed to save DND schedule:', error);
			throw error;
		}
	}

	isDndActive(): boolean {
		return this.dndActive;
	}

	// ── Guild overrides ───────────────────────────────────────────────────────

	/**
	 * Apply a server-sent USER_GUILD_SETTINGS_UPDATE event.
	 * Also called to seed from initial READY payload.
	 */
	handleGuildSettingsUpdate(override: GuildNotificationOverride): void {
		this.guildOverrides.set(override.guildId, override);
	}

	getGuildOverride(guildId: string): GuildNotificationOverride | undefined {
		return this.guildOverrides.get(guildId);
	}

	isGuildMuted(guildId: string): boolean {
		const override = this.guildOverrides.get(guildId);
		if (!override?.muted) return false;
		if (override.muteExpiresAt == null) return true;
		return new Date(override.muteExpiresAt) > new Date();
	}

	getGuildNotificationLevel(guildId: string): NotificationLevel {
		return this.guildOverrides.get(guildId)?.messageNotifications ?? 0;
	}

	async setGuildNotifications(guildId: string, level: NotificationLevel): Promise<void> {
		try {
			const updated = await setGuildNotificationOverride(guildId, {messageNotifications: level});
			runInAction(() => this.guildOverrides.set(guildId, updated));
		} catch (error) {
			logger.error(`Failed to set guild notifications for ${guildId}:`, error);
			throw error;
		}
	}

	async muteGuild(guildId: string, durationSeconds?: number): Promise<void> {
		try {
			const updated = await muteGuild(guildId, durationSeconds);
			runInAction(() => this.guildOverrides.set(guildId, updated));
		} catch (error) {
			logger.error(`Failed to mute guild ${guildId}:`, error);
			throw error;
		}
	}

	async unmuteGuild(guildId: string): Promise<void> {
		try {
			const updated = await unmuteGuild(guildId);
			runInAction(() => this.guildOverrides.set(guildId, updated));
		} catch (error) {
			logger.error(`Failed to unmute guild ${guildId}:`, error);
			throw error;
		}
	}

	// ── Channel overrides  ────────────────────────────────────────────────────

	handleChannelSettingsUpdate(override: ChannelNotificationOverride): void {
		this.channelOverrides.set(override.channelId, override);
	}

	getChannelOverride(channelId: string): ChannelNotificationOverride | undefined {
		return this.channelOverrides.get(channelId);
	}

	isChannelMuted(channelId: string): boolean {
		const override = this.channelOverrides.get(channelId);
		if (!override?.muted) return false;
		if (override.muteExpiresAt == null) return true;
		return new Date(override.muteExpiresAt) > new Date();
	}

	isChannelCollapsed(channelId: string): boolean {
		return this.channelOverrides.get(channelId)?.collapsed ?? false;
	}

	async muteChannel(channelId: string, durationSeconds?: number): Promise<void> {
		try {
			const updated = await muteChannel(channelId, durationSeconds);
			runInAction(() => this.channelOverrides.set(channelId, updated));
		} catch (error) {
			logger.error(`Failed to mute channel ${channelId}:`, error);
			throw error;
		}
	}

	async unmuteChannel(channelId: string): Promise<void> {
		try {
			const updated = await unmuteChannel(channelId);
			runInAction(() => this.channelOverrides.set(channelId, updated));
		} catch (error) {
			logger.error(`Failed to unmute channel ${channelId}:`, error);
			throw error;
		}
	}

	async setChannelCollapsed(channelId: string, collapsed: boolean): Promise<void> {
		try {
			const updated = await setChannelNotificationOverride(channelId, {collapsed});
			runInAction(() => this.channelOverrides.set(channelId, updated));
		} catch (error) {
			logger.error(`Failed to set channel collapsed for ${channelId}:`, error);
			throw error;
		}
	}

	// ── Lifecycle ─────────────────────────────────────────────────────────────

	dispose(): void {
		if (this.dndCheckInterval != null) {
			clearInterval(this.dndCheckInterval);
			this.dndCheckInterval = null;
		}
	}
}

export default new NotificationOverrideStore();
