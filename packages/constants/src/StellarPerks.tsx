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

import type {LimitKey} from '@noctis/constants/src/LimitConfigMetadata';

export type PerkStatus = 'available' | 'coming_soon' | 'beta';
export type PerkType = 'boolean' | 'numeric' | 'text';

interface BasePerk {
	id: string;
	type: PerkType;
	status: PerkStatus;
	i18nKey: string;
}

export interface BooleanPerk extends BasePerk {
	type: 'boolean';
	freeValue: boolean;
	stellarValue: boolean;
}

export interface NumericPerk extends BasePerk {
	type: 'numeric';
	freeValue: number;
	stellarValue: number;
	limitKey?: LimitKey;
	unit?: 'count' | 'bytes' | 'characters';
}

export interface TextPerk extends BasePerk {
	type: 'text';
	freeValueI18nKey: string;
	stellarValueI18nKey: string;
}

export type StellarPerk = BooleanPerk | NumericPerk | TextPerk;

export function isBooleanPerk(perk: StellarPerk): perk is BooleanPerk {
	return perk.type === 'boolean';
}

export function isNumericPerk(perk: StellarPerk): perk is NumericPerk {
	return perk.type === 'numeric';
}

export function isTextPerk(perk: StellarPerk): perk is TextPerk {
	return perk.type === 'text';
}

export const STELLAR_PERKS: ReadonlyArray<StellarPerk> = [
	{
		id: 'custom_discriminator',
		type: 'boolean',
		status: 'available',
		i18nKey: 'custom_4_digit_username_tag',
		freeValue: false,
		stellarValue: true,
	},
	{
		id: 'per_guild_profiles',
		type: 'boolean',
		status: 'available',
		i18nKey: 'per_community_profiles',
		freeValue: false,
		stellarValue: true,
	},
	{
		id: 'message_scheduling',
		type: 'boolean',
		status: 'coming_soon',
		i18nKey: 'message_scheduling',
		freeValue: false,
		stellarValue: true,
	},
	{
		id: 'profile_badge',
		type: 'boolean',
		status: 'available',
		i18nKey: 'profile_badge',
		freeValue: false,
		stellarValue: true,
	},
	{
		id: 'custom_video_backgrounds',
		type: 'numeric',
		status: 'beta',
		i18nKey: 'custom_video_backgrounds',
		freeValue: 1,
		stellarValue: 15,
		limitKey: 'max_custom_backgrounds',
		unit: 'count',
	},
	{
		id: 'entrance_sounds',
		type: 'boolean',
		status: 'beta',
		i18nKey: 'entrance_sounds',
		freeValue: false,
		stellarValue: true,
	},
	{
		id: 'max_guilds',
		type: 'numeric',
		status: 'available',
		i18nKey: 'communities',
		freeValue: 100,
		stellarValue: 200,
		limitKey: 'max_guilds',
		unit: 'count',
	},
	{
		id: 'max_message_length',
		type: 'numeric',
		status: 'available',
		i18nKey: 'message_character_limit',
		freeValue: 2000,
		stellarValue: 4000,
		limitKey: 'max_message_length',
		unit: 'characters',
	},
	{
		id: 'max_bookmarks',
		type: 'numeric',
		status: 'available',
		i18nKey: 'bookmarked_messages',
		freeValue: 50,
		stellarValue: 300,
		limitKey: 'max_bookmarks',
		unit: 'count',
	},
	{
		id: 'max_attachment_file_size',
		type: 'numeric',
		status: 'available',
		i18nKey: 'file_upload_size',
		freeValue: 25 * 1024 * 1024,
		stellarValue: 500 * 1024 * 1024,
		limitKey: 'max_attachment_file_size',
		unit: 'bytes',
	},
	{
		id: 'emoji_sticker_packs',
		type: 'boolean',
		status: 'coming_soon',
		i18nKey: 'emoji_sticker_packs',
		freeValue: false,
		stellarValue: true,
	},
	{
		id: 'max_favorite_memes',
		type: 'numeric',
		status: 'beta',
		i18nKey: 'saved_media',
		freeValue: 50,
		stellarValue: 500,
		limitKey: 'max_favorite_memes',
		unit: 'count',
	},
	{
		id: 'use_animated_emojis',
		type: 'boolean',
		status: 'available',
		i18nKey: 'use_animated_emojis',
		freeValue: true,
		stellarValue: true,
	},
	{
		id: 'global_expressions',
		type: 'boolean',
		status: 'available',
		i18nKey: 'global_emoji_sticker_access',
		freeValue: false,
		stellarValue: true,
	},
	{
		id: 'video_quality',
		type: 'text',
		status: 'available',
		i18nKey: 'video_quality',
		freeValueI18nKey: 'video_quality_free',
		stellarValueI18nKey: 'video_quality_premium',
	},
	{
		id: 'animated_profile',
		type: 'boolean',
		status: 'available',
		i18nKey: 'animated_avatars_and_banners',
		freeValue: false,
		stellarValue: true,
	},
	{
		id: 'early_access',
		type: 'boolean',
		status: 'available',
		i18nKey: 'early_access',
		freeValue: false,
		stellarValue: true,
	},
	{
		id: 'custom_themes',
		type: 'boolean',
		status: 'available',
		i18nKey: 'custom_themes',
		freeValue: true,
		stellarValue: true,
	},
] as const;

export function getPerksByStatus(status: PerkStatus): ReadonlyArray<StellarPerk> {
	return STELLAR_PERKS.filter((perk) => perk.status === status);
}

export function getAvailablePerks(): ReadonlyArray<StellarPerk> {
	return getPerksByStatus('available');
}

export function getBetaPerks(): ReadonlyArray<StellarPerk> {
	return getPerksByStatus('beta');
}

export function getComingSoonPerks(): ReadonlyArray<StellarPerk> {
	return getPerksByStatus('coming_soon');
}
