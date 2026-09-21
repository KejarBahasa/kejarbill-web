import { api, apiWithMeta, type ApiResult } from './client';
import type { CreateSettlementRequest, SettlementDetail, SettlementList } from '../types/settlement';

export function createSettlement(groupId: string, body: CreateSettlementRequest, idempotencyKey: string) {
	return api<{ id: string }>(
		`/v1/groups/${groupId}/settlements`,
		{ method: 'POST', body, headers: { 'Idempotency-Key': idempotencyKey } },
		true
	);
}

export function getGroupSettlements(groupId: string, page = 1, limit = 20): Promise<ApiResult<SettlementList>> {
	return apiWithMeta<SettlementList>(`/v1/groups/${groupId}/settlements?page=${page}&limit=${limit}`, {}, true);
}

export function getSettlement(settlementId: string) {
	return api<SettlementDetail>(`/v1/settlement/${settlementId}`, {}, true);
}
