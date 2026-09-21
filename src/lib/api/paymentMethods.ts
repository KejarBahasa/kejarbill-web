import { api } from './client';
import type {
	CreatePaymentMethodRequest,
	PaymentMethodList,
	UpdatePaymentMethodRequest
} from '../types/paymentMethod';

export function createPaymentMethod(body: CreatePaymentMethodRequest) {
	return api<{ payment_method_id: string }>('/v1/payment-methods', { method: 'POST', body }, true);
}

export function getPaymentMethods() {
	return api<PaymentMethodList>('/v1/payment-methods', {}, true);
}

export function updatePaymentMethod(id: string, body: UpdatePaymentMethodRequest) {
	return api<null>(`/v1/payment-methods/${id}`, { method: 'PATCH', body }, true);
}

export function setDefaultPaymentMethod(id: string) {
	return api<null>(`/v1/payment-methods/${id}/default`, { method: 'PATCH' }, true);
}

export function hidePaymentMethod(id: string) {
	return api<null>(`/v1/payment-methods/${id}/hide`, { method: 'PATCH' }, true);
}

export function unhidePaymentMethod(id: string) {
	return api<null>(`/v1/payment-methods/${id}/unhide`, { method: 'PATCH' }, true);
}
