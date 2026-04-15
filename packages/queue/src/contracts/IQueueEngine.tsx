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

import type {EnqueueResult, Job, JobRecord, LeasedJob, QueueStats} from '@noctis/queue/src/domain/QueueDomainTypes';
import type {JsonValue} from '@noctis/queue/src/types/JsonTypes';

export interface IQueueEngine {
	start(): Promise<void>;
	stop(): Promise<void>;
	enqueue(
		taskType: string,
		payload: JsonValue,
		priority?: number,
		runAtMs?: number | null,
		maxAttempts?: number,
		deduplicationId?: string | null,
	): Promise<EnqueueResult>;
	dequeue(
		taskTypes: Array<string> | null,
		limit: number,
		waitTimeMs: number,
		visibilityTimeoutMs: number | null,
	): Promise<Array<LeasedJob>>;
	ack(receipt: string): Promise<boolean>;
	nack(receipt: string, error?: string): Promise<boolean>;
	changeVisibility(receipt: string, timeoutMs: number): Promise<boolean>;
	retryJob(jobId: string): Promise<Job | null>;
	deleteJob(jobId: string): Promise<boolean>;
	getStats(): QueueStats;
	getJob(jobId: string): JobRecord | null;
	resetState(): Promise<void>;
}
