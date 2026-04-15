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

import {NoctisIcon} from '@app/components/icons/NoctisIcon';
import styles from '@app/components/pages/NotFoundPage.module.css';
import {Button} from '@app/components/uikit/button/Button';
import {useNoctisDocumentTitle} from '@app/hooks/useNoctisDocumentTitle';
import {Link} from '@app/lib/router/React';
import {Routes} from '@app/Routes';
import {Trans} from '@lingui/react/macro';
import {observer} from 'mobx-react-lite';

export const NotFoundPage = observer(() => {
	useNoctisDocumentTitle('Not Found');

	return (
		<div className={styles.container}>
			<NoctisIcon className={styles.icon} />
			<div className={styles.content}>
				<h1 className={styles.title}>
					<Trans>404: Page Not Found</Trans>
				</h1>
				<p className={styles.description}>
					<Trans>The page you're looking for doesn't exist or has been moved.</Trans>
				</p>
			</div>
			<div className={styles.actions}>
				<Link to={Routes.ME}>
					<Button>
						<Trans>Go to Home</Trans>
					</Button>
				</Link>
			</div>
		</div>
	);
});
