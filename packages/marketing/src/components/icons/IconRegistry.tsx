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

import {ArrowUpIcon} from '@noctis/marketing/src/components/icons/ArrowUpIcon';
import {BlueskyIcon} from '@noctis/marketing/src/components/icons/BlueskyIcon';
import {BugIcon} from '@noctis/marketing/src/components/icons/BugIcon';
import {CalendarCheckIcon} from '@noctis/marketing/src/components/icons/CalendarCheckIcon';
import {ChatCenteredTextIcon} from '@noctis/marketing/src/components/icons/ChatCenteredTextIcon';
import {ChatsCircleIcon} from '@noctis/marketing/src/components/icons/ChatsCircleIcon';
import {ChatsIcon} from '@noctis/marketing/src/components/icons/ChatsIcon';
import {CodeIcon} from '@noctis/marketing/src/components/icons/CodeIcon';
import {CoinsIcon} from '@noctis/marketing/src/components/icons/CoinsIcon';
import {DevicesIcon} from '@noctis/marketing/src/components/icons/DevicesIcon';
import {NoctisPartnerIcon} from '@noctis/marketing/src/components/icons/NoctisPartnerIcon';
import {NoctisPremiumIcon} from '@noctis/marketing/src/components/icons/NoctisPremiumIcon';
import {NoctisStaffIcon} from '@noctis/marketing/src/components/icons/NoctisStaffIcon';
import {GearIcon} from '@noctis/marketing/src/components/icons/GearIcon';
import {GifIcon} from '@noctis/marketing/src/components/icons/GifIcon';
import {GlobeIcon} from '@noctis/marketing/src/components/icons/GlobeIcon';
import {HashIcon} from '@noctis/marketing/src/components/icons/HashIcon';
import {HeartIcon} from '@noctis/marketing/src/components/icons/HeartIcon';
import {InfinityIcon} from '@noctis/marketing/src/components/icons/InfinityIcon';
import {LinkIcon} from '@noctis/marketing/src/components/icons/LinkIcon';
import {MagnifyingGlassIcon} from '@noctis/marketing/src/components/icons/MagnifyingGlassIcon';
import {MedalIcon} from '@noctis/marketing/src/components/icons/MedalIcon';
import {MicrophoneIcon} from '@noctis/marketing/src/components/icons/MicrophoneIcon';
import {NewspaperIcon} from '@noctis/marketing/src/components/icons/NewspaperIcon';
import {PaletteIcon} from '@noctis/marketing/src/components/icons/PaletteIcon';
import {RocketIcon} from '@noctis/marketing/src/components/icons/RocketIcon';
import {RocketLaunchIcon} from '@noctis/marketing/src/components/icons/RocketLaunchIcon';
import {SealCheckIcon} from '@noctis/marketing/src/components/icons/SealCheckIcon';
import {ShieldCheckIcon} from '@noctis/marketing/src/components/icons/ShieldCheckIcon';
import {SmileyIcon} from '@noctis/marketing/src/components/icons/SmileyIcon';
import {SparkleIcon} from '@noctis/marketing/src/components/icons/SparkleIcon';
import {SpeakerHighIcon} from '@noctis/marketing/src/components/icons/SpeakerHighIcon';
import {TranslateIcon} from '@noctis/marketing/src/components/icons/TranslateIcon';
import {TshirtIcon} from '@noctis/marketing/src/components/icons/TshirtIcon';
import {UserCircleIcon} from '@noctis/marketing/src/components/icons/UserCircleIcon';
import {UserPlusIcon} from '@noctis/marketing/src/components/icons/UserPlusIcon';
import {VideoCameraIcon} from '@noctis/marketing/src/components/icons/VideoCameraIcon';
import {VideoIcon} from '@noctis/marketing/src/components/icons/VideoIcon';

const ICON_MAP = {
	chats: ChatsIcon,
	microphone: MicrophoneIcon,
	palette: PaletteIcon,
	magnifying_glass: MagnifyingGlassIcon,
	devices: DevicesIcon,
	gear: GearIcon,
	heart: HeartIcon,
	globe: GlobeIcon,
	server: GlobeIcon,
	newspaper: NewspaperIcon,

	rocket_launch: RocketLaunchIcon,
	noctis_partner: NoctisPartnerIcon,
	chat_centered_text: ChatCenteredTextIcon,
	bluesky: BlueskyIcon,
	bug: BugIcon,
	code: CodeIcon,
	translate: TranslateIcon,
	shield_check: ShieldCheckIcon,

	noctis_premium: NoctisPremiumIcon,
	noctis_staff: NoctisStaffIcon,
	seal_check: SealCheckIcon,
	link: LinkIcon,
	arrow_up: ArrowUpIcon,
	rocket: RocketIcon,
	coins: CoinsIcon,
	tshirt: TshirtIcon,
	gif: GifIcon,

	video: VideoIcon,
	video_camera: VideoCameraIcon,
	user_circle: UserCircleIcon,
	user_plus: UserPlusIcon,
	speaker_high: SpeakerHighIcon,
	calendar_check: CalendarCheckIcon,
	hash: HashIcon,
	smiley: SmileyIcon,
	sparkle: SparkleIcon,

	infinity: InfinityIcon,
	medal: MedalIcon,
	chats_circle: ChatsCircleIcon,
} as const;

export type IconName = keyof typeof ICON_MAP;

export function Icon({name, class: className}: {name: IconName; class?: string}): JSX.Element {
	const Component = ICON_MAP[name];
	return <Component class={className} />;
}
