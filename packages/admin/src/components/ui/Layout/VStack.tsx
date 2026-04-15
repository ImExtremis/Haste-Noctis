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
import type {PropsWithChildren} from 'hono/jsx';

export type VStackAlign = 'start' | 'center' | 'end' | 'stretch';

export interface VStackProps {
	gap?: number | string;
	align?: VStackAlign;
	class?: string;
}

const alignClasses: Record<VStackAlign, string> = {
	start: 'items-start',
	center: 'items-center',
	end: 'items-end',
	stretch: 'items-stretch',
};

function getGapClass(gap: number | string): string {
	if (typeof gap === 'number') {
		return `gap-${gap}`;
	}
	return gap;
}

export function VStack({gap = 4, align = 'stretch', class: className, children}: PropsWithChildren<VStackProps>) {
	const classes = cn('flex flex-col', getGapClass(gap), alignClasses[align], className);

	return <div class={classes}>{children}</div>;
}
