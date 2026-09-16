import type { ApiResponse } from './index';

export interface Participant {
	id: string;
	user_id: string | null;
	participant_type: 'member' | 'guest';
	display_name: string;
}

export interface CreateGroupRequest {
	name: string;
	description?: string;
}

export interface GroupDetail extends CreateGroupRequest {
	id: string;
	created_at: string;
	total_members: number;
	total_participants: number;
	total_expenses: number;
}

export type ActivityType = 'expense' | 'settlement';

export interface GroupActivity {
	type: ActivityType;
	created_at: string;
	expense?: GroupActivityExpense;
	settlement?: GroupActivitySettlement;
}

export interface GroupActivityExpense {
	id: string;
	title: string;
	payer_display_name: string;
	total_amount: number;
}

export interface GroupActivitySettlement {
	id: string;
	from_display_name: string;
	to_display_name: string;
	amount: number;
}

export interface Balance {
	from_participant: {
		id: string;
		display_name: string;
	};
	to_participant: {
		id: string;
		display_name: string;
	};
	amount: number;
}

export interface AddMembersRequest {
	user_id: string;
}

export interface AddMembersBulkRequest {
	user_ids: string[];
}

export interface AddGuestsRequest {
	guests: Array<{ display_name: string }>;
}

export interface GroupList {
	groups: GroupDetail[];
}

export interface ParticipantList {
	participants: Participant[];
}

export type ApiGroupDetail = ApiResponse<GroupDetail>;
export type ApiGroupActivities = ApiResponse<GroupActivity[]>;
export type ApiGroupBalances = ApiResponse<Balance[]>;
