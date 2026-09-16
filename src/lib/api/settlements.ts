import { api } from './client';
import type { CreateSettlementRequest, SettlementDetail, SettlementSummary } from '../types/settlement';

export function createSettlement(groupId: string, body: CreateSettlementRequest) {
	return api<{ id: string }>(`/v1/groups/${groupId}/settlements`, { method: 'POST', body }, true);
}

export function getGroupSettlements(groupId: string) {
	return api<SettlementSummary[]>(`/v1/groups/${groupId}/settlements`, {}, true);
}

export function getSettlement(settlementId: string) {
	return api<SettlementDetail>(`/v1/settlement/${settlementId}`, {}, true);
}
