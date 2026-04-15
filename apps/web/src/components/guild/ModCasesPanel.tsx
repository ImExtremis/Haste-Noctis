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
	type AutomodThresholds,
	type ModCase,
	type ModCaseStatus,
	type ModCaseType,
	dismissModCase,
	fetchAutomodThresholds,
	fetchModCases,
	updateAutomodThresholds,
} from '@app/actions/ModerationActionCreators';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import styles from './ModCasesPanel.module.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<ModCaseType, string> = {
	warn: 'Warn',
	kick: 'Kick',
	ban: 'Ban',
	timeout: 'Timeout',
	note: 'Note',
};

const STATUS_LABEL: Record<ModCaseStatus, string> = {
	active: 'Active',
	dismissed: 'Dismissed',
	expired: 'Expired',
};

function formatRelativeDate(isoTimestamp: string): string {
	const date = new Date(isoTimestamp);
	const now = Date.now();
	const diff = now - date.getTime();
	const minutes = Math.floor(diff / 60_000);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (minutes < 1) return 'just now';
	if (minutes < 60) return `${minutes}m ago`;
	if (hours < 24) return `${hours}h ago`;
	if (days < 30) return `${days}d ago`;
	return date.toLocaleDateString();
}

// ─── Case Row ─────────────────────────────────────────────────────────────────

interface ModCaseRowProps {
	modCase: ModCase;
	onDismiss: (caseId: string) => void;
}

function ModCaseRow({modCase, onDismiss}: ModCaseRowProps): React.JSX.Element {
	const handleDismiss = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			onDismiss(modCase.id);
		},
		[modCase.id, onDismiss],
	);

	return (
		<div className={styles.caseRow} role="row">
			{/* Type badge */}
			<span className={`${styles.typeBadge} ${styles[modCase.type]}`}>{TYPE_LABEL[modCase.type]}</span>

			{/* Info */}
			<div className={styles.caseInfo}>
				<span className={styles.caseTarget}>User {modCase.targetUserId}</span>
				<span className={styles.caseReason}>{modCase.reason ?? 'No reason provided'}</span>
			</div>

			{/* Meta */}
			<div className={styles.caseMeta}>
				<span className={styles.caseDate}>{formatRelativeDate(modCase.createdAt)}</span>
				<span className={`${styles.statusBadge} ${styles[modCase.status]}`}>
					{STATUS_LABEL[modCase.status]}
				</span>
			</div>

			{/* Actions */}
			<div className={styles.caseActions}>
				{modCase.status === 'active' && (
					<button
						className={`${styles.iconButton} ${styles.danger}`}
						onClick={handleDismiss}
						title="Dismiss case"
						type="button"
					>
						✕
					</button>
				)}
			</div>
		</div>
	);
}

// ─── Stats ────────────────────────────────────────────────────────────────────

interface CaseStats {
	total: number;
	warn: number;
	kick: number;
	ban: number;
}

function computeStats(cases: Array<ModCase>): CaseStats {
	return cases.reduce(
		(acc, c) => {
			acc.total++;
			if (c.type === 'warn') acc.warn++;
			if (c.type === 'kick') acc.kick++;
			if (c.type === 'ban') acc.ban++;
			return acc;
		},
		{total: 0, warn: 0, kick: 0, ban: 0},
	);
}

// ─── Automod Thresholds ───────────────────────────────────────────────────────

interface AutomodSectionProps {
	guildId: string;
}

function AutomodSection({guildId}: AutomodSectionProps): React.JSX.Element {
	const [thresholds, setThresholds] = useState<AutomodThresholds>({
		warnThresholdKick: null,
		warnThresholdBan: null,
		warnCountResetDays: null,
	});
	const [saving, setSaving] = useState(false);
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		fetchAutomodThresholds(guildId)
			.then((t) => {
				setThresholds(t);
				setLoaded(true);
			})
			.catch(() => setLoaded(true));
	}, [guildId]);

	const handleSave = useCallback(async () => {
		setSaving(true);
		try {
			await updateAutomodThresholds(guildId, thresholds);
		} finally {
			setSaving(false);
		}
	}, [guildId, thresholds]);

	const mkChange =
		(field: keyof AutomodThresholds) =>
		(e: React.ChangeEvent<HTMLInputElement>): void => {
			const val = e.target.value === '' ? null : Number(e.target.value);
			setThresholds((prev) => ({...prev, [field]: val}));
		};

	if (!loaded) return <div className={styles.loadingState}>Loading thresholds…</div>;

	return (
		<div className={styles.section}>
			<p className={styles.sectionTitle}>Automod Warning Thresholds</p>
			<div className={styles.thresholdsGrid}>
				<div className={styles.thresholdField}>
					<label className={styles.thresholdLabel} htmlFor="mod-thresh-kick">
						Kick at Warnings
					</label>
					<p className={styles.thresholdDescription}>Auto-kick member after this many warnings (blank = disabled)</p>
					<input
						className={styles.thresholdInput}
						id="mod-thresh-kick"
						min={1}
						onChange={mkChange('warnThresholdKick')}
						placeholder="Disabled"
						type="number"
						value={thresholds.warnThresholdKick ?? ''}
					/>
				</div>
				<div className={styles.thresholdField}>
					<label className={styles.thresholdLabel} htmlFor="mod-thresh-ban">
						Ban at Warnings
					</label>
					<p className={styles.thresholdDescription}>Auto-ban member after this many warnings (blank = disabled)</p>
					<input
						className={styles.thresholdInput}
						id="mod-thresh-ban"
						min={1}
						onChange={mkChange('warnThresholdBan')}
						placeholder="Disabled"
						type="number"
						value={thresholds.warnThresholdBan ?? ''}
					/>
				</div>
				<div className={styles.thresholdField}>
					<label className={styles.thresholdLabel} htmlFor="mod-thresh-reset">
						Reset After Days
					</label>
					<p className={styles.thresholdDescription}>Warning count resets after this many days (blank = never)</p>
					<input
						className={styles.thresholdInput}
						id="mod-thresh-reset"
						min={1}
						onChange={mkChange('warnCountResetDays')}
						placeholder="Never"
						type="number"
						value={thresholds.warnCountResetDays ?? ''}
					/>
				</div>
			</div>
			<button className={styles.saveThresholdsBtn} disabled={saving} onClick={handleSave} type="button">
				{saving ? 'Saving…' : 'Save Thresholds'}
			</button>
		</div>
	);
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export interface ModCasesPanelProps {
	guildId: string;
}

