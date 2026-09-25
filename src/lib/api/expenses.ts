import { api, apiWithMeta, type ApiResult } from './client';
import type {
	CreateCustomExpenseRequest,
	CreateEqualExpenseRequest,
	CreateItemizedExpenseRequest,
	ExpenseDetail,
	ExpenseList,
	UpdateExpenseRequest
} from '../types/expense';

export function createEqualExpense(body: CreateEqualExpenseRequest) {
	return api<{ id: string }>('/v1/expenses/equal', { method: 'POST', body }, true);
}

export function createCustomExpense(body: CreateCustomExpenseRequest) {
	return api<{ expense_id: string }>('/v1/expenses/custom', { method: 'POST', body }, true);
}

export function createItemizedExpense(body: CreateItemizedExpenseRequest) {
	return api<{ expense_id: string }>('/v1/expenses/itemized', { method: 'POST', body }, true);
}

export function getGroupExpenses(groupId: string, page = 1, limit = 20): Promise<ApiResult<ExpenseList>> {
	return apiWithMeta<ExpenseList>(`/v1/groups/${groupId}/expenses?page=${page}&limit=${limit}`, {}, true);
}

export function getExpense(expenseId: string) {
	return api<ExpenseDetail>(`/v1/expenses/${expenseId}`, {}, true);
}

export function updateExpense(expenseId: string, body: UpdateExpenseRequest) {
	return api<null>(`/v1/expenses/${expenseId}`, { method: 'PATCH', body }, true);
}

export function deleteExpense(expenseId: string) {
	return api<null>(`/v1/expenses/${expenseId}`, { method: 'DELETE' }, true);
}
