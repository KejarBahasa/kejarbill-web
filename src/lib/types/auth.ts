import type { ApiResponse } from './index';

export interface LoginRequest {
	identifier: string;
	password: string;
}

export interface LoginResponse {
	access_token: string;
	refresh_token?: string;
}

export interface RefreshTokenResponse {
	access_token: string;
}

export interface UsernameAvailabilityResponse {
	is_available: boolean;
}

export interface RegisterRequest {
	name: string;
	username: string;
	email: string;
	password: string;
}
