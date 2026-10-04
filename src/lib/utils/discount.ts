import type { DiscountType, ExpenseDiscountRequest } from '$lib/types/expense';

export interface DiscountDraft {
	type: DiscountType | '';
	value: number;
}

export function discountRequest(discount: DiscountDraft): ExpenseDiscountRequest {
	return {
		discount_type: discount.value > 0 ? discount.type || 'amount' : '',
		discount_value: Math.max(0, Number(discount.value) || 0)
	};
}

export function validateDiscount(discount: DiscountDraft, subtotal: number): string {
	const value = Number(discount.value) || 0;
	if (value < 0) return 'Discount tidak boleh negatif.';
	if (value === 0) return '';
	if (!Number.isInteger(value)) return 'Discount harus berupa bilangan bulat.';
	if (!discount.type) return 'Pilih tipe discount.';
	if (discount.type === 'percentage' && value > 100) return 'Discount persentase harus antara 0 sampai 100.';
	if (discount.type === 'amount' && value >= subtotal) return 'Discount nominal harus lebih kecil dari subtotal.';
	return '';
}
