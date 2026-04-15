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

import * as PollActionCreators from '@app/actions/PollActionCreators';
import type {Poll, PollOption} from '@app/actions/PollActionCreators';
import {Logger} from '@app/lib/Logger';
import {Trans, useLingui} from '@lingui/react/macro';
import {
	ChartBarIcon,
	PlusIcon,
	TrashIcon,
	XIcon,
} from '@phosphor-icons/react';
import {clsx} from 'clsx';
import {observer} from 'mobx-react-lite';
import type React from 'react';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import styles from './PollMessage.module.css';

const logger = new Logger('PollMessage');

const MAX_OPTIONS = 10;
const MIN_OPTIONS = 2;
const MAX_QUESTION_LENGTH = 300;
const MAX_OPTION_LENGTH = 100;

// ─── Duration helpers ─────────────────────────────────────────────────────────

const DURATION_OPTIONS = [
	{label: '1 hour', hours: 1},
	{label: '4 hours', hours: 4},
	{label: '8 hours', hours: 8},
	{label: '24 hours', hours: 24},
	{label: '3 days', hours: 72},
	{label: '7 days', hours: 168},
] as const;

function hoursFromNow(hours: number): string {
	return new Date(Date.now() + hours * 3600 * 1000).toISOString();
}

function formatTimeRemaining(expiresAt: string | null): string {
	if (!expiresAt) return 'No expiry';
	const ms = new Date(expiresAt).getTime() - Date.now();
	if (ms <= 0) return 'Ended';
	const totalMinutes = Math.floor(ms / 60000);
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	if (hours >= 24) {
		const days = Math.floor(hours / 24);
		return `${days} day${days !== 1 ? 's' : ''}`;
	}
	if (hours > 0) return `${hours}h ${minutes}m`;
	return `${minutes}m`;
}

// ─── Poll Create Modal ────────────────────────────────────────────────────────

interface PollCreateModalProps {
	channelId: string;
	onClose: () => void;
	onCreated: (poll: Poll) => void;
}

