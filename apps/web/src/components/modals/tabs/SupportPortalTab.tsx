import React, {useState} from 'react';
import {useLingui} from '@lingui/react/macro';
import {SettingsFormTitle, SettingsFormDescription} from '@app/components/uikit/settings_form/SettingsForm';
import {Button} from '@app/components/uikit/button/Button';
import {TextInput} from '@app/components/uikit/text_input/TextInput';
import {TextArea} from '@app/components/uikit/text_input/TextArea';
import {Select} from '@app/components/uikit/select/Select';
import {submitSupportTicket, submitAppeal} from '@app/actions/SupportActionCreators';
import * as ToastActionCreators from '@app/actions/ToastActionCreators';
import styles from './SupportPortalTab.module.css';

export default function SupportPortalTab() {
	const {t} = useLingui();
	const [activeSection, setActiveSection] = useState<'ticket' | 'appeal'>('ticket');

	// Ticket state
	const [ticketCategory, setTicketCategory] = useState({value: 'general', label: t`General Inquiry`});
	const [ticketSubject, setTicketSubject] = useState('');
	const [ticketDescription, setTicketDescription] = useState('');
	const [ticketPriority, setTicketPriority] = useState<{value: 'low' | 'normal' | 'high' | 'urgent', label: string}>({value: 'normal', label: t`Normal`});
	const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

	// Appeal state
	const [appealBanId, setAppealBanId] = useState('');
	const [appealReason, setAppealReason] = useState('');
	const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);

	const handleTicketSubmit = async () => {
		if (!ticketSubject || !ticketDescription) {
			ToastActionCreators.createToast({type: 'error', children: t`Subject and description are required.`});
			return;
		}
		
		setIsSubmittingTicket(true);
		try {
			await submitSupportTicket({
				category: ticketCategory.value,
				subject: ticketSubject,
				description: ticketDescription,
				priority: ticketPriority.value
			});
			ToastActionCreators.createToast({type: 'success', children: t`Support ticket submitted successfully.`});
			setTicketSubject('');
			setTicketDescription('');
		} catch (error) {
			ToastActionCreators.createToast({type: 'error', children: t`Failed to submit support ticket.`});
		} finally {
			setIsSubmittingTicket(false);
		}
	};

	const handleAppealSubmit = async () => {
		if (!appealReason) {
			ToastActionCreators.createToast({type: 'error', children: t`Reason for appeal is required.`});
			return;
		}

		setIsSubmittingAppeal(true);
		try {
			await submitAppeal({
				ban_id: appealBanId,
				reason: appealReason
			});
			ToastActionCreators.createToast({type: 'success', children: t`Appeal submitted successfully.`});
			setAppealBanId('');
			setAppealReason('');
		} catch (error) {
			ToastActionCreators.createToast({type: 'error', children: t`Failed to submit appeal.`});
		} finally {
			setIsSubmittingAppeal(false);
		}
	};

	const TICKET_CATEGORIES = [
		{value: 'general', label: t`General Inquiry`},
		{value: 'billing', label: t`Billing & Subscriptions`},
		{value: 'technical', label: t`Technical Support`},
		{value: 'report', label: t`Report a User or Guild`},
	];

	const TICKET_PRIORITIES = [
		{value: 'low', label: t`Low`},
		{value: 'normal', label: t`Normal`},
		{value: 'high', label: t`High`},
		{value: 'urgent', label: t`Urgent`},
	] as Array<{value: 'low' | 'normal' | 'high' | 'urgent', label: string}>;

	return (
		<div className={styles.container}>
			<SettingsFormTitle>{t`Support & Appeals Portal`}</SettingsFormTitle>
			<SettingsFormDescription>
				{t`Submit a request for assistance or file an appeal if you believe an action was taken against your account in error.`}
			</SettingsFormDescription>

			<div className={styles.tabSelector}>
				<Button
					variant={activeSection === 'ticket' ? 'primary' : 'secondary'}
					onClick={() => setActiveSection('ticket')}
				>
					{t`Submit a Ticket`}
				</Button>
				<Button
					variant={activeSection === 'appeal' ? 'primary' : 'secondary'}
					onClick={() => setActiveSection('appeal')}
				>
					{t`File an Appeal`}
				</Button>
			</div>

			{activeSection === 'ticket' && (
				<div className={styles.formSection}>
					<SettingsFormTitle>{t`New Support Ticket`}</SettingsFormTitle>
					
					<div className={styles.formGroup}>
						<label className={styles.formLabel}>{t`Category`}</label>
						<Select
							value={ticketCategory}
							options={TICKET_CATEGORIES}
							onChange={(v) => { if(v && !Array.isArray(v)) setTicketCategory(v as {value: string, label: string}); }}
						/>
					</div>

					<div className={styles.formGroup}>
						<label className={styles.formLabel}>{t`Priority`}</label>
						<Select
							value={ticketPriority}
							options={TICKET_PRIORITIES}
							onChange={(v) => { if(v && !Array.isArray(v)) setTicketPriority(v as {value: 'low'|'normal'|'high'|'urgent', label: string}); }}
						/>
					</div>

					<div className={styles.formGroup}>
						<label className={styles.formLabel}>{t`Subject`}</label>
						<TextInput
							value={ticketSubject}
							onChange={setTicketSubject}
							placeholder={t`Briefly describe your issue`}
							disabled={isSubmittingTicket}
						/>
					</div>

					<div className={styles.formGroup}>
						<label className={styles.formLabel}>{t`Description`}</label>
						<TextArea
							value={ticketDescription}
							onChange={setTicketDescription}
							placeholder={t`Provide details about your inquiry or issue`}
							disabled={isSubmittingTicket}
						/>
					</div>

					<Button onClick={handleTicketSubmit} disabled={isSubmittingTicket} loading={isSubmittingTicket}>
						{t`Submit Ticket`}
					</Button>
				</div>
			)}

			{activeSection === 'appeal' && (
				<div className={styles.formSection}>
					<SettingsFormTitle>{t`Appeal an Action`}</SettingsFormTitle>
					
					<div className={styles.formGroup}>
						<label className={styles.formLabel}>{t`Ban ID (Optional)`}</label>
						<TextInput
							value={appealBanId}
							onChange={setAppealBanId}
							placeholder={t`If you have a Ban ID from a notification, enter it here`}
							disabled={isSubmittingAppeal}
						/>
					</div>

					<div className={styles.formGroup}>
						<label className={styles.formLabel}>{t`Reason for Appeal`}</label>
						<TextArea
							value={appealReason}
							onChange={setAppealReason}
							placeholder={t`Explain why you believe the action taken against you was incorrect`}
							disabled={isSubmittingAppeal}
						/>
					</div>

					<Button onClick={handleAppealSubmit} disabled={isSubmittingAppeal} loading={isSubmittingAppeal}>
						{t`Submit Appeal`}
					</Button>
				</div>
			)}
		</div>
	);
}
