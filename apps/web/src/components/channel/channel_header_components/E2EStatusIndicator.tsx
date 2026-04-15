import React, {useEffect, useState} from 'react';
import {LockKeyIcon, LockKeyOpenIcon} from '@phosphor-icons/react';
import {Tooltip} from '@app/components/uikit/tooltip/Tooltip';
import {getActivePrivateKey} from '@app/lib/E2EKeyStorage';
import type {UserRecord} from '@app/records/UserRecord';
import styles from './E2EStatusIndicator.module.css';

interface E2EStatusIndicatorProps {
	isDM: boolean;
	recipient: UserRecord | null;
}

export const E2EStatusIndicator: React.FC<E2EStatusIndicatorProps> = ({isDM, recipient}) => {
	const [hasOurKey, setHasOurKey] = useState(false);

	useEffect(() => {
		setHasOurKey(getActivePrivateKey() !== null);
	}, []);

	if (!isDM || !recipient) {
		return null;
	}

	const hasTheirKey = !!recipient.e2ePublicKey;
	const isE2EEnabled = hasOurKey && hasTheirKey;

	return (
		<div className={styles.container}>
			<Tooltip
				text={
					isE2EEnabled
						? 'End-to-End Encrypted'
						: hasOurKey
							? 'Recipient has not setup E2E encryption'
							: 'You have not setup E2E encryption'
				}
				position="bottom"
			>
				<div className={isE2EEnabled ? styles.secure : styles.insecure}>
					{isE2EEnabled ? <LockKeyIcon weight="fill" /> : <LockKeyOpenIcon />}
				</div>
			</Tooltip>
		</div>
	);
};
