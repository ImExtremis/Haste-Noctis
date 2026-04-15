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

import {StellarContent} from '@app/components/modals/components/StellarContent';
import * as Modal from '@app/components/modals/Modal';
import styles from '@app/components/modals/PremiumModal.module.css';
import {type PremiumModalProps, usePremiumModalLogic} from '@app/utils/modals/PremiumModalUtils';
import {Trans} from '@lingui/react/macro';
import {observer} from 'mobx-react-lite';

export const PremiumModal = observer(({defaultGiftMode}: PremiumModalProps) => {
	const modalLogic = usePremiumModalLogic({
		defaultGiftMode,
	});

	return (
		<Modal.Root size="large">
			<Modal.Header title={<Trans>Noctis Stellar</Trans>} />
			<Modal.Content>
				<div className={styles.contentContainer}>
					<StellarContent defaultGiftMode={modalLogic.defaultGiftMode} />
				</div>
			</Modal.Content>
		</Modal.Root>
	);
});
