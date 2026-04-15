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
	calculateSpecificity as calculateRuntimeSpecificity,
	compareSpecificity as compareRuntimeSpecificity,
} from '@noctis/limits/src/LimitRuleRuntime';
import type {LimitFilter} from '@noctis/limits/src/LimitTypes';

export function calculateSpecificity(filters: LimitFilter | undefined): number {
	return calculateRuntimeSpecificity(filters);
}

export function compareSpecificity(a: LimitFilter | undefined, b: LimitFilter | undefined): number {
	return compareRuntimeSpecificity(a, b);
}
