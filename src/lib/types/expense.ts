export interface ExpensePayer {
	participant_id: string;
	display_name: string;
}

export interface ExpenseSummary {
	id: string;
	title: string;
	description?: string;
	currency: string;
	total_amount: number;
	expense_date: string;
	payer: ExpensePayer;
}

export interface ExpenseParticipant {
	participant_id: string;
	display_name: string;
	participant_type: 'member' | 'guest';
	share_amount: number;
}

export interface ExpenseItem {
	id: string;
	name: string;
	notes?: string;
	qty: number;
	unit_price: number;
	subtotal: number;
}

export interface ExpenseDetail extends ExpenseSummary {
	participants: ExpenseParticipant[];
	items: ExpenseItem[];
}

export interface CreateEqualExpenseRequest {
	participant_ids: string[];
	group_id: string;
	title: string;
	description?: string;
	payer_participant_id: string;
	currency: string;
	expense_date: string;
	total_amount: number;
}

export interface CustomExpenseParticipant {
	participant_id: string;
	share_amount: number;
}

export interface CreateCustomExpenseRequest {
	group_id: string;
	title: string;
	description?: string;
	currency: string;
	expense_date: string;
	payer_participant_id: string;
	participants: CustomExpenseParticipant[];
}

export interface CreateItemizedExpenseRequest {
	group_id: string;
	title: string;
	description?: string;
	currency: string;
	expense_date: string;
	payer_participant_id: string;
	items: Array<{
		name: string;
		participant_id: string;
		notes?: string;
		qty: number;
		unit_price: number;
	}>;
}

export interface ExpenseList {
	expenses: ExpenseSummary[];
}

