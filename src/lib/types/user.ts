export interface User {
	id: string;
	name: string;
	username: string;
	email: string;
	status: string;
	created_at: string;
	updated_at: string;
}

/** Hasil GET /v1/users/search — field publik saja (tanpa email). */
export interface PublicUser {
	id: string;
	name: string;
	username: string;
}

export interface UserSearchResult {
	users: PublicUser[];
}
