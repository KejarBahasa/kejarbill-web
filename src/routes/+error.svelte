<script lang="ts">
	import { page } from '$app/state';
	import Brand from '$lib/components/Brand.svelte';

	const message = $derived(
		page.status === 404 ? 'Halaman tidak ditemukan.' : (page.error?.message ?? 'Terjadi kesalahan.')
	);
</script>

<svelte:head>
	<title>{page.status} — KejarBill</title>
</svelte:head>

<div class="wrap">
	<div class="card">
		<Brand size={44} tagline="KEJARBILL" />
		<h1>{page.status}</h1>
		<p>{message}</p>
		<div class="actions">
			<a class="btn btn-primary" href="/dashboard">Dashboard</a>
			<a class="btn btn-ghost" href="/login">Masuk Ulang</a>
		</div>
	</div>
</div>

<style>
	.wrap {
		min-height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
	}

	.card {
		max-width: 420px;
		width: 100%;
		background: var(--surface);
		border: 4px solid #000;
		border-radius: var(--radius);
		box-shadow: var(--shadow-lg);
		padding: 36px;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 16px;
	}

	h1 {
		font-family: var(--font-head);
		font-size: 40px;
		text-shadow: 4px 4px 0 var(--accent);
	}

	p {
		color: var(--text-2);
		font-weight: 600;
	}

	.actions {
		display: flex;
		gap: 12px;
		width: 100%;
	}
</style>
