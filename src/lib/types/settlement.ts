export type PaymentChannel = 'cash' | 'bank_transfer' | 'ewallet';

export type SettlementStatus = 'pending' | 'completed' | 'cancelled';

export interface ParticipantRef {
	participant_id: string;
	display_name: string;
}

export interface SettlementSummary {
	id: string;
	settlement_date: string;
	amount: number;
	from_participant: ParticipantRef;
	to_participant: ParticipantRef;
}

export interface SettlementDetail extends SettlementSummary {
	group_id: string;
	payment_channel: PaymentChannel;
	status: SettlementStatus;
	paid_at: string;
	notes?: string;
	payment_method?: {
		id: string;
		method_type: string;
		provider_name: string;
	};
}

export interface CreateSettlementRequest {
	from_participant_id: string;
	to_participant_id: string;
	payment_channel: PaymentChannel;
	payment_method_id?: string;
	notes?: string;
	paid_at: string;
	amount: number;
}

export interface SettlementList {
	settlements: SettlementSummary[];
}

