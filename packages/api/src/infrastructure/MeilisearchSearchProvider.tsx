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

import type {ILogger} from '@noctis/api/src/ILogger';
import type {IAuditLogSearchService} from '@noctis/api/src/search/IAuditLogSearchService';
import type {IGuildMemberSearchService} from '@noctis/api/src/search/IGuildMemberSearchService';
import type {IGuildSearchService} from '@noctis/api/src/search/IGuildSearchService';
import type {IMessageSearchService} from '@noctis/api/src/search/IMessageSearchService';
import type {IReportSearchService} from '@noctis/api/src/search/IReportSearchService';
import type {ISearchProvider} from '@noctis/api/src/search/ISearchProvider';
import type {IUserSearchService} from '@noctis/api/src/search/IUserSearchService';
import {MeilisearchAuditLogSearchService} from '@noctis/api/src/search/meilisearch/MeilisearchAuditLogSearchService';
import {MeilisearchGuildMemberSearchService} from '@noctis/api/src/search/meilisearch/MeilisearchGuildMemberSearchService';
import {MeilisearchGuildSearchService} from '@noctis/api/src/search/meilisearch/MeilisearchGuildSearchService';
import {MeilisearchMessageSearchService} from '@noctis/api/src/search/meilisearch/MeilisearchMessageSearchService';
import {MeilisearchReportSearchService} from '@noctis/api/src/search/meilisearch/MeilisearchReportSearchService';
import {MeilisearchUserSearchService} from '@noctis/api/src/search/meilisearch/MeilisearchUserSearchService';
import {createMeilisearchClient} from '@noctis/meilisearch_search/src/MeilisearchClient';

export interface MeilisearchSearchProviderConfig {
	url: string;
	apiKey: string;
	timeoutMs: number;
	taskWaitTimeoutMs: number;
	taskPollIntervalMs: number;
}

export interface MeilisearchSearchProviderOptions {
	config: MeilisearchSearchProviderConfig;
	logger: ILogger;
}

export class MeilisearchSearchProvider implements ISearchProvider {
	private readonly logger: ILogger;
	private readonly config: MeilisearchSearchProviderConfig;

	private messageService: MeilisearchMessageSearchService | null = null;
	private guildService: MeilisearchGuildSearchService | null = null;
	private userService: MeilisearchUserSearchService | null = null;
	private reportService: MeilisearchReportSearchService | null = null;
	private auditLogService: MeilisearchAuditLogSearchService | null = null;
	private guildMemberService: MeilisearchGuildMemberSearchService | null = null;

	constructor(options: MeilisearchSearchProviderOptions) {
		this.logger = options.logger;
		this.config = options.config;
	}

	async initialize(): Promise<void> {
		const client = createMeilisearchClient({
			url: this.config.url,
			apiKey: this.config.apiKey,
			timeoutMs: this.config.timeoutMs,
		});

		const waitForTasks = {
			enabled: true,
			timeoutMs: this.config.taskWaitTimeoutMs,
			intervalMs: this.config.taskPollIntervalMs,
		};

		this.messageService = new MeilisearchMessageSearchService({client, waitForTasks});
		this.guildService = new MeilisearchGuildSearchService({client, waitForTasks});
		this.userService = new MeilisearchUserSearchService({client, waitForTasks});
		this.reportService = new MeilisearchReportSearchService({client, waitForTasks});
		this.auditLogService = new MeilisearchAuditLogSearchService({client, waitForTasks});
		this.guildMemberService = new MeilisearchGuildMemberSearchService({client, waitForTasks});

		await Promise.all([
			this.messageService.initialize(),
			this.guildService.initialize(),
			this.userService.initialize(),
			this.reportService.initialize(),
			this.auditLogService.initialize(),
			this.guildMemberService.initialize(),
		]);

		this.logger.info({url: this.config.url}, 'MeilisearchSearchProvider initialised');
	}

	async shutdown(): Promise<void> {
		const services = [
			this.messageService,
			this.guildService,
			this.userService,
			this.reportService,
			this.auditLogService,
			this.guildMemberService,
		];
		await Promise.all(services.filter((s) => s != null).map((s) => s.shutdown()));

		this.messageService = null;
		this.guildService = null;
		this.userService = null;
		this.reportService = null;
		this.auditLogService = null;
		this.guildMemberService = null;
	}

	getMessageSearchService(): IMessageSearchService | null {
		return this.messageService;
	}

	getGuildSearchService(): IGuildSearchService | null {
		return this.guildService;
	}

	getUserSearchService(): IUserSearchService | null {
		return this.userService;
	}

	getReportSearchService(): IReportSearchService | null {
		return this.reportService;
	}

	getAuditLogSearchService(): IAuditLogSearchService | null {
		return this.auditLogService;
	}

	getGuildMemberSearchService(): IGuildMemberSearchService | null {
		return this.guildMemberService;
	}
}
