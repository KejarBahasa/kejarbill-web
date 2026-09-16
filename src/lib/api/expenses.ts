import { api } from './client';
import type {
	CreateCustomExpenseRequest,
	CreateEqualExpenseRequest,
	CreateItemizedExpenseRequest,
	ExpenseDetail,
	ExpenseSummary
} from '../types/expense';

export function createEqualExpense(body: CreateEqualExpenseRequest) {
	return api<{ id: string }>('/v1/expenses/equal', { method: 'POST', body }, true);
}

export function createCustomExpense(body: CreateCustomExpenseRequest) {
	return api<{ id: string }>('/v1/expenses/custom', { method: 'POST', body }, true);
}

export function createItemizedExpense(body: CreateItemizedExpenseRequest) {
	return api<{ id: string }>('/v1/expenses/itemized', { method: 'POST', body }, true);
}

export function getGroupExpenses(groupId: string) {
	return api<ExpenseSummary[]>(`/v1/groups/${groupId}/expenses`, {}, true);
}

export function getExpense(expenseId: string) {
	return api<ExpenseDetail>(`/v1/expenses/${expenseId}`, {}, true);
}

export function deleteExpense(expenseId: string) {
	return api<null>(`/v1/expenses/${expenseId}`, { method: 'DELETE' }, true);
}
