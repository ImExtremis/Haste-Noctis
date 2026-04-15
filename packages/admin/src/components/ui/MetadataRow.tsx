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

/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */

import {cn} from '@noctis/admin/src/utils/ClassNames';

interface MetadataRowProps {
	label: string;
	value: string | number | any;
	class?: string;
}

export function MetadataRow({label, value, class: className}: MetadataRowProps) {
	return (
		<div class={cn('flex gap-2', className)}>
			<span class="text-neutral-500 text-sm">{label}:</span>
			<span class="text-neutral-900 text-sm">{value}</span>
		</div>
	);
}
