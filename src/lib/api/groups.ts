import { api } from './client';
import type {
	AddGuestsRequest,
	AddMembersBulkRequest,
	AddMembersRequest,
	Balance,
	CreateGroupRequest,
	GroupActivity,
	GroupDetail,
	GroupList,
	ParticipantList
} from '../types/group';

export function getGroups() {
	return api<GroupList>('/v1/groups', {}, true);
}

export function createGroup(body: CreateGroupRequest) {
	return api<{ id: string }>('/v1/groups', { method: 'POST', body }, true);
}

export function getGroup(groupId: string) {
	return api<GroupDetail>(`/v1/groups/${groupId}`, {}, true);
}

export function getGroupActivities(groupId: string) {
	return api<GroupActivity[]>(`/v1/groups/${groupId}/activities`, {}, true);
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

export function getGroupBalances(groupId: string) {
	return api<Balance[]>(`/v1/groups/${groupId}/balances`, {}, true);
}
