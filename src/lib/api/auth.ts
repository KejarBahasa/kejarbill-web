import { api } from './client';
import type {
	LoginRequest,
	LoginResponse,
	RefreshTokenResponse,
	RegisterRequest,
	UsernameAvailabilityResponse
} from '../types/auth';

export function login(body: LoginRequest) {
	return api<LoginResponse>('/v1/auth/login', { method: 'POST', body });
}

export function logout() {
	return api<null>('/v1/auth/logout', { method: 'POST', body: {} });
}

export function refreshToken(body: { refresh_token?: string; access_token?: string }) {
	return api<RefreshTokenResponse>('/v1/auth/refresh-token', { method: 'POST', body });
}

export function register(body: RegisterRequest) {
	return api<null>('/v1/auth/register', { method: 'POST', body });
}

export function checkUsername(username: string) {
	return api<UsernameAvailabilityResponse>('/v1/auth/check-username-availability', {
		method: 'POST',
		body: { username }
	});
}
