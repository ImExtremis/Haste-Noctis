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

import {AdminApiKeyAdminController} from '@noctis/api/src/admin/controllers/AdminApiKeyAdminController';
import {ArchiveAdminController} from '@noctis/api/src/admin/controllers/ArchiveAdminController';
import {AssetAdminController} from '@noctis/api/src/admin/controllers/AssetAdminController';
import {AuditLogAdminController} from '@noctis/api/src/admin/controllers/AuditLogAdminController';
import {BanAdminController} from '@noctis/api/src/admin/controllers/BanAdminController';
import {BulkAdminController} from '@noctis/api/src/admin/controllers/BulkAdminController';
import {ChildSafetyAdminController} from '@noctis/api/src/admin/controllers/ChildSafetyAdminController';
import {CodesAdminController} from '@noctis/api/src/admin/controllers/CodesAdminController';
import {DiscoveryAdminController} from '@noctis/api/src/admin/controllers/DiscoveryAdminController';
import {GatewayAdminController} from '@noctis/api/src/admin/controllers/GatewayAdminController';
import {GuildAdminController} from '@noctis/api/src/admin/controllers/GuildAdminController';
import {InstanceConfigAdminController} from '@noctis/api/src/admin/controllers/InstanceConfigAdminController';
import {LimitConfigAdminController} from '@noctis/api/src/admin/controllers/LimitConfigAdminController';
import {MessageAdminController} from '@noctis/api/src/admin/controllers/MessageAdminController';
import {ReportAdminController} from '@noctis/api/src/admin/controllers/ReportAdminController';
import {SearchAdminController} from '@noctis/api/src/admin/controllers/SearchAdminController';
import {SnowflakeReservationAdminController} from '@noctis/api/src/admin/controllers/SnowflakeReservationAdminController';
import {SystemDmAdminController} from '@noctis/api/src/admin/controllers/SystemDmAdminController';
import {UserAdminController} from '@noctis/api/src/admin/controllers/UserAdminController';
import {VisionarySlotAdminController} from '@noctis/api/src/admin/controllers/VisionarySlotAdminController';
import {VoiceAdminController} from '@noctis/api/src/admin/controllers/VoiceAdminController';
import type {HonoApp} from '@noctis/api/src/types/HonoEnv';

export function registerAdminControllers(app: HonoApp) {
	AdminApiKeyAdminController(app);
	UserAdminController(app);
	CodesAdminController(app);
	GuildAdminController(app);
	AssetAdminController(app);
	BanAdminController(app);
	InstanceConfigAdminController(app);
	LimitConfigAdminController(app);
	SnowflakeReservationAdminController(app);
	MessageAdminController(app);
	BulkAdminController(app);
	AuditLogAdminController(app);
	ArchiveAdminController(app);
	ReportAdminController(app);
	ChildSafetyAdminController(app);
	VoiceAdminController(app);
	GatewayAdminController(app);
	SearchAdminController(app);
	DiscoveryAdminController(app);
	VisionarySlotAdminController(app);
	SystemDmAdminController(app);
}
