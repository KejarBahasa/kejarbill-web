import { api } from './client';
import type { User, UserSearchResult } from '../types/user';

export function getMe() {
	return api<User>('/v1/users/me', {}, true);
}

export function searchUsers(q: string) {
	return api<UserSearchResult>(`/v1/users/search?q=${encodeURIComponent(q)}`, {}, true);
}
