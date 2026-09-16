export type MethodType = 'bank' | 'ewallet' | 'qris';
export type Visibility = 'private' | 'group_members' | 'debtor_only';

export interface PaymentMethodSummary {
	id: string;
	method_type: MethodType;
	provider_name: string;
	account_name?: string;
	masked_account_number?: string;
	qr_image_url?: string;
	visibility: Visibility;
	is_default: boolean;
	is_verified: boolean;
	is_hidden: boolean;
}

export interface CreatePaymentMethodRequest {
	method_type: MethodType;
	provider_name: string;
	account_name?: string;
	account_number?: string;
	qr_image_url?: string;
	visibility: Visibility;
	is_default?: boolean;
}

export interface UpdatePaymentMethodRequest {
	provider_name: string;
	account_name?: string;
	account_number?: string;
	qr_image_url?: string;
	visibility: Visibility;
}

export interface PaymentMethodList {
	payment_methods: PaymentMethodSummary[];
}
