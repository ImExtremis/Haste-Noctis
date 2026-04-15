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

const logger = new Logger('PollActionCreators');

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PollOption {
	id: string;
	pollId: string;
	text: string;
	position: number;
	voteCount: number;
}

export interface Poll {
	id: string;
	channelId: string;
	messageId: string;
	creatorId: string;
	question: string;
	allowMultiselect: boolean;
	resultsHidden: boolean;
	expiresAt: string | null;
	createdAt: string;
	isExpired: boolean;
	myVoteOptionIds: Array<string>;
	options: Array<PollOption>;
	totalVotes: number;
}

export interface CreatePollPayload {
	question: string;
	options: Array<string>;
	allowMultiselect?: boolean;
	resultsHidden?: boolean;
	expiresAt?: string | null;
}

// ─── Action Creators ──────────────────────────────────────────────────────────

/**
 * Create a new poll in a channel.
 * Returns the created Poll object.
 */
export async function createPoll(channelId: string, payload: CreatePollPayload): Promise<Poll> {
	try {
		logger.debug('Creating poll in channel', {channelId, question: payload.question});
		const response = await http.post<Poll>({
			url: Endpoints.CHANNEL_POLLS(channelId),
			body: {
				question: payload.question,
				options: payload.options,
				allow_multiselect: payload.allowMultiselect ?? false,
				results_hidden: payload.resultsHidden ?? false,
				expires_at: payload.expiresAt ?? null,
			},
		});
		logger.info('Poll created', {pollId: response.body.id});
		return response.body;
	} catch (error) {
		logger.error('Failed to create poll:', error);
		throw error;
	}
}

/**
 * Fetch a poll by ID (including current vote counts).
 */
export async function fetchPoll(pollId: string): Promise<Poll> {
	try {
		logger.debug('Fetching poll', {pollId});
		const response = await http.get<Poll>({url: Endpoints.POLL(pollId)});
		return response.body;
	} catch (error) {
		logger.error('Failed to fetch poll:', error);
		throw error;
	}
}

/**
 * Cast vote(s) on a poll.
 * optionIds must contain exactly one element unless the poll allows multiselect.
 * Returns the updated poll.
 */
export async function castVote(pollId: string, optionIds: Array<string>): Promise<Poll> {
	try {
		logger.debug('Casting vote on poll', {pollId, optionIds});
		const response = await http.post<Poll>({
			url: Endpoints.POLL_VOTE(pollId),
			body: {option_ids: optionIds},
		});
		logger.debug('Vote cast', {pollId});
		return response.body;
	} catch (error) {
		logger.error('Failed to cast vote:', error);
		throw error;
	}
}

/**
 * Remove the current user's vote(s) from a poll.
 * Only valid while the poll is not yet expired.
 */
export async function removeVote(pollId: string): Promise<Poll> {
	try {
		logger.debug('Removing vote from poll', {pollId});
		const response = await http.delete<Poll>({
			url: Endpoints.POLL_VOTE(pollId),
			body: {},
		});
		logger.debug('Vote removed', {pollId});
		return response.body;
	} catch (error) {
		logger.error('Failed to remove vote:', error);
		throw error;
	}
}

/**
 * End a poll early (creator or Manage Messages permission required).
 */
export async function endPoll(pollId: string): Promise<Poll> {
	try {
		logger.debug('Ending poll early', {pollId});
		const response = await http.post<Poll>({
			url: Endpoints.POLL_END(pollId),
			body: {},
		});
		logger.info('Poll ended', {pollId});
		return response.body;
	} catch (error) {
		logger.error('Failed to end poll:', error);
		throw error;
	}
}
