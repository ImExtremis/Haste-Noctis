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

import {type DndSchedule} from '@app/actions/NotificationOverrideActionCreators';
import NotificationOverrideStore from '@app/stores/NotificationOverrideStore';
import {observer} from 'mobx-react-lite';
import React, {useCallback, useState} from 'react';
import styles from './NotificationOverridePanel.module.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/** Duration presets for the mute popout */
const MUTE_DURATIONS = [
	{label: '15 minutes', seconds: 15 * 60},
	{label: '1 hour', seconds: 60 * 60},
	{label: '3 hours', seconds: 3 * 60 * 60},
	{label: '8 hours', seconds: 8 * 60 * 60},
	{label: '24 hours', seconds: 24 * 60 * 60},
	{label: 'Until I turn it back on', seconds: undefined},
] as const;

// ─── Mute Duration List ───────────────────────────────────────────────────────

interface MuteDurationListProps {
	/** Called with seconds (undefined = indefinite) */
	onSelect: (seconds: number | undefined) => void;
}

/**
 * Used as the content of a right-click context menu popout.
 * Renders a list of mute duration options.
 */
export function MuteDurationList({onSelect}: MuteDurationListProps): React.JSX.Element {
	return (
		<div className={styles.muteDurationList}>
			{MUTE_DURATIONS.map(({label, seconds}) => (
				<div
					className={styles.muteDurationItem}
					key={label}
					onClick={() => onSelect(seconds)}
					role="menuitem"
					tabIndex={0}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') onSelect(seconds);
					}}
				>
					<span className={styles.muteDurationIcon}>🔕</span>
					{label}
				</div>
			))}
		</div>
	);
}

// ─── DND Schedule Section ─────────────────────────────────────────────────────

const DndScheduleSection = observer(function DndScheduleSection(): React.JSX.Element {
	const [draft, setDraft] = useState<DndSchedule>({...NotificationOverrideStore.dndSchedule});
	const [saving, setSaving] = useState(false);

	const toggleDay = useCallback((day: number) => {
		setDraft((prev) => ({
			...prev,
			days: prev.days.includes(day) ? prev.days.filter((d) => d !== day) : [...prev.days, day],
		}));
	}, []);

	const handleSave = useCallback(async () => {
		setSaving(true);
		try {
			await NotificationOverrideStore.saveDndSchedule(draft);
		} finally {
			setSaving(false);
		}
	}, [draft]);

	const isDndCurrentlyActive = NotificationOverrideStore.isDndActive();

	return (
		<>
			{/* Status indicator */}
			<div className={`${styles.dndStatus} ${isDndCurrentlyActive ? styles.active : styles.inactive}`}>
				<span className={styles.dndDot} />
				{isDndCurrentlyActive ? 'Do Not Disturb is active now' : 'Do Not Disturb is inactive'}
			</div>

			{/* Enable toggle */}
			<div className={styles.settingRow}>
				<div className={styles.settingInfo}>
					<span className={styles.settingLabel}>Enable DND Schedule</span>
					<span className={styles.settingDescription}>
						Automatically suppress notifications during the configured time window.
					</span>
				</div>
				<label className={styles.toggle}>
					<input
						checked={draft.enabled}
						className={styles.toggleInput}
						onChange={(e) => setDraft((prev) => ({...prev, enabled: e.target.checked}))}
						type="checkbox"
					/>
					<span className={styles.toggleSlider} />
				</label>
			</div>

			{/* Day picker */}
			<p className={styles.sectionHeader}>Active Days</p>
			<div className={styles.dayPicker}>
				{DAYS_OF_WEEK.map((day, index) => (
					<button
						className={`${styles.dayChip} ${draft.days.includes(index) ? styles.selected : ''}`}
						key={day}
						onClick={() => toggleDay(index)}
						type="button"
					>
						{day}
					</button>
				))}
			</div>

			{/* Time range */}
			<div className={styles.dndGrid} style={{marginTop: 16}}>
				<div className={styles.dndField}>
					<label className={styles.dndLabel} htmlFor="dnd-start">
						Start Time
					</label>
					<input
						className={styles.dndInput}
						id="dnd-start"
						onChange={(e) => setDraft((prev) => ({...prev, startTime: e.target.value}))}
						type="time"
						value={draft.startTime}
					/>
				</div>
				<div className={styles.dndField}>
					<label className={styles.dndLabel} htmlFor="dnd-end">
						End Time
					</label>
					<input
						className={styles.dndInput}
						id="dnd-end"
						onChange={(e) => setDraft((prev) => ({...prev, endTime: e.target.value}))}
						type="time"
						value={draft.endTime}
					/>
				</div>
			</div>

			<button className={styles.saveBtn} disabled={saving} onClick={handleSave} type="button">
				{saving ? 'Saving…' : 'Save Schedule'}
			</button>
		</>
	);
});

