<script lang="ts">
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import { getGroupParticipants } from '$lib/api/groups';
	import { createEqualExpense, createCustomExpense, createItemizedExpense } from '$lib/api/expenses';
	import { ApiError } from '$lib/types';
	import { toast } from '$lib/stores/toast.svelte';
	import type { Participant } from '$lib/types/group';
	import { goto } from '$app/navigation';

	const id = String(page.params.id);

	type Mode = 'equal' | 'custom' | 'itemized';

	let mode = $state<Mode>('equal');
	let title = $state('');
	let description = $state('');
	let total_amount = $state(0);
	let currency = 'IDR';
	let expense_date = $state(new Date().toISOString());
	let payer_participant_id = $state('');
	let participants = $state<Participant[]>([]);
	let selected = $state<Record<string, boolean>>({});
	let customShares = $state<Record<string, number>>({});
	let items = $state<Array<{ name: string; participant_id: string; qty: number; unit_price: number; notes: string }>>([
		{ name: '', participant_id: '', qty: 1, unit_price: 0, notes: '' }
	]);
	let loading = $state(true);
	let error = $state('');

	$effect(() => {
		(async () => {
			loading = true;
			error = '';
			try {
				participants = (await getGroupParticipants(id)).participants;
				if (participants.length > 0) {
					payer_participant_id = participants[0].id;
					selected[participants[0].id] = true;
				}
			} catch (err) {
				participants = [];
				error = err instanceof ApiError ? err.message : 'Gagal memuat peserta.';
			} finally {
				loading = false;
			}
		})();
	});

	function toggleParticipant(pid: string) {
		selected[pid] = !selected[pid];
	}

	function selectedIds() {
		return Object.entries(selected).filter(([, v]) => v).map(([pid]) => pid);
	}

	function addItem() {
		items = [...items, { name: '', participant_id: '', qty: 1, unit_price: 0, notes: '' }];
	}

	function removeItem(i: number) {
		items = items.filter((_, idx) => idx !== i);
	}

	function validateCommon(): string {
		if (title.trim().length < 1) return 'Judul expense wajib diisi.';
		if (title.trim().length > 150) return 'Judul maksimal 150 karakter.';
		if (!payer_participant_id) return 'Pilih pembayar (payer).';
		return '';
	}

	async function handleSubmit() {
		error = validateCommon();
		if (error) return;

		const date = expense_date;
		const common = {
			group_id: id,
			title: title.trim(),
			description: description.trim() || undefined,
			currency,
			expense_date: date,
			payer_participant_id
		};

		loading = true;
		try {
			if (mode === 'equal') {
				const ids = selectedIds();
				if (ids.length < 1) {
					error = 'Pilih minimal satu peserta.';
					loading = false;
					return;
				}
				await createEqualExpense({ ...common, participant_ids: ids, total_amount });
			} else if (mode === 'custom') {
				const shares = Object.entries(customShares)
					.filter(([pid]) => selected[pid])
					.map(([pid, share_amount]) => ({ participant_id: pid, share_amount: Number(share_amount) || 0 }));
				if (shares.length < 1) {
					error = 'Isi pembagian untuk peserta terpilih.';
					loading = false;
					return;
				}
				await createCustomExpense({ ...common, participants: shares });
			} else {
				if (items.some((it) => !it.name.trim() || !it.participant_id || it.qty <= 0 || it.unit_price <= 0)) {
					error = 'Lengkapi semua item (nama, peserta, qty, harga).';
					loading = false;
					return;
				}
				await createItemizedExpense({
					...common,
					items: items.map((it) => ({ name: it.name.trim(), participant_id: it.participant_id, qty: it.qty, unit_price: it.unit_price, notes: it.notes.trim() || undefined }))
				});
			}
			toast.success('Expense disimpan.');
			await goto(`/groups/${id}/expenses`);
		} catch (err) {
			error = err instanceof ApiError ? err.message : 'Gagal menyimpan expense.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Tambah Expense — KejarBill</title>
</svelte:head>

<a href={`/groups/${id}/expenses`} class="back"><Icon name="chevron-right" size={16} /> Kembali</a>

<h2 class="page-title">Tambah Expense</h2>

{#if loading}
	<div class="status"><span class="spinner"></span> Memuat…</div>
{:else}
	<form class="card" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
		{#if error}
			<div class="alert alert-error" role="alert">
				<span class="alert-icon"><Icon name="alert" size={17} /></span>
				<span>{error}</span>
			</div>
		{/if}

		<div class="segmented mode">
			{#each ([['equal', 'Bagi Rata'], ['custom', 'Custom'], ['itemized', 'Per Item']]) as [m, label] (m)}
				<button type="button" class:active={mode === m} onclick={() => (mode = m as Mode)}>{label}</button>
			{/each}
		</div>

		<label class="field">
			<span class="field-label">Judul</span>
			<input class="input" type="text" placeholder="cth: Makan malem bareng" bind:value={title} />
		</label>

		<label class="field">
			<span class="field-label">Deskripsi (opsional)</span>
			<input class="input" type="text" placeholder="cth: Nasi goreng & es teh" bind:value={description} />
		</label>

		<label class="field">
			<span class="field-label">Tanggal</span>
			<input class="input" type="date" bind:value={expense_date} />
		</label>

		<fieldset class="field-group">
			<span class="field-label">Dibayar oleh</span>
			<select class="input" bind:value={payer_participant_id}>
				{#each participants as p (p.id)}
					<option value={p.id}>{p.display_name}</option>
				{/each}
			</select>
		</fieldset>

		{#if mode === 'equal'}
			<label class="field">
				<span class="field-label">Total ({currency})</span>
				<input class="input" type="number" min="0" bind:value={total_amount} />
			</label>
			<fieldset class="field-group">
				<span class="field-label">Dibagi ke peserta</span>
				<div class="check-grid">
					{#each participants as p (p.id)}
						<label class="check">
							<input type="checkbox" checked={!!selected[p.id]} onchange={() => toggleParticipant(p.id)} />
							<span>{p.display_name}</span>
						</label>
					{/each}
				</div>
			</fieldset>
		{:else if mode === 'custom'}
			<fieldset class="field-group">
				<span class="field-label">Peserta & pembagian</span>
				<div class="custom-rows">
					{#each participants as p (p.id)}
						{#if selected[p.id]}
							<div class="custom-row">
								<span class="c-name">{p.display_name}</span>
								<div class="c-input-wrap">
									<span class="c-cur">{currency}</span>
									<input class="input c-input" type="number" min="0" placeholder="0" bind:value={customShares[p.id]} />
								</div>
							</div>
						{/if}
					{/each}
				</div>
				<div class="check-grid">
					{#each participants as p (p.id)}
						<label class="check">
							<input type="checkbox" checked={!!selected[p.id]} onchange={() => toggleParticipant(p.id)} />
							<span>{p.display_name}</span>
						</label>
					{/each}
				</div>
			</fieldset>
		{:else}
			<fieldset class="field-group">
				<span class="field-label">Item</span>
				<div class="items">
					{#each items as item, i (item.name + i)}
						<div class="item-row">
							<input class="input" type="text" placeholder="Nama item" bind:value={item.name} />
							<select class="input" bind:value={item.participant_id}>
								<option value="" disabled>Peserta</option>
								{#each participants as p (p.id)}
									<option value={p.id}>{p.display_name}</option>
								{/each}
							</select>
							<div class="qty">
								<input class="input" type="number" min="1" placeholder="Qty" bind:value={item.qty} />
								<span class="mul">×</span>
								<input class="input" type="number" min="0" placeholder="Harga" bind:value={item.unit_price} />
							</div>
							<button type="button" class="btn-mini" aria-label="Hapus item" onclick={() => removeItem(i)}>
								<Icon name="trash" size={15} />
							</button>
						</div>
					{/each}
				</div>
				<button type="button" class="btn-ghost btn-inline" onclick={addItem}>
					<Icon name="plus" size={16} /> Tambah item
				</button>
			</fieldset>
		{/if}

		<button class="btn btn-primary" type="submit" disabled={loading}>
			{#if loading}
				<span class="spinner"></span> Menyimpan…
			{:else}
				Simpan <Icon name="arrow-right" size={17} />
			{/if}
		</button>
	</form>
{/if}

<style>
	.back {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 14px;
		transform: rotate(180deg);
		margin-bottom: 16px;
	}

	.page-title {
		font-size: 24px;
		letter-spacing: -0.02em;
		margin-bottom: 20px;
	}

	.card {
		max-width: 620px;
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 28px;
		background: var(--surface);
		border: 3px solid #000;
		box-shadow: var(--shadow);
		border-radius: var(--radius);
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
		padding: 9px 12px;
		background: transparent;
		border: none;
		border-radius: 7px;
		color: var(--text-2);
		font-size: 13.5px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s ease, color 0.15s ease;
	}

	.segmented button.active {
		background: var(--accent);
		color: #fff;
	}

	.check-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 8px;
	}

	.check {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
		color: var(--text-2);
		cursor: pointer;
	}

	.custom-rows {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.custom-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.c-name {
		flex: 1;
		font-size: 14px;
		color: var(--text);
	}

	.c-input-wrap {
		position: relative;
		width: 160px;
	}

	.c-cur {
		position: absolute;
		left: 12px;
		top: 50%;
		transform: translateY(-50%);
		font-size: 13px;
		color: var(--muted);
		pointer-events: none;
	}

	.c-input {
		padding-left: 44px;
	}

	.items {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.item-row {
		display: grid;
		grid-template-columns: 1.4fr 1fr 1.6fr auto;
		gap: 8px;
		align-items: center;
	}

	.qty {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.mul {
		color: var(--muted);
	}

	.btn-mini {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 10px;
		background: var(--surface-2);
		border: 3px solid #000;
		border-radius: 8px;
		color: var(--text-2);
		cursor: pointer;
	}

	.btn-mini:hover {
		color: var(--danger);
		border-color: rgba(255, 92, 110, 0.4);
	}

	.btn-ghost {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 9px 14px;
		background: var(--surface-2);
		border: 3px solid #000;
		border-radius: var(--radius-sm);
		color: var(--text);
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
	}

	.btn-inline {
		width: auto;
	}
</style>
