<script lang="ts">
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import { getSettlement } from '$lib/api/settlements';
	import { ApiError } from '$lib/types';
	import type { SettlementDetail } from '$lib/types/settlement';

	const settlementId = String(page.params.settlementId);

	let settlement = $state<SettlementDetail | null>(null);
	let loading = $state(true);
	let error = $state('');

	$effect(() => {
		(async () => {
			loading = true;
			error = '';
			try {
				settlement = await getSettlement(settlementId);
			} catch (err) {
				settlement = null;
				error = err instanceof ApiError ? err.message : 'Gagal memuat settlement.';
			} finally {
				loading = false;
			}
		})();
	});

	function formatIDR(n: number) {
		return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
	}

	const channelLabel: Record<string, string> = {
		cash: 'Tunai',
		bank_transfer: 'Transfer Bank',
		ewallet: 'E-Wallet'
	};
</script>

<svelte:head>
	<title>Settlement — KejarBill</title>
</svelte:head>

<a href={`/groups/${page.params.id}/settlements`} class="back"><Icon name="chevron-right" size={16} /> Kembali</a>

{#if loading}
	<div class="status"><span class="spinner"></span> Memuat…</div>
{:else if error}
	<div class="alert alert-error" role="alert"><span>{error}</span></div>
{:else if settlement}
	<div class="head">
		<h1>Detail Settlement</h1>
		<span class="badge" class:pending={settlement.status === 'pending'}>
			{settlement.status === 'settled' ? 'LUNAS' : 'PENDING'}
		</span>
	</div>

	<div class="block">
		<div class="flow">
			<div class="party">
				<span class="party-label">DARI</span>
				<strong>{settlement.from_participant.display_name}</strong>
			</div>
			<Icon name="arrow-right" size={20} />
			<div class="party to">
				<span class="party-label">KE</span>
				<strong>{settlement.to_participant.display_name}</strong>
			</div>
			<strong class="amount">{formatIDR(settlement.amount)}</strong>
		</div>

		<dl class="rows">
			<div class="row">
				<dt>Saluran</dt>
				<dd>{channelLabel[settlement.payment_channel] ?? settlement.payment_channel}</dd>
			</div>
			<div class="row">
				<dt>Tanggal bayar</dt>
				<dd>{new Date(settlement.paid_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}</dd>
			</div>
			{#if settlement.payment_method}
				<div class="row">
					<dt>Metode</dt>
					<dd>{settlement.payment_method.provider_name}</dd>
				</div>
			{/if}
			{#if settlement.notes}
				<div class="row">
					<dt>Catatan</dt>
					<dd>{settlement.notes}</dd>
				</div>
			{/if}
		</dl>
	</div>
{/if}

<style>
	.back {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 14px;
		font-weight: 700;
		margin-bottom: 16px;
	}

	.back :global(svg) {
		transform: rotate(180deg);
	}

	.status {
		display: flex;
		align-items: center;
		gap: 10px;
		color: var(--muted);
		font-size: 14px;
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 14px;
	}

	.head h1 {
		font-family: var(--font-head);
		font-size: 16px;
	}

	.badge {
		font-family: var(--font-head);
		font-size: 11px;
		padding: 6px 10px;
		border: 3px solid #000;
		border-radius: var(--radius-sm);
		background: var(--success);
		box-shadow: 3px 3px 0 0 #000;
	}

	.badge.pending {
		background: var(--accent);
	}

	.block {
		max-width: 560px;
		background: var(--surface);
		border: 3px solid #000;
		box-shadow: var(--shadow);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		padding: 20px;
	}

	.flow {
		display: flex;
		align-items: center;
		gap: 14px;
		padding-bottom: 18px;
		border-bottom: 3px solid #000;
		margin-bottom: 4px;
	}

	.party {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.party.to {
		text-align: right;
	}

	.party-label {
		font-size: 11px;
		font-weight: 700;
		color: var(--muted);
		letter-spacing: 0.06em;
	}

	.amount {
		margin-left: auto;
		font-family: var(--font-head);
		font-size: 13px;
		background: var(--accent);
		border: 3px solid #000;
		border-radius: var(--radius-sm);
		padding: 6px 10px;
	}

	.rows {
		margin: 0;
	}

	.row {
		display: flex;
		justify-content: space-between;
		gap: 16px;
		padding: 12px 0;
		border-bottom: 2px solid var(--surface-2);
	}

	.row:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.row dt {
		color: var(--muted);
		font-size: 14px;
	}

	.row dd {
		margin: 0;
		font-weight: 700;
		font-size: 14px;
		text-align: right;
	}
</style>
