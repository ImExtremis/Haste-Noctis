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

import {ConfirmModal} from '@app/components/modals/ConfirmModal';
import {AppealModal} from '@app/components/modals/AppealModal';
import * as ModalActionCreators from '@app/actions/ModalActionCreators';
import {modal} from '@app/actions/ModalActionCreators';
import {useLingui} from '@lingui/react/macro';
import {observer} from 'mobx-react-lite';

export const UserBannedFromGuildModal = observer(() => {
	const {t} = useLingui();
	return (
		<ConfirmModal
			title={t`You're Banned`}
			description={t`You are banned from this community and cannot join.`}
			primaryText={t`Understood`}
			onPrimary={() => {}}
			secondaryText={t`Appeal Ban`}
			onSecondary={() => {
				ModalActionCreators.pop();
				ModalActionCreators.push(modal(() => <AppealModal />));
			}}
		/>
	);
});
