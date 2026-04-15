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

import type {ValueOf} from '@noctis/constants/src/ValueOf';
import type {Node} from '@noctis/markdown_parser/src/types/Nodes';
import type {I18n} from '@lingui/core';
import type React from 'react';

export const MarkdownContext = {
	STANDARD_WITH_JUMBO: 0,
	RESTRICTED_INLINE_REPLY: 1,
	RESTRICTED_USER_BIO: 2,
	RESTRICTED_EMBED_DESCRIPTION: 3,
	STANDARD_WITHOUT_JUMBO: 4,
} as const;
export type MarkdownContext = ValueOf<typeof MarkdownContext>;

export interface MarkdownParseOptions {
	context: MarkdownContext;
	disableAnimatedEmoji?: boolean;
	disableInteractions?: boolean;
	channelId?: string;
	messageId?: string;
	guildId?: string;
}

export interface MarkdownRenderOptions extends MarkdownParseOptions {
	shouldJumboEmojis: boolean;
	i18n: I18n;
}

export interface RendererProps<T extends Node = Node> {
	node: T;
	id: string;
	renderChildren: (nodes: Array<Node>) => React.ReactNode;
	options: MarkdownRenderOptions;
}
