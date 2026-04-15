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

import * as ModalActionCreators from '@app/actions/ModalActionCreators';
import {modal} from '@app/actions/ModalActionCreators';
import {UserSettingsModal} from '@app/components/modals/UserSettingsModal';
import {StellarUpsell} from '@app/components/uikit/stellar_upsell/StellarUpsell';
import {Trans} from '@lingui/react/macro';
import {observer} from 'mobx-react-lite';

export const StellarUpsellBanner = observer(() => {
	return (
		<StellarUpsell
			buttonText={<Trans>View Plans</Trans>}
			onButtonClick={() => {
				ModalActionCreators.pop();
				ModalActionCreators.push(modal(() => <UserSettingsModal initialTab="stellar" />));
			}}
		>
			<Trans>Get Stellar for yourself and unlock higher limits and exclusive features.</Trans>
		</StellarUpsell>
	);
});
