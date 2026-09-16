import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/stores/auth.svelte';

export function load() {
	if (auth.isAuthenticated) {
		throw redirect(307, '/dashboard');
	}
	throw redirect(307, '/login');
}