export function PollCreateModal({channelId, onClose, onCreated}: PollCreateModalProps) {
	const {t} = useLingui();
	const [question, setQuestion] = useState('');
	const [options, setOptions] = useState<Array<string>>(['', '']);
	const [allowMultiselect, setAllowMultiselect] = useState(false);
	const [resultsHidden, setResultsHidden] = useState(false);
	const [durationHours, setDurationHours] = useState<number | null>(24);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const canSubmit = useMemo(
		() =>
			question.trim().length >= 1 &&
			options.filter((o) => o.trim().length > 0).length >= MIN_OPTIONS &&
			!isSubmitting,
		[question, options, isSubmitting],
	);

	const handleAddOption = useCallback(() => {
		if (options.length < MAX_OPTIONS) {
			setOptions((prev) => [...prev, '']);
		}
	}, [options.length]);

	const handleRemoveOption = useCallback(
		(index: number) => {
			if (options.length > MIN_OPTIONS) {
				setOptions((prev) => prev.filter((_, i) => i !== index));
			}
		},
		[options.length],
	);

	const handleOptionChange = useCallback((index: number, value: string) => {
		setOptions((prev) => prev.map((o, i) => (i === index ? value.slice(0, MAX_OPTION_LENGTH) : o)));
	}, []);

	const handleSubmit = useCallback(async () => {
		setError(null);
		const trimmedOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);

		if (trimmedOptions.length < MIN_OPTIONS) {
			setError(t`Please add at least 2 options.`);
			return;
		}

		setIsSubmitting(true);
		try {
			const poll = await PollActionCreators.createPoll(channelId, {
				question: question.trim(),
				options: trimmedOptions,
				allowMultiselect,
				resultsHidden,
				expiresAt: durationHours != null ? hoursFromNow(durationHours) : null,
			});
			onCreated(poll);
			onClose();
		} catch (err) {
			logger.error('Failed to create poll:', err);
			setError(t`Failed to create poll. Please try again.`);
			setIsSubmitting(false);
		}
	}, [channelId, question, options, allowMultiselect, resultsHidden, durationHours, onCreated, onClose, t]);

	return (
		<div className={styles.modalOverlay} onClick={onClose}>
			<div
				className={styles.modal}
				onClick={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-label={t`Create Poll`}
			>
				<div className={styles.modalHeader}>
					<ChartBarIcon size={20} weight="fill" className={styles.modalIcon} />
					<h2 className={styles.modalTitle}>
						<Trans>Create Poll</Trans>
					</h2>
					<button
						type="button"
						className={styles.modalCloseButton}
						onClick={onClose}
						aria-label={t`Close`}
					>
						<XIcon size={18} />
					</button>
				</div>

				<div className={styles.modalBody}>
					{/* Question */}
					<div className={styles.field}>
						<label className={styles.fieldLabel} htmlFor="poll-question">
							<Trans>Question</Trans>
						</label>
						<textarea
							id="poll-question"
							className={styles.questionInput}
							value={question}
							onChange={(e) => setQuestion(e.target.value.slice(0, MAX_QUESTION_LENGTH))}
							placeholder={t`What's your question?`}
							rows={2}
						/>
						<span className={styles.charCount}>
							{question.length}/{MAX_QUESTION_LENGTH}
						</span>
					</div>

					{/* Options */}
					<div className={styles.field}>
						<label className={styles.fieldLabel}>
							<Trans>Options</Trans>
						</label>
						<div className={styles.optionsList}>
							{options.map((opt, idx) => (
								<div key={`option-${idx}`} className={styles.optionRow}>
									<input
										type="text"
										className={styles.optionInput}
										value={opt}
										onChange={(e) => handleOptionChange(idx, e.target.value)}
										placeholder={t`Option ${idx + 1}`}
										maxLength={MAX_OPTION_LENGTH}
									/>
									{options.length > MIN_OPTIONS && (
										<button
											type="button"
											className={styles.removeOptionButton}
											onClick={() => handleRemoveOption(idx)}
											aria-label={t`Remove option`}
										>
											<TrashIcon size={14} />
										</button>
									)}
								</div>
							))}
						</div>
						{options.length < MAX_OPTIONS && (
							<button type="button" className={styles.addOptionButton} onClick={handleAddOption}>
								<PlusIcon size={14} />
								<Trans>Add option</Trans>
							</button>
						)}
					</div>

					{/* Toggles */}
					<div className={styles.toggleRow}>
						<span className={styles.toggleLabel}>
							<Trans>Allow multiple choices</Trans>
						</span>
						<button
							type="button"
							role="switch"
							aria-checked={allowMultiselect}
							className={clsx(styles.toggle, allowMultiselect && styles.toggleOn)}
							onClick={() => setAllowMultiselect((p) => !p)}
						/>
					</div>
					<div className={styles.toggleRow}>
						<span className={styles.toggleLabel}>
							<Trans>Hide results until poll ends</Trans>
						</span>
						<button
							type="button"
							role="switch"
							aria-checked={resultsHidden}
							className={clsx(styles.toggle, resultsHidden && styles.toggleOn)}
							onClick={() => setResultsHidden((p) => !p)}
						/>
					</div>

					{/* Duration */}
					<div className={styles.field}>
						<label className={styles.fieldLabel}>
							<Trans>Duration</Trans>
						</label>
						<div className={styles.durationChips}>
							<button
								type="button"
								className={clsx(styles.durationChip, durationHours === null && styles.durationChipActive)}
								onClick={() => setDurationHours(null)}
							>
								<Trans>No limit</Trans>
							</button>
							{DURATION_OPTIONS.map((opt) => (
								<button
									key={opt.hours}
									type="button"
									className={clsx(
										styles.durationChip,
										durationHours === opt.hours && styles.durationChipActive,
									)}
									onClick={() => setDurationHours(opt.hours)}
								>
									{opt.label}
								</button>
							))}
						</div>
					</div>

					{error && <p className={styles.errorText}>{error}</p>}
				</div>

				<div className={styles.modalFooter}>
					<button type="button" className={styles.cancelButton} onClick={onClose} disabled={isSubmitting}>
						<Trans>Cancel</Trans>
					</button>
					<button
						type="button"
						className={styles.submitButton}
						onClick={handleSubmit}
						disabled={!canSubmit}
					>
						{isSubmitting ? <Trans>Creating…</Trans> : <Trans>Create Poll</Trans>}
					</button>
				</div>
			</div>
		</div>
	);
}

// ─── Poll Display Component ───────────────────────────────────────────────────

interface PollMessageProps {
	poll: Poll;
	/** Whether the current user is the poll creator or has Manage Messages perm */
	canManage?: boolean;
}

