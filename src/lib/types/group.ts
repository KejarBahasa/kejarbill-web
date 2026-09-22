export type GroupRole = 'member' | 'admin' | 'owner';

export interface Participant {
	id: string;
	user_id: string | null;
	participant_type: 'registered' | 'guest';
	display_name: string;
	/** role keanggotaan dari group_members; null utk guest */
	role?: GroupRole | null;
	is_self: boolean;
}

export interface CreateGroupRequest {
	name: string;
	description?: string;
}

export interface GroupDetail extends CreateGroupRequest {
	id: string;
	created_at: string;
	total_members: number;
	total_participants: number;
	total_expenses: number;
}

export interface GroupSummary {
	group_total: number;
	my_total_paid: number;
	my_total_debt: number;
	my_total_credit: number;
}

export type DebtStatus = 'unpaid' | 'partial' | 'paid';

export interface MyDebtExpense {
	expense_id: string;
	title: string;
	expense_date: string;
	amount: number;
	paid_amount: number;
	remaining_amount: number;
	status: DebtStatus;
}

export interface MyDebt {
	to_participant: {
		id: string;
		display_name: string;
	};
	total_amount: number;
	paid_amount: number;
	remaining_amount: number;
	status: DebtStatus;
	expenses: MyDebtExpense[];
}

export interface MyDebtsResponse {
	debts: MyDebt[];
	total_amount: number;
	paid_amount: number;
	remaining_amount: number;
}

export type ActivityType = 'expense' | 'settlement';
export interface GroupActivity {
	type: ActivityType;
	created_at: string;
	expense?: GroupActivityExpense;
	settlement?: GroupActivitySettlement;
}

export interface GroupActivityExpense {
	id: string;
	title: string;
	payer_display_name: string;
	total_amount: number;
}

export interface GroupActivitySettlement {
	id: string;
	from_display_name: string;
	to_display_name: string;
	amount: number;
}

export interface Balance {
	from_participant: {
		id: string;
		display_name: string;
	};
	to_participant: {
		id: string;
		display_name: string;
	};
	amount: number;
}

export interface AddMembersRequest {
	user_id: string;
}

export interface AddMembersBulkRequest {
	user_ids: string[];
}

export interface AddGuestsRequest {
	guests: Array<{ display_name: string }>;
}

export interface GroupList {
	groups: GroupDetail[];
}

export interface ActivityList {
	activities: GroupActivity[];
}

export interface ParticipantList {
	participants: Participant[];
}
