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

import applicationProcessDeletion from '@noctis/api/src/worker/tasks/ApplicationProcessDeletion';
import batchGuildAuditLogMessageDeletes from '@noctis/api/src/worker/tasks/BatchGuildAuditLogMessageDeletes';
import bulkDeleteUserMessages from '@noctis/api/src/worker/tasks/BulkDeleteUserMessages';
// import cleanupCsamEvidence from '@noctis/api/src/worker/tasks/CleanupCsamEvidence';
// import csamScanConsumer from '@noctis/api/src/worker/tasks/CsamScanConsumerWorker';
import deleteUserMessagesInGuildByTime from '@noctis/api/src/worker/tasks/DeleteUserMessagesInGuildByTime';
import expireAttachments from '@noctis/api/src/worker/tasks/ExpireAttachments';
import extractEmbeds from '@noctis/api/src/worker/tasks/ExtractEmbeds';
import handleMentions from '@noctis/api/src/worker/tasks/HandleMentions';
import harvestGuildData from '@noctis/api/src/worker/tasks/HarvestGuildData';
import harvestUserData from '@noctis/api/src/worker/tasks/HarvestUserData';
import indexChannelMessages from '@noctis/api/src/worker/tasks/IndexChannelMessages';
import indexGuildMembers from '@noctis/api/src/worker/tasks/IndexGuildMembers';
import messageShred from '@noctis/api/src/worker/tasks/MessageShred';
import processAssetDeletionQueue from '@noctis/api/src/worker/tasks/ProcessAssetDeletionQueue';
import processCloudflarePurgeQueue from '@noctis/api/src/worker/tasks/ProcessCloudflarePurgeQueue';
import processInactivityDeletions from '@noctis/api/src/worker/tasks/ProcessInactivityDeletions';
import processPendingBulkMessageDeletions from '@noctis/api/src/worker/tasks/ProcessPendingBulkMessageDeletions';
import refreshSearchIndex from '@noctis/api/src/worker/tasks/RefreshSearchIndex';
import revalidateUserConnections from '@noctis/api/src/worker/tasks/RevalidateUserConnections';
import {sendScheduledMessage} from '@noctis/api/src/worker/tasks/SendScheduledMessage';
import {sendSystemDm} from '@noctis/api/src/worker/tasks/SendSystemDm';
import syncDiscoveryIndex from '@noctis/api/src/worker/tasks/SyncDiscoveryIndex';
import userProcessPendingDeletion from '@noctis/api/src/worker/tasks/UserProcessPendingDeletion';
import userProcessPendingDeletions from '@noctis/api/src/worker/tasks/UserProcessPendingDeletions';
import type {WorkerTaskHandler} from '@noctis/worker/src/contracts/WorkerTask';

export const workerTasks: Record<string, WorkerTaskHandler> = {
	applicationProcessDeletion,
	batchGuildAuditLogMessageDeletes,
	bulkDeleteUserMessages,
	// csamScanConsumer,
	deleteUserMessagesInGuildByTime,
	expireAttachments,
	extractEmbeds,
	handleMentions,
	harvestGuildData,
	harvestUserData,
	indexChannelMessages,
	indexGuildMembers,
	messageShred,
	processAssetDeletionQueue,
	// cleanupCsamEvidence,
	processCloudflarePurgeQueue,
	processInactivityDeletions,
	processPendingBulkMessageDeletions,
	refreshSearchIndex,
	revalidateUserConnections,
	sendScheduledMessage,
	sendSystemDm,
	syncDiscoveryIndex,
	userProcessPendingDeletion,
	userProcessPendingDeletions,
};
