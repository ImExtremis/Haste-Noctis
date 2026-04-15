import React, {useState} from 'react';
import {useLingui} from '@lingui/react/macro';
import * as ModalActionCreators from '@app/actions/ModalActionCreators';
import * as ToastActionCreators from '@app/actions/ToastActionCreators';
import {submitAppeal} from '@app/actions/SupportActionCreators';
import * as Modal from '@app/components/modals/Modal';
import {Button} from '@app/components/uikit/button/Button';
import {TextArea} from '@app/components/uikit/text_input/TextArea';
import {TextInput} from '@app/components/uikit/text_input/TextInput';

interface AppealModalProps {
	guildId?: string;
	banId?: string;
}

export const AppealModal: React.FC<AppealModalProps> = ({guildId, banId}) => {
	const {t} = useLingui();
	const [reason, setReason] = useState('');
	const [inputBanId, setInputBanId] = useState(banId || '');
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async () => {
		if (!reason) {
			ToastActionCreators.createToast({type: 'error', children: t`Reason for appeal is required.`});
			return;
		}

		setIsSubmitting(true);
		try {
			await submitAppeal({
				ban_id: inputBanId,
				reason
			});
			ToastActionCreators.createToast({type: 'success', children: t`Appeal submitted successfully. We will review it shortly.`});
			ModalActionCreators.pop();
		} catch (error) {
			ToastActionCreators.createToast({type: 'error', children: t`Failed to submit appeal. Please try again later.`});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Modal.Root size="medium">
			<Modal.Header>
				<Modal.Title>{t`Appeal Your Ban`}</Modal.Title>
				<Modal.CloseButton onClick={() => ModalActionCreators.pop()} />
			</Modal.Header>
			<Modal.Content>
				<div style={{display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px'}}>
					<div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
						<label style={{fontWeight: 600, color: 'var(--text-normal)'}}>{t`Ban Reference ID (Optional)`}</label>
						<TextInput
							value={inputBanId}
							onChange={setInputBanId}
							placeholder={t`Enter Ban ID if you have it`}
							disabled={isSubmitting || !!banId}
						/>
					</div>

					<div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
						<label style={{fontWeight: 600, color: 'var(--text-normal)'}}>{t`Reason for Appeal`}</label>
						<TextArea
							value={reason}
							onChange={setReason}
							placeholder={t`Explain why you believe this action was incorrect...`}
							disabled={isSubmitting}
							rows={6}
						/>
					</div>
				</div>
			</Modal.Content>
			<Modal.Footer>
				<div style={{display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%'}}>
					<Button variant="secondary" onClick={() => ModalActionCreators.pop()} disabled={isSubmitting}>
						{t`Cancel`}
					</Button>
					<Button variant="primary" onClick={handleSubmit} disabled={isSubmitting || !reason} loading={isSubmitting}>
						{t`Submit Appeal`}
					</Button>
				</div>
			</Modal.Footer>
		</Modal.Root>
	);
};