export const PollMessage = observer(function PollMessage({poll: initialPoll, canManage}: PollMessageProps) {
	const {t} = useLingui();
	const [poll, setPoll] = useState<Poll>(initialPoll);
	const [isVoting, setIsVoting] = useState(false);
	const [isEnding, setIsEnding] = useState(false);
	const isMounted = useRef(true);

	useEffect(() => {
		isMounted.current = true;
		return () => {
			isMounted.current = false;
		};
	}, []);

	// Keep in sync with prop updates (e.g. WebSocket POLL_VOTE events)
	useEffect(() => {
		setPoll(initialPoll);
	}, [initialPoll]);

	const isExpired = poll.isExpired || (poll.expiresAt != null && new Date(poll.expiresAt) <= new Date());
	const showResults = !poll.resultsHidden || isExpired;
	const hasVoted = poll.myVoteOptionIds.length > 0;
	const totalVotes = poll.totalVotes;

	const handleVote = useCallback(
		async (optionId: string) => {
			if (isVoting || isExpired) return;

			let nextOptionIds: Array<string>;
			if (poll.allowMultiselect) {
				// Toggle the option in/out of selection
				if (poll.myVoteOptionIds.includes(optionId)) {
					nextOptionIds = poll.myVoteOptionIds.filter((id) => id !== optionId);
				} else {
					nextOptionIds = [...poll.myVoteOptionIds, optionId];
				}
			} else {
				// Single select: clicking voted option removes vote
				nextOptionIds = poll.myVoteOptionIds[0] === optionId ? [] : [optionId];
			}

			setIsVoting(true);
			try {
				const updated =
					nextOptionIds.length === 0
						? await PollActionCreators.removeVote(poll.id)
						: await PollActionCreators.castVote(poll.id, nextOptionIds);
				if (isMounted.current) setPoll(updated);
			} catch (err) {
				logger.error('Vote action failed:', err);
			} finally {
				if (isMounted.current) setIsVoting(false);
			}
		},
		[poll, isVoting, isExpired],
	);

	const handleEnd = useCallback(async () => {
		if (isEnding) return;
		setIsEnding(true);
		try {
			const updated = await PollActionCreators.endPoll(poll.id);
			if (isMounted.current) setPoll(updated);
		} catch (err) {
			logger.error('Failed to end poll:', err);
		} finally {
			if (isMounted.current) setIsEnding(false);
		}
	}, [poll.id, isEnding]);

	return (
		<div className={clsx(styles.poll, isExpired && styles.pollExpired)}>
			{/* Header */}
			<div className={styles.pollHeader}>
				<ChartBarIcon size={16} weight="fill" className={styles.pollIcon} />
				<span className={styles.pollLabel}>
					{isExpired ? <Trans>Poll ended</Trans> : <Trans>Poll</Trans>}
				</span>
			</div>

			{/* Question */}
			<p className={styles.pollQuestion}>{poll.question}</p>

			{/* Options */}
			<div className={styles.pollOptions} role="group" aria-label={t`Poll options`}>
				{poll.options
					.slice()
					.sort((a, b) => a.position - b.position)
					.map((option) => {
						const isSelected = poll.myVoteOptionIds.includes(option.id);
						const percent =
							totalVotes > 0 && showResults
								? Math.round((option.voteCount / totalVotes) * 100)
								: 0;
						const showBar = showResults && totalVotes > 0;

						return (
							<button
								key={option.id}
								type="button"
								className={clsx(
									styles.pollOption,
									isSelected && styles.pollOptionSelected,
									isExpired && styles.pollOptionReadonly,
								)}
								onClick={() => handleVote(option.id)}
								disabled={isVoting || isExpired}
								aria-pressed={isSelected}
							>
								{/* Progress bar fill */}
								{showBar && (
									<div
										className={styles.pollOptionBar}
										style={{width: `${percent}%`}}
										aria-hidden="true"
									/>
								)}
								<span className={styles.pollOptionText}>{option.text}</span>
								{showResults && totalVotes > 0 && (
									<span className={styles.pollOptionPercent}>{percent}%</span>
								)}
							</button>
						);
					})}
			</div>

			{/* Footer */}
			<div className={styles.pollFooter}>
				<span className={styles.pollMeta}>
					{totalVotes} {totalVotes === 1 ? t`vote` : t`votes`}
					{poll.expiresAt && !isExpired && (
						<>
							{' · '}
							<Trans>Ends in {formatTimeRemaining(poll.expiresAt)}</Trans>
						</>
					)}
				</span>

				<div className={styles.pollActions}>
					{hasVoted && !isExpired && (
						<button
							type="button"
							className={styles.changeVoteButton}
							onClick={() => void PollActionCreators.removeVote(poll.id).then((u) => setPoll(u))}
							disabled={isVoting}
						>
							<Trans>Remove vote</Trans>
						</button>
					)}
					{canManage && !isExpired && (
						<button
							type="button"
							className={styles.endPollButton}
							onClick={handleEnd}
							disabled={isEnding}
						>
							{isEnding ? <Trans>Ending…</Trans> : <Trans>End poll</Trans>}
						</button>
					)}
				</div>
			</div>
		</div>
	);
});
