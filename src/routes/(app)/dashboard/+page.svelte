<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { getMe } from '$lib/api/users';
import { mapApiError } from '$lib/utils/errors';

	let user = $state<{ name: string; username: string; email: string } | null>(null);
	let loading = $state(true);
	let error = $state('');

	$effect(() => {
		(async () => {
			loading = true;
			error = '';
			try {
				user = await getMe();
			} catch (err) {
				user = null;
				error = mapApiError(err, 'Gagal memuat profil.');
			} finally {
				loading = false;
			}
		})();
	});
</script>

<div class="page-head">
	<div>
		<h1>Dashboard</h1>
		<p>
			{#if user}
				Halo, {user.name} — kelola grup dan bagikan tagihan bareng temanmu.
			{:else}
				Kelola grup dan bagikan tagihan bareng temanmu.
			{/if}
		</p>
	</div>
	<a href="/groups/new" class="btn btn-primary btn-inline">
		<Icon name="plus" size={17} /> Buat Grup
	</a>
</div>

{#if loading}
	<div class="status"><span class="spinner"></span> Memuat…</div>
{:else if error}
	<div class="alert alert-error" role="alert">
		<span class="alert-icon"><Icon name="alert" size={17} /></span>
		<span>{error}</span>
	</div>
{:else if user}
	<div class="cards">
		<a class="card" href="/groups">
			<span class="card-icon"><Icon name="users" size={20} /></span>
			<div>
				<strong>Grup</strong>
				<p>Lihat semua grup dan kelola tagihan di dalamnya.</p>
			</div>
		</a>
		<a class="card" href="/payments">
			<span class="card-icon"><Icon name="credit_card" size={20} /></span>
			<div>
				<strong>Metode Pembayaran</strong>
				<p>Kelola bank, e-wallet, dan QRIS untuk settlement.</p>
			</div>
		</a>
	</div>
{/if}

<style>
	.page-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 24px;
	}

	.page-head h1 {
		font-size: 28px;
		letter-spacing: -0.02em;
	}

	.page-head p {
		color: var(--muted);
		margin-top: 4px;
	}

	.btn-inline {
		width: auto;
		white-space: nowrap;
	}

	.status {
		display: flex;
		align-items: center;
		gap: 10px;
		color: var(--muted);
		font-size: 14px;
	}

	.alert-icon {
		flex-shrink: 0;
		display: inline-flex;
		margin-top: 1px;
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 16px;
	}

	.card {
		display: flex;
		align-items: flex-start;
		gap: 14px;
		padding: 20px;
		background: var(--surface);
		border: 3px solid #000;
		box-shadow: var(--shadow);
		border-radius: var(--radius);
		color: var(--text);
		text-decoration: none;
		transition: border-color 0.15s ease, transform 0.05s ease;
	}

	.card:hover {
		border-color: #000;
		text-decoration: none;
		transform: translateY(-1px);
	}

	.card-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		flex-shrink: 0;
		border-radius: 12px;
		background: var(--accent-soft);
		border: 1px solid rgba(110, 99, 255, 0.35);
		color: var(--accent-hi);
	}

	.card strong {
		display: block;
		font-size: 15px;
		margin-bottom: 4px;
	}

	.card p {
		color: var(--muted);
		font-size: 13.5px;
		line-height: 1.5;
	}
</style>
