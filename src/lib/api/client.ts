import { auth } from '../stores/auth.svelte';
import { ApiError } from '../types';
import type { Meta } from '../types';

export const API_BASE_URL: string =
	import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

type ApiOptions = Omit<RequestInit, 'body'> & { body?: unknown };

// ponytail: single in-flight refresh; upgrade path = queue antrian request saat refresh berjalan
let inflightRefresh: Promise<string | null> | null = null;

function refreshOnce(): Promise<string | null> {
	inflightRefresh ??= refreshAccessToken().finally(() => (inflightRefresh = null));
	return inflightRefresh;
}

async function refreshAccessToken(): Promise<string | null> {
	try {
		const res = await fetch(`${API_BASE_URL}/v1/auth/refresh-token`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: '{}',
			credentials: 'include'
		});
		if (!res.ok) return null;
		const payload = (await res.json()) as { data?: { access_token?: string } };
		const token = payload?.data?.access_token;
		if (!token) return null;
		auth.setToken(token);
		return token;
	} catch {
		return null;
	}
}

export interface ApiResult<T> {
	data: T;
	meta?: Meta;
}

export async function apiRaw<T>(
	path: string,
	options: ApiOptions = {},
	authenticated = false
): Promise<ApiResult<T>> {
	const { body, ...rest } = options;

	const doFetch = (token: string | null) => {
		const headers = new Headers(rest.headers);
		if (body !== undefined && !headers.has('Content-Type')) {
			headers.set('Content-Type', 'application/json');
		}
		if (authenticated && token) {
			headers.set('Authorization', `Bearer ${token}`);
		}
		return fetch(`${API_BASE_URL}${path}`, {
			...rest,
			headers,
			body: body !== undefined ? JSON.stringify(body) : undefined,
			credentials: 'include'
		});
	};

	let response: Response;
	try {
		response = await doFetch(auth.token);
	} catch (err) {
		throw new ApiError(0, 'Tidak dapat terhubung ke server. Cek koneksimu lalu coba lagi.', err);
	}

	if (response.status === 401 && authenticated) {
		const token = await refreshOnce();
		if (!token) {
			auth.clear();
		} else {
			try {
				response = await doFetch(token);
			} catch (err) {
				throw new ApiError(0, 'Tidak dapat terhubung ke server.', err);
			}
		}
	}

	let payload:
		| { status?: string; message?: string; data?: T; errors?: unknown; meta?: Meta }
		| undefined;
	try {
		payload = (await response.json()) as typeof payload;
	} catch {
		/* non-JSON body */
	}

	if (!response.ok) {
		throw new ApiError(
			response.status,
			payload?.message ?? 'Terjadi kesalahan pada server.',
			payload?.errors
		);
	}

	if (payload === undefined || payload.data === undefined) {
		throw new ApiError(response.status, 'Respons server tidak valid.');
	}

	return { data: payload.data, meta: payload.meta };
}

export const apiWithMeta = apiRaw;

export async function api<T>(
	path: string,
	options: ApiOptions = {},
	authenticated = false
): Promise<T> {
	return (await apiRaw<T>(path, options, authenticated)).data;
}