const PAGE_SIZE = 25;

type FilterType = ModCaseType | 'all';
type FilterStatus = ModCaseStatus | 'all';

export function ModCasesPanel({guildId}: ModCasesPanelProps): React.JSX.Element {
	const [cases, setCases] = useState<Array<ModCase>>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [typeFilter, setTypeFilter] = useState<FilterType>('all');
	const [statusFilter, setStatusFilter] = useState<FilterStatus>('active');
	const [page, setPage] = useState(0);

	// Fetch cases
	const loadCases = useCallback(async () => {
		setLoading(true);
		try {
			const result = await fetchModCases(guildId, {
				type: typeFilter !== 'all' ? typeFilter : undefined,
				status: statusFilter !== 'all' ? statusFilter : undefined,
			});
			setCases(result);
		} finally {
			setLoading(false);
		}
	}, [guildId, typeFilter, statusFilter]);

	useEffect(() => {
		void loadCases();
		setPage(0);
	}, [loadCases]);

	// Dismiss handler
	const handleDismiss = useCallback(
		async (caseId: string) => {
			await dismissModCase(guildId, caseId);
			await loadCases();
		},
		[guildId, loadCases],
	);

	// Filter & paginate client-side by search
	const filteredCases = useMemo(() => {
		if (!search.trim()) return cases;
		const q = search.toLowerCase();
		return cases.filter(
			(c) =>
				c.targetUserId.includes(q) ||
				c.moderatorId.includes(q) ||
				(c.reason?.toLowerCase().includes(q) ?? false),
		);
	}, [cases, search]);

	const totalPages = Math.ceil(filteredCases.length / PAGE_SIZE);
	const paginated = filteredCases.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
	const stats = useMemo(() => computeStats(cases), [cases]);

	return (
		<div className={styles.panel}>
			{/* Header */}
			<div className={styles.header}>
				<div>
					<h2 className={styles.title}>Moderation Cases</h2>
					<p className={styles.subtitle}>Track warnings, kicks, bans, and other moderation actions</p>
				</div>
			</div>

			{/* Stats */}
			<div className={styles.statsRow}>
				<div className={styles.statCard}>
					<span className={styles.statValue}>{stats.total}</span>
					<span className={styles.statLabel}>Total</span>
				</div>
				<div className={`${styles.statCard} ${styles.warn}`}>
					<span className={styles.statValue}>{stats.warn}</span>
					<span className={styles.statLabel}>Warnings</span>
				</div>
				<div className={`${styles.statCard} ${styles.kick}`}>
					<span className={styles.statValue}>{stats.kick}</span>
					<span className={styles.statLabel}>Kicks</span>
				</div>
				<div className={`${styles.statCard} ${styles.ban}`}>
					<span className={styles.statValue}>{stats.ban}</span>
					<span className={styles.statLabel}>Bans</span>
				</div>
			</div>

			{/* Filter bar */}
			<div className={styles.filterBar}>
				<input
					className={styles.searchInput}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Search by user ID or reason…"
					type="text"
					value={search}
				/>
				<select
					className={styles.filterSelect}
					onChange={(e) => setTypeFilter(e.target.value as FilterType)}
					value={typeFilter}
				>
					<option value="all">All types</option>
					<option value="warn">Warnings</option>
					<option value="kick">Kicks</option>
					<option value="ban">Bans</option>
					<option value="timeout">Timeouts</option>
					<option value="note">Notes</option>
				</select>
				<select
					className={styles.filterSelect}
					onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
					value={statusFilter}
				>
					<option value="all">All statuses</option>
					<option value="active">Active</option>
					<option value="dismissed">Dismissed</option>
					<option value="expired">Expired</option>
				</select>
			</div>

			{/* Case list */}
			<div className={styles.caseList} role="table">
				{loading ? (
					<div className={styles.loadingState}>Loading cases…</div>
				) : paginated.length === 0 ? (
					<div className={styles.emptyState}>
						<span className={styles.emptyStateIcon}>🛡️</span>
						<span>No moderation cases found.</span>
						{search && <span>Try clearing the search filter.</span>}
					</div>
				) : (
					paginated.map((modCase) => (
						<ModCaseRow key={modCase.id} modCase={modCase} onDismiss={handleDismiss} />
					))
				)}
			</div>

			{/* Pagination */}
			{totalPages > 1 && (
				<div className={styles.paginationRow}>
					<button
						className={styles.pageBtn}
						disabled={page === 0}
						onClick={() => setPage((p) => p - 1)}
						type="button"
					>
						← Prev
					</button>
					<span className={styles.pageInfo}>
						Page {page + 1} of {totalPages}
					</span>
					<button
						className={styles.pageBtn}
						disabled={page >= totalPages - 1}
						onClick={() => setPage((p) => p + 1)}
						type="button"
					>
						Next →
					</button>
				</div>
			)}

			{/* Automod thresholds */}
			<AutomodSection guildId={guildId} />
		</div>
	);
}
