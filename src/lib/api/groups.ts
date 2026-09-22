import { api } from './client';
import type {
	AddGuestsRequest,
	AddMembersBulkRequest,
	AddMembersRequest,
	ActivityList,
	Balance,
	CreateGroupRequest,
	GroupDetail,
	GroupList,
	GroupSummary,
	MyDebtsResponse,
	ParticipantList
} from '../types/group';

export function getGroups() {
	return api<GroupList>('/v1/groups', {}, true);
}

export function createGroup(body: CreateGroupRequest) {
	return api<{ group_id: string }>('/v1/groups', { method: 'POST', body }, true);
}

export function getGroup(groupId: string) {
	return api<GroupDetail>(`/v1/groups/${groupId}`, {}, true);
}

export function getGroupSummary(groupId: string) {
	return api<GroupSummary>(`/v1/groups/${groupId}/summary`, {}, true);
}

export function getMyDebts(groupId: string) {
	return api<MyDebtsResponse>(`/v1/groups/${groupId}/my-debts`, {}, true);
}

export function getGroupActivities(groupId: string) {
	return api<ActivityList>(`/v1/groups/${groupId}/activities`, {}, true);
}

export function addMember(groupId: string, body: AddMembersRequest) {
	return api<null>(`/v1/groups/${groupId}/members`, { method: 'POST', body }, true);
}

export function addMembersBulk(groupId: string, body: AddMembersBulkRequest) {
	return api<null>(`/v1/groups/${groupId}/members/bulk`, { method: 'POST', body }, true);
}

export function getGroupParticipants(groupId: string) {
	return api<ParticipantList>(`/v1/groups/${groupId}/participants`, {}, true);
}

export function addGuests(groupId: string, body: AddGuestsRequest) {
	return api<null>(`/v1/groups/${groupId}/participants/guests`, { method: 'POST', body }, true);
}

export function claimGuest(groupId: string, participantId: string, body: { user_id: string }) {
	return api<null>(`/v1/groups/${groupId}/participants/${participantId}/claim`, { method: 'PATCH', body }, true);
}

export function getGroupBalances(groupId: string) {
	return api<Balance[]>(`/v1/groups/${groupId}/balances`, {}, true);
}
