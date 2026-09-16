<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import Brand from '$lib/components/Brand.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { logout } from '$lib/api/auth';
	import { toast } from '$lib/stores/toast.svelte';

	let { children } = $props();

	$effect(() => {
		if (!auth.isAuthenticated) {
			goto('/login');
		}
	});

	async function handleLogout() {
		try {
			await logout();
		} catch {
			/* tetap bersihkan sesi lokal walau panggilan logout gagal */
		} finally {
			auth.clear();
			goto('/login');
		}
	}
</script>

<svelte:head>
	<title>KejarBill</title>
</svelte:head>

<div class="shell">
	<aside class="sidebar">
		<Brand size={34} />

		<nav class="nav">
			<a href="/dashboard" class="nav-item" >
				<Icon name="home" size={18} /> Dashboard
			</a>
			<a href="/groups" class="nav-item">
				<Icon name="users" size={18} /> Grup
			</a>
			<a href="/payments" class="nav-item">
				<Icon name="wallet" size={18} /> Metode Bayar
			</a>
			<a href="/profile" class="nav-item">
				<Icon name="user" size={18} /> Profil
			</a>
		</nav>

		<button class="btn-logout" onclick={handleLogout}>
			<Icon name="log-out" size={17} /> Keluar
		</button>
	</aside>

	<main class="content">
		{@render children()}
	</main>
</div>

<div class="toasts" aria-live="polite">
	{#each toast.items as t (t.id)}
		<div class="toast" class:error={t.type === 'error'} role="status">
			<Icon name={t.type === 'error' ? 'alert' : 'check-circle'} size={16} />
			<span>{t.message}</span>
			<button class="toast-close" aria-label="Tutup" onclick={() => toast.dismiss(t.id)}>
				<Icon name="x" size={14} />
			</button>
		</div>
	{/each}
</div>

<style>
	.shell {
		display: flex;
		min-height: 100dvh;
	}

	.sidebar {
		display: flex;
		flex-direction: column;
		gap: 24px;
		width: 240px;
		flex-shrink: 0;
		padding: 20px 16px;
		border-right: 4px solid #000;
		background: var(--surface);
		position: sticky;
		top: 0;
		height: 100dvh;
	}

	.nav {
		display: flex;
		flex-direction: column;
		gap: 8px;
		flex: 1;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 12px;
		border: 2px solid transparent;
		border-radius: var(--radius-sm);
		color: var(--text);
		font-size: 14px;
		font-weight: 700;
		text-decoration: none;
		transition: background 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease;
	}

	.nav-item:hover {
		background: var(--accent-soft);
		border-color: #000;
		text-decoration: none;
	}

	.nav-item:active {
		box-shadow: inset 2px 2px 0 rgba(0, 0, 0, 0.15);
	}

	.btn-logout {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 10px 12px;
		background: var(--surface);
		border: 3px solid #000;
		border-radius: var(--radius-sm);
		color: var(--text);
		font-size: 14px;
		font-weight: 700;
		cursor: pointer;
		box-shadow: var(--shadow-btn);
		transition: transform 0.12s ease, box-shadow 0.12s ease, background 0.12s ease;
	}

	.btn-logout:hover {
		background: var(--danger-soft);
	}

	.btn-logout:active {
		transform: translateY(2px);
		box-shadow: none;
	}

	.content {
		flex: 1;
		padding: 28px clamp(20px, 4vw, 48px);
		min-width: 0;
	}

	.toasts {
		position: fixed;
		right: 20px;
		bottom: 20px;
		display: flex;
		flex-direction: column;
		gap: 10px;
		z-index: 50;
		max-width: min(340px, calc(100vw - 40px));
	}

	.toast {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 14px;
		background: var(--surface);
		border: 3px solid #000;
		border-radius: var(--radius-sm);
		box-shadow: 5px 5px 0 0 #000;
		font-size: 14px;
		font-weight: 700;
		color: var(--text);
	}

	.toast.error {
		background: var(--danger-soft);
	}

	.toast-close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin-left: auto;
		padding: 4px;
		background: transparent;
		border: none;
		color: inherit;
		cursor: pointer;
	}

	@media (max-width: 720px) {
		.shell {
			flex-direction: column;
		}

		.sidebar {
			width: 100%;
			height: auto;
			position: static;
		}

		.btn-logout {
			display: none;
		}
	}
</style>
