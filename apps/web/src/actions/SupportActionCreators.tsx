import {Endpoints} from '@app/Endpoints';
import http from '@app/lib/HttpClient';

export interface SupportTicketPayload {
	category: string;
	subject: string;
	description: string;
	priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface SupportAppealPayload {
	ban_id?: string;
	reason: string;
}

export async function submitSupportTicket(payload: SupportTicketPayload): Promise<void> {
	await http.post({
		url: Endpoints.SUPPORT_TICKETS,
		body: payload,
	});
}

export async function submitAppeal(payload: SupportAppealPayload): Promise<void> {
	await http.post({
		url: Endpoints.SUPPORT_APPEALS,
		body: payload,
	});
}
