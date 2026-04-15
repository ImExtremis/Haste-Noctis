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

import * as TelemetryActionCreators from '@app/actions/TelemetryActionCreators';
import {isTelemetryEnabled, setTelemetryOptIn} from '@app/lib/Telemetry';
import {Logger} from '@app/lib/Logger';
import {Trans} from '@lingui/react/macro';
import {
	CheckCircleIcon,
	EyeSlashIcon,
	LightbulbIcon,
	ProhibitIcon,
} from '@phosphor-icons/react';
import {useCallback, useState} from 'react';
import styles from './TelemetrySettingsPanel.module.css';

const logger = new Logger('TelemetrySettingsPanel');

interface TelemetrySettingsPanelProps {
	/** Initial opt-in state from the user's stored settings */
	initialOptIn?: boolean;
}

/**
 * D8: Opt-In Telemetry Settings Panel
 *
 * Embed this in Settings → Privacy & Safety → Data & Telemetry.
 * Shows a clear description of what IS and IS NOT collected,
 * with a toggle that defaults to OFF.
 */
export default function TelemetrySettingsPanel({initialOptIn = false}: TelemetrySettingsPanelProps) {
	const [optIn, setOptIn] = useState(initialOptIn || isTelemetryEnabled());
	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	const handleToggle = useCallback(async () => {
		const nextOptIn = !optIn;
		setSaveError(null);
		setOptIn(nextOptIn); // Optimistic update
		setTelemetryOptIn(nextOptIn); // Update module-level state immediately

		setIsSaving(true);
		try {
			await TelemetryActionCreators.updateTelemetryOptIn(nextOptIn);
		} catch (err) {
			logger.error('Failed to save telemetry preference:', err);
			// Rollback optimistic update
			setOptIn(!nextOptIn);
			setTelemetryOptIn(!nextOptIn);
			setSaveError('Failed to save preference. Please try again.');
		} finally {
			setIsSaving(false);
		}
	}, [optIn]);

	return (
		<div className={styles.panel} id="telemetry-settings-panel">
			<div className={styles.header}>
				<div className={styles.headerText}>
					<h3 className={styles.title}>
						<Trans>Help improve Noctis (optional)</Trans>
					</h3>
					<p className={styles.description}>
						<Trans>
							Anonymous usage data helps us identify bugs and improve performance. You are in full
							control — this is always opt-in.
						</Trans>
					</p>
				</div>

				<button
					type="button"
					role="switch"
					aria-checked={optIn}
					aria-label="Toggle telemetry"
					className={styles.toggle}
					data-state={optIn ? 'on' : 'off'}
					onClick={handleToggle}
					disabled={isSaving}
				>
					<span className={styles.toggleThumb} />
				</button>
			</div>

			<div className={styles.divider} />

			<div className={styles.columns}>
				{/* What we DO collect */}
				<div className={styles.column}>
					<div className={styles.columnHeader}>
						<CheckCircleIcon size={16} weight="fill" className={styles.iconAllowed} />
						<span className={styles.columnTitle}>
							<Trans>If enabled, we collect:</Trans>
						</span>
					</div>
					<ul className={styles.list}>
						<li className={styles.listItem}>
							<LightbulbIcon size={13} className={styles.bulletIcon} />
							<Trans>Anonymous crash reports (no personal data)</Trans>
						</li>
						<li className={styles.listItem}>
							<LightbulbIcon size={13} className={styles.bulletIcon} />
							<Trans>Feature usage statistics (anonymized)</Trans>
						</li>
						<li className={styles.listItem}>
							<LightbulbIcon size={13} className={styles.bulletIcon} />
							<Trans>Performance metrics (load times, broad region only)</Trans>
						</li>
					</ul>
				</div>

				{/* What we NEVER collect */}
				<div className={styles.column}>
					<div className={styles.columnHeader}>
						<ProhibitIcon size={16} weight="fill" className={styles.iconDenied} />
						<span className={styles.columnTitle}>
							<Trans>We will NEVER collect:</Trans>
						</span>
					</div>
					<ul className={styles.list}>
						<li className={styles.listItem}>
							<EyeSlashIcon size={13} className={styles.bulletIconDenied} />
							<Trans>Your messages or file contents</Trans>
						</li>
						<li className={styles.listItem}>
							<EyeSlashIcon size={13} className={styles.bulletIconDenied} />
							<Trans>Your contacts or friends list</Trans>
						</li>
						<li className={styles.listItem}>
							<EyeSlashIcon size={13} className={styles.bulletIconDenied} />
							<Trans>What apps or games you use</Trans>
						</li>
						<li className={styles.listItem}>
							<EyeSlashIcon size={13} className={styles.bulletIconDenied} />
							<Trans>Your keystrokes or input</Trans>
						</li>
					</ul>
				</div>
			</div>

			<p className={styles.sessionNote}>
				<Trans>
					Your session ID rotates every 24 hours. We cannot link telemetry data back to you.
				</Trans>
			</p>

			{saveError && <p className={styles.errorText}>{saveError}</p>}
		</div>
	);
}
