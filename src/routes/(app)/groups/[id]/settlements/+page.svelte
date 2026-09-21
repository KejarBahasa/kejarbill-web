<script lang="ts">
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import { getGroupParticipants } from '$lib/api/groups';
	import { getGroupSettlements, createSettlement } from '$lib/api/settlements';
	import { ApiError } from '$lib/types';
	import { toast } from '$lib/stores/toast.svelte';
	import type { Participant } from '$lib/types/group';
	import type { SettlementSummary, PaymentChannel } from '$lib/types/settlement';

	const id = String(page.params.id);

	let settlements = $state<SettlementSummary[]>([]);
	let participants = $state<Participant[]>([]);
	let loading = $state(true);
	let error = $state('');

	let from_participant_id = $state('');
	let to_participant_id = $state('');
	let payment_channel = $state<PaymentChannel>('bank_transfer');
	let amount = $state(0);
	let notes = $state('');
	let paid_at = $state(new Date().toISOString().slice(0, 10));
	let submitting = $state(false);

	async function load() {
		loading = true;
		error = '';
		try {
			const [s, p] = await Promise.all([getGroupSettlements(id), getGroupParticipants(id)]);
			settlements = s.settlements;
			participants = p.participants;
			if (participants.length >= 2) {
				from_participant_id = participants[0].id;
				to_participant_id = participants[1].id;
			}
		} catch (err) {
			settlements = [];
			participants = [];
			error = err instanceof ApiError ? err.message : 'Gagal memuat data settlement.';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		void load();
	});

	function formatIDR(n: number) {
		return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
	}

	async function handleSubmit() {
		error = '';
		if (!from_participant_id || !to_participant_id) return (error = 'Pilih pengirim dan penerima.');
		if (from_participant_id === to_participant_id) return (error = 'Pengirim dan penerima tidak boleh sama.');
		if (!amount || amount <= 0) return (error = 'Jumlah wajib lebih dari 0.');
		submitting = true;
		try {
			await createSettlement(id, {
				from_participant_id,
				to_participant_id,
				payment_channel,
				notes: notes.trim() || undefined,
				paid_at: new Date(paid_at + 'T00:00:00Z').toISOString(),
				amount
			});
			toast.success('Settlement berhasil dicatat.');
			await load();
		} catch (err) {
			error = err instanceof ApiError ? err.message : 'Gagal mencatat settlement.';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Settlement — KejarBill</title>
</svelte:head>

<div class="cols">
	<section class="block">
		<h2 class="block-title">Riwayat Settlement</h2>
		{#if loading}
			<div class="status"><span class="spinner"></span> Memuat…</div>
		{:else if settlements.length === 0}
			<p class="muted">Belum ada settlement.</p>
		{:else}
			<ul class="list">
				{#each settlements as s (s.id)}
					<li>
						<a class="row" href={`/groups/${id}/settlements/${s.id}`}>
							<span class="s-icon"><Icon name="arrow-right" size={16} /></span>
							<span class="s-body">
								<strong>{s.from_participant.display_name} → {s.to_participant.display_name}</strong>
								<span class="s-sub">{new Date(s.settlement_date).toLocaleDateString('id-ID')}</span>
							</span>
							<strong class="s-amount">{formatIDR(s.amount)}</strong>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="block">
		<h2 class="block-title">Catat Settlement</h2>
		{#if error}
			<div class="alert alert-error" role="alert">
				<span class="alert-icon"><Icon name="alert" size={17} /></span>
				<span>{error}</span>
			</div>
		{/if}
		<form class="form" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
			<label class="field">
				<span class="field-label">Dibayar oleh</span>
				<select class="input" bind:value={from_participant_id}>
					{#each participants as p (p.id)}
						<option value={p.id}>{p.display_name}</option>
					{/each}
				</select>
			</label>

			<label class="field">
				<span class="field-label">Dibayar kepada</span>
				<select class="input" bind:value={to_participant_id}>
					{#each participants as p (p.id)}
						<option value={p.id}>{p.display_name}</option>
					{/each}
				</select>
			</label>

			<div class="grid2">
				<label class="field">
					<span class="field-label">Jumlah (IDR)</span>
					<input class="input" type="number" min="0" bind:value={amount} />
				</label>
				<label class="field">
					<span class="field-label">Tanggal</span>
					<input class="input" type="date" bind:value={paid_at} />
				</label>
			</div>

			<fieldset class="field-group">
				<span class="field-label">Saluran bayar</span>
				<div class="segmented">
					{#each ([['cash', 'Tunai'], ['bank_transfer', 'Transfer'], ['ewallet', 'E-Wallet']]) as [c, label] (c)}
						<button type="button" class:active={payment_channel === c} onclick={() => (payment_channel = c as PaymentChannel)}>{label}</button>
					{/each}
				</div>
			</fieldset>

			<label class="field">
				<span class="field-label">Catatan (opsional)</span>
				<input class="input" type="text" placeholder="cth: Transfer BCA" bind:value={notes} />
			</label>

			<button class="btn btn-primary" type="submit" disabled={submitting}>
				{#if submitting}
					<span class="spinner"></span> Menyimpan…
				{:else}
					Simpan <Icon name="arrow-right" size={17} />
				{/if}
			</button>
		</form>
	</section>
</div>

<style>
	.cols {
		display: grid;
		grid-template-columns: 1.2fr 1fr;
		gap: 20px;
		align-items: start;
	}

	.block {
		background: var(--surface);
		border: 3px solid #000;
		box-shadow: var(--shadow);
		border-radius: var(--radius);
		padding: 20px;
	}

	.block-title {
		font-size: 15px;
		font-weight: 700;
		margin-bottom: 16px;
	}

	.muted {
		color: var(--muted);
	}

	.alert-icon {
		flex-shrink: 0;
		display: inline-flex;
		margin-top: 1px;
	}

	.status {
		display: flex;
		align-items: center;
		gap: 10px;
		color: var(--muted);
		font-size: 14px;
	}

	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.list li {
		display: flex;
		align-items: center;
		gap: 12px;
		padding-bottom: 10px;
		border-bottom: 2px solid #000;
	}

	.list li:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		color: inherit;
		text-decoration: none;
	}

	.row:hover {
		text-decoration: none;
	}

	.s-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		flex-shrink: 0;
		border-radius: 9px;
		background: rgba(52, 211, 153, 0.12);
		color: var(--success);
	}

	.s-body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.s-body strong {
		font-size: 14px;
	}

	.s-sub {
		font-size: 13px;
		color: var(--muted);
	}

	.s-amount {
		font-size: 14px;
		white-space: nowrap;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.grid2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin: 0;
		padding: 0;
		border: none;
	}

	.field-label {
		font-size: 13.5px;
		font-weight: 600;
		color: var(--text-2);
	}

	.segmented {
		display: flex;
		gap: 6px;
		padding: 4px;
		background: var(--surface-2);
		border: 3px solid #000;
		border-radius: var(--radius-sm);
	}

	.segmented button {
		flex: 1;
		padding: 9px 8px;
		background: transparent;
		border: none;
		border-radius: 7px;
		color: var(--text-2);
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
	}

	.segmented button.active {
		background: var(--accent);
		color: #fff;
	}

	@media (max-width: 760px) {
		.cols {
			grid-template-columns: 1fr;
		}
	}
</style>
