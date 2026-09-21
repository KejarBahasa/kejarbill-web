<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { getPaymentMethods, setDefaultPaymentMethod, hidePaymentMethod, unhidePaymentMethod } from '$lib/api/paymentMethods';
	import { ApiError } from '$lib/types';
	import { toast } from '$lib/stores/toast.svelte';
	import type { PaymentMethodSummary } from '$lib/types/paymentMethod';

	let methods = $state<PaymentMethodSummary[]>([]);
	let loading = $state(true);
	let error = $state('');

	async function load() {
		loading = true;
		error = '';
		try {
			const data = await getPaymentMethods();
			methods = data.payment_methods;
		} catch (err) {
			methods = [];
			error = err instanceof ApiError ? err.message : 'Gagal memuat metode pembayaran.';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		void load();
	});

	async function toggleDefault(m: PaymentMethodSummary) {
		try {
			await setDefaultPaymentMethod(m.id);
			methods = methods.map((x) => ({ ...x, is_default: x.id === m.id }));
			toast.success('Metode default diperbarui.');
		} catch (err) {
			error = err instanceof ApiError ? err.message : 'Terjadi kesalahan.';
		}
	}

	async function toggleHidden(m: PaymentMethodSummary) {
		try {
			await (m.is_hidden ? unhidePaymentMethod(m.id) : hidePaymentMethod(m.id));
			await load();
			toast.success(m.is_hidden ? 'Metode ditampilkan.' : 'Metode disembunyikan.');
		} catch (err) {
			error = err instanceof ApiError ? err.message : 'Terjadi kesalahan.';
		}
	}

	const typeLabel: Record<string, string> = { bank: 'Bank', ewallet: 'E-Wallet', qris: 'QRIS' };
</script>

<svelte:head>
	<title>Metode Bayar — KejarBill</title>
</svelte:head>

<div class="page-head">
	<div>
		<h1>Metode Pembayaran</h1>
		<p>Bank, e-wallet, dan QRIS untuk settlement antar peserta.</p>
	</div>
	<a href="/payments/new" class="btn btn-primary btn-inline">
		<Icon name="plus" size={17} /> Tambah
	</a>
</div>

{#if error}
	<div class="alert alert-error" role="alert">
		<span class="alert-icon"><Icon name="alert" size={17} /></span>
		<span>{error}</span>
	</div>
{/if}

{#if loading}
	<div class="status"><span class="spinner"></span> Memuat…</div>
{:else if methods.length === 0}
	<div class="empty">
		<span class="empty-mark"><Icon name="credit_card" size={22} /></span>
		<p>Belum ada metode pembayaran. Tambahkan yang pertama untuk memudahkan settlement.</p>
		<a href="/payments/new" class="btn btn-ghost btn-inline">Tambah Metode</a>
	</div>
{:else}
	<ul class="list">
		{#each methods as m (m.id)}
			<li class="pm" class:hidden={m.is_hidden}>
				<span class="pm-icon"><Icon name={m.method_type === 'qris' ? 'bank' : m.method_type === 'ewallet' ? 'wallet' : 'bank'} size={18} /></span>
				<div class="pm-body">
					<div class="pm-head">
						<strong>{m.provider_name}</strong>
						{#if m.is_default}
							<span class="badge">Default</span>
						{/if}
						{#if m.is_hidden}
							<span class="badge hidden-badge">Tersembunyi</span>
						{/if}
					</div>
					<span class="pm-type">{typeLabel[m.method_type] ?? m.method_type}</span>
					{#if m.account_name}
						<span class="pm-meta">{m.account_name}</span>
					{/if}
					{#if m.masked_account_number}
						<span class="pm-meta">{m.masked_account_number}</span>
					{/if}
				</div>
				<div class="pm-actions">
					<button class="btn-mini" onclick={() => toggleDefault(m)} aria-label="Jadikan default">
						<Icon name="check-circle" size={16} />
					</button>
					<button class="btn-mini" onclick={() => toggleHidden(m)} aria-label={m.is_hidden ? 'Tampilkan' : 'Sembunyikan'}>
						<Icon name={m.is_hidden ? 'eye' : 'eye-off'} size={16} />
					</button>
				</div>
			</li>
		{/each}
	</ul>
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

	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
		max-width: 640px;
	}

	.pm {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 16px 18px;
		background: var(--surface);
		border: 3px solid #000;
		box-shadow: var(--shadow);
		border-radius: var(--radius);
	}

	.pm-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 42px;
		height: 42px;
		flex-shrink: 0;
		border-radius: 12px;
		background: var(--accent-soft);
		border: 1px solid rgba(110, 99, 255, 0.35);
		color: var(--accent-hi);
	}

	.pm-body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.pm-head {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.pm-head strong {
		font-size: 15px;
	}

	.pm-type,
	.pm-meta {
		font-size: 13px;
		color: var(--muted);
	}

	.pm-actions {
		display: flex;
		gap: 6px;
	}

	.btn-mini {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 8px;
		background: var(--surface-2);
		border: 3px solid #000;
		border-radius: 8px;
		color: var(--text-2);
		cursor: pointer;
		transition: border-color 0.15s ease, color 0.15s ease;
	}

	.btn-mini:hover {
		border-color: #000;
		color: var(--text);
	}

	.badge {
		font-size: 11px;
		font-weight: 700;
		padding: 2px 8px;
		border-radius: 999px;
		background: rgba(52, 211, 153, 0.12);
		border: 1px solid rgba(52, 211, 153, 0.4);
		color: var(--success);
	}

	.hidden-badge {
		background: var(--surface-2);
		border-color: var(--border-strong, #999);
		color: var(--muted);
	}

	.pm.hidden {
		opacity: 0.55;
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 10px;
		max-width: 380px;
		padding: 48px 20px;
		margin: 0 auto;
		color: var(--muted);
	}

	.empty-mark {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 52px;
		height: 52px;
		border-radius: 16px;
		background: var(--accent-soft);
		color: var(--accent-hi);
		margin-bottom: 4px;
	}

	.btn-ghost {
		width: auto;
		background: var(--surface-2);
		border: 3px solid #000;
		color: var(--text);
	}
</style>
