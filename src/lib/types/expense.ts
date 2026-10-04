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

export type DiscountType = 'amount' | 'percentage';

export interface ExpenseDiscountRequest {
	discount_type: DiscountType | '';
	discount_value: number;
}

export interface ExpenseParticipant {
	participant_id: string;
	display_name: string;
	participant_type: 'registered' | 'guest';
	share_amount: number;
}

export interface ExpenseItem {
	id: string;
	name: string;
	notes?: string;
	qty: number;
	unit_price: number;
	subtotal: number;
	participants: Array<{
		participant_id: string;
		display_name: string;
		share_amount: number;
	}>;
}

export interface ExpenseDetail extends ExpenseSummary {
	version: number;
	subtotal_amount: number;
	discount_type: DiscountType;
	discount_value: number;
	discount_amount: number;
	participants: ExpenseParticipant[];
	items: ExpenseItem[];
}

export interface UpdateExpenseBase {
	title: string;
	description?: string;
	currency: string;
	expense_date: string;
	payer_participant_id: string;
	split_method: 'equal' | 'custom' | 'itemized';
	version: number;
}

export type UpdateExpenseRequest =
	| (UpdateExpenseBase & ExpenseDiscountRequest & { split_method: 'equal'; subtotal_amount: number; total_amount?: number; participant_ids: string[] })
	| (UpdateExpenseBase & ExpenseDiscountRequest & { split_method: 'custom'; participants: CustomExpenseParticipant[] })
	| (UpdateExpenseBase & ExpenseDiscountRequest & { split_method: 'itemized'; items: CreateItemizedExpenseRequest['items'] });

export interface CreateEqualExpenseRequest {
	participant_ids: string[];
	group_id: string;
	title: string;
	description?: string;
	payer_participant_id: string;
	currency: string;
	expense_date: string;
	subtotal_amount: number;
	total_amount?: number;
	discount_type: DiscountType | '';
	discount_value: number;
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
	discount_type: DiscountType | '';
	discount_value: number;
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
		participant_ids: string[];
		notes?: string;
		qty: number;
		unit_price: number;
	}>;
	discount_type: DiscountType | '';
	discount_value: number;
}

export interface ExpenseList {
	expenses: ExpenseSummary[];
}
