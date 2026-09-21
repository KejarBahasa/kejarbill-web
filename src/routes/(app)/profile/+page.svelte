<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { getMe } from '$lib/api/users';
	import { ApiError } from '$lib/types';

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
				error = err instanceof ApiError ? err.message : 'Gagal memuat profil.';
			} finally {
				loading = false;
			}
		})();
	});
</script>

<svelte:head>
	<title>Profil — KejarBill</title>
</svelte:head>

<div class="page-head">
	<h1>Profil</h1>
	<p>Informasi akun kamu.</p>
</div>

{#if loading}
	<div class="status"><span class="spinner"></span> Memuat…</div>
{:else if error}
	<div class="alert alert-error" role="alert">
		<span class="alert-icon"><Icon name="alert" size={17} /></span>
		<span>{error}</span>
	</div>
{:else if user}
	<div class="card">
		<dl class="rows">
			<div class="row">
				<dt>Nama</dt>
				<dd>{user.name}</dd>
			</div>
			<div class="row">
				<dt>Username</dt>
				<dd>{user.username}</dd>
			</div>
			<div class="row">
				<dt>Email</dt>
				<dd>{user.email}</dd>
			</div>
		</dl>
	</div>
{/if}

<style>
	.page-head h1 {
		font-size: 28px;
		letter-spacing: -0.02em;
		margin-bottom: 4px;
	}

	.page-head p {
		color: var(--muted);
		margin-bottom: 20px;
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

	.card {
		max-width: 560px;
		padding: 24px;
		background: var(--surface);
		border: 3px solid #000;
		box-shadow: var(--shadow);
		border-radius: var(--radius);
	}

	.rows {
		margin: 0;
	}

	.row {
		display: flex;
		justify-content: space-between;
		gap: 16px;
		padding: 13px 0;
		border-bottom: 2px solid #000;
	}

	.row:last-child {
		border-bottom: none;
	}

	.row dt {
		color: var(--muted);
		font-size: 14px;
	}

	.row dd {
		margin: 0;
		font-weight: 600;
		color: var(--text);
	}
</style>