// ─── Guild Override Section ───────────────────────────────────────────────────

interface GuildOverrideSectionProps {
	guildId: string;
}

const GuildOverrideSection = observer(function GuildOverrideSection({
	guildId,
}: GuildOverrideSectionProps): React.JSX.Element {
	const override = NotificationOverrideStore.getGuildOverride(guildId);
	const isMuted = NotificationOverrideStore.isGuildMuted(guildId);
	const level = NotificationOverrideStore.getGuildNotificationLevel(guildId);

	const handleMuteToggle = useCallback(async () => {
		if (isMuted) {
			await NotificationOverrideStore.unmuteGuild(guildId);
		} else {
			// Default mute with no expiry
			await NotificationOverrideStore.muteGuild(guildId);
		}
	}, [guildId, isMuted]);

	const handleLevelChange = useCallback(
		async (e: React.ChangeEvent<HTMLSelectElement>) => {
			await NotificationOverrideStore.setGuildNotifications(guildId, Number(e.target.value) as 0 | 1 | 2);
		},
		[guildId],
	);

	return (
		<>
			<div className={styles.settingRow}>
				<div className={styles.settingInfo}>
					<span className={styles.settingLabel}>Mute Server</span>
					<span className={styles.settingDescription}>
						Prevent this server from sending any notifications.
						{override?.muteExpiresAt && ` Expires: ${new Date(override.muteExpiresAt).toLocaleString()}`}
					</span>
				</div>
				<label className={styles.toggle}>
					<input
						checked={isMuted}
						className={styles.toggleInput}
						onChange={handleMuteToggle}
						type="checkbox"
					/>
					<span className={styles.toggleSlider} />
				</label>
			</div>

			<div className={styles.settingRow}>
				<div className={styles.settingInfo}>
					<span className={styles.settingLabel}>Notification Level</span>
					<span className={styles.settingDescription}>
						Choose what types of messages trigger a notification.
					</span>
				</div>
				<select className={styles.select} onChange={handleLevelChange} value={level}>
					<option value={0}>All messages</option>
					<option value={1}>Mentions only</option>
					<option value={2}>Nothing</option>
				</select>
			</div>
		</>
	);
});

// ─── Main Panel ───────────────────────────────────────────────────────────────

export interface NotificationOverridePanelProps {
	/** If provided, shows guild-level override controls */
	guildId?: string;
}

/**
 * Notification settings panel for User Settings → Notifications.
 * Covers DND schedule and optionally per-guild overrides.
 */
export const NotificationOverridePanel = observer(function NotificationOverridePanel({
	guildId,
}: NotificationOverridePanelProps): React.JSX.Element {
	return (
		<div className={styles.panel}>
			<p className={styles.sectionHeader}>Do Not Disturb Schedule</p>
			<DndScheduleSection />

			{guildId != null && (
				<>
					<p className={styles.sectionHeader} style={{marginTop: 32}}>
						Server Notifications
					</p>
					<GuildOverrideSection guildId={guildId} />
				</>
			)}
		</div>
	);
});
