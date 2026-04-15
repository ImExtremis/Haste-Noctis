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

import {warnUser} from '@app/actions/ModerationActionCreators';
import React, {useCallback, useState} from 'react';

export interface WarnUserModalProps {
	guildId: string;
	userId: string;
	username: string;
	onClose: () => void;
	onSuccess?: (warnCount: number, automodTriggered: boolean) => void;
}

/**
 * Modal presented when a moderator clicks "Warn" on a user's context menu.
 * Collects the warn reason and submits via ModerationActionCreators.warnUser().
 */
export function WarnUserModal({guildId, userId, username, onClose, onSuccess}: WarnUserModalProps): React.JSX.Element {
	const [reason, setReason] = useState('');
	const [notifyUser, setNotifyUser] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			if (!reason.trim()) {
				setError('Please provide a reason for the warning.');
				return;
			}
			setSubmitting(true);
			setError(null);
			try {
				const result = await warnUser(guildId, userId, {reason: reason.trim(), notifyUser});
				onSuccess?.(result.warnCount, result.automodActionTriggered);
				onClose();
			} catch {
				setError('Failed to issue warning. Please try again.');
				setSubmitting(false);
			}
		},
		[guildId, userId, reason, notifyUser, onSuccess, onClose],
	);

	return (
		<div
			aria-labelledby="warn-user-title"
			aria-modal="true"
			role="dialog"
			style={{
				position: 'fixed',
				inset: 0,
				zIndex: 1000,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				background: 'rgba(0,0,0,0.6)',
			}}
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div
				style={{
					background: 'var(--background-primary)',
					borderRadius: 8,
					padding: '24px 28px',
					width: 440,
					maxWidth: '90vw',
					display: 'flex',
					flexDirection: 'column',
					gap: 16,
					boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
				}}
			>
				{/* Header */}
				<div style={{marginBottom: 4}}>
					<h2
						id="warn-user-title"
						style={{margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--header-primary)'}}
					>
						Warn {username}
					</h2>
					<p style={{margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)'}}>
						Issue a formal warning. The user's warning count will increase.
					</p>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: 14}}>
					{/* Reason */}
					<div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
						<label
							htmlFor="warn-reason"
							style={{
								fontSize: 11,
								fontWeight: 700,
								textTransform: 'uppercase',
								letterSpacing: 0.5,
								color: 'var(--header-secondary)',
							}}
						>
							Reason
						</label>
						<textarea
							autoFocus
							id="warn-reason"
							maxLength={500}
							onChange={(e) => setReason(e.target.value)}
							placeholder="Briefly describe the reason for this warning…"
							required
							rows={4}
							style={{
								padding: '8px 12px',
								borderRadius: 4,
								border: 'none',
								background: 'var(--input-background)',
								color: 'var(--text-normal)',
								fontSize: 14,
								resize: 'vertical',
								outline: 'none',
								fontFamily: 'inherit',
							}}
							value={reason}
						/>
						<span style={{fontSize: 11, color: 'var(--text-muted)', alignSelf: 'flex-end'}}>
							{reason.length}/500
						</span>
					</div>

					{/* Notify user checkbox */}
					<label
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 10,
							cursor: 'pointer',
							userSelect: 'none',
							fontSize: 14,
							color: 'var(--text-normal)',
						}}
					>
						<input
							checked={notifyUser}
							onChange={(e) => setNotifyUser(e.target.checked)}
							style={{
								width: 16,
								height: 16,
								cursor: 'pointer',
								accentColor: 'var(--brand-500)',
							}}
							type="checkbox"
						/>
						Send DM notification to user
					</label>

					{/* Error */}
					{error != null && (
						<p
							role="alert"
							style={{
								margin: 0,
								padding: '8px 12px',
								borderRadius: 4,
								background: 'rgba(240, 71, 71, 0.12)',
								color: 'var(--red-400)',
								fontSize: 13,
							}}
						>
							{error}
						</p>
					)}

					{/* Actions */}
					<div style={{display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4}}>
						<button
							disabled={submitting}
							onClick={onClose}
							style={{
								padding: '8px 16px',
								borderRadius: 4,
								border: 'none',
								background: 'transparent',
								color: 'var(--text-muted)',
								fontSize: 14,
								cursor: 'pointer',
							}}
							type="button"
						>
							Cancel
						</button>
						<button
							disabled={submitting || !reason.trim()}
							style={{
								padding: '8px 16px',
								borderRadius: 4,
								border: 'none',
								background: submitting || !reason.trim() ? 'var(--background-secondary)' : 'var(--yellow-360)',
								color: submitting || !reason.trim() ? 'var(--text-muted)' : '#000',
								fontSize: 14,
								fontWeight: 600,
								cursor: submitting || !reason.trim() ? 'not-allowed' : 'pointer',
								display: 'flex',
								alignItems: 'center',
								gap: 6,
								transition: 'background-color 0.15s',
							}}
							type="submit"
						>
							{submitting ? 'Issuing…' : '⚠ Warn User'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
