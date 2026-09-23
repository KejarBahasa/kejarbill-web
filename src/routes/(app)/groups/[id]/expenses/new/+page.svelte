<script lang="ts">
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import { getGroupParticipants } from '$lib/api/groups';
	import { createEqualExpense, createCustomExpense, createItemizedExpense } from '$lib/api/expenses';
	import { mapApiError } from '$lib/utils/errors';
	import { formatIDR, formatJakartaDateTimeInput, jakartaInputToISO } from '$lib/utils/format';
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
	let expense_date = $state(formatJakartaDateTimeInput());
	let payer_participant_id = $state('');
	let participants = $state<Participant[]>([]);
	let selected = $state<Record<string, boolean>>({});
	let customShares = $state<Record<string, number>>({});
	let equalShares = $state<Record<string, number>>({});
	let equalSharesEdited = $state(false);
	let items = $state<Array<{ id: string; name: string; participant_id: string; qty: number; unit_price: number; notes: string }>>([
		{ id: crypto.randomUUID(), name: '', participant_id: '', qty: 1, unit_price: 0, notes: '' }
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
				error = mapApiError(err, 'Gagal memuat peserta.');
			} finally {
				loading = false;
			}
		})();
	});

	function toggleParticipant(pid: string) {
		selected[pid] = !selected[pid];
		resetEqualShares();
	}

	function selectAllParticipants() {
		selected = Object.fromEntries(participants.map((p) => [p.id, true]));
		resetEqualShares();
	}

	function clearParticipants() {
		selected = {};
		resetEqualShares();
	}

	function selectedIds() {
		return Object.entries(selected).filter(([, v]) => v).map(([pid]) => pid);
	}

	function resetEqualShares() {
		equalShares = {};
		equalSharesEdited = false;
	}

	function defaultEqualShares() {
		const ids = selectedIds();
		if (!ids.length) return {};
		const base = Math.floor((Number(total_amount) || 0) / ids.length);
		const remainder = (Number(total_amount) || 0) % ids.length;
		return Object.fromEntries(ids.map((pid, index) => [pid, base + (index < remainder ? 1 : 0)]));
	}

	function equalShareFor(pid: string) {
		return equalSharesEdited ? Number(equalShares[pid] ?? 0) : Number(defaultEqualShares()[pid] ?? 0);
	}

	function editEqualShare(pid: string, value: string) {
		if (!equalSharesEdited) equalShares = defaultEqualShares();
		equalSharesEdited = true;
		equalShares[pid] = Number(value) || 0;
	}

	function equalShareTotal() {
		return selectedIds().reduce((sum, pid) => sum + equalShareFor(pid), 0);
	}

	function participantSecondaryText(p: Participant) {
		if (p.username) return `@${p.username}`;
		return p.participant_type === 'guest' ? 'Tamu' : 'Akun terdaftar';
	}

	const selectedCount = $derived(selectedIds().length);
	const allParticipantsSelected = $derived(participants.length > 0 && selectedCount === participants.length);

	function addItem() {
		items = [...items, { id: crypto.randomUUID(), name: '', participant_id: '', qty: 1, unit_price: 0, notes: '' }];
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

		const date = jakartaInputToISO(expense_date);
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
				if (!total_amount || total_amount <= 0) {
					error = 'Total wajib lebih dari 0.';
					loading = false;
					return;
				}
				if (equalSharesEdited && equalShareTotal() !== Number(total_amount)) {
					error = `Total pembagian harus sama dengan ${formatIDR(Number(total_amount))}.`;
					loading = false;
					return;
				}
				const needsExplicitShares = equalSharesEdited || Number(total_amount) % ids.length !== 0;
				if (needsExplicitShares) {
					await createCustomExpense({
						...common,
						participants: ids.map((pid) => ({ participant_id: pid, share_amount: equalShareFor(pid) }))
					});
				} else {
					await createEqualExpense({ ...common, participant_ids: ids, total_amount });
				}
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
			error = mapApiError(err, 'Gagal menyimpan expense.');
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
	<form class="card expense-card" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
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

		<div class="compact-fields">
			<label class="field">
				<span class="field-label">Tanggal & waktu</span>
				<input class="input" type="datetime-local" step="60" bind:value={expense_date} />
				<span class="hint muted">Asia/Jakarta (UTC+07:00).</span>
			</label>

			<fieldset class="field-group">
				<span class="field-label">Dibayar oleh</span>
				<select class="input" bind:value={payer_participant_id}>
					{#each participants as p (p.id)}
						<option value={p.id}>{p.display_name}{p.username ? ` (@${p.username})` : p.participant_type === 'guest' ? ' (tamu)' : ''}</option>
					{/each}
				</select>
			</fieldset>
		</div>

		{#if mode === 'equal'}
			<label class="field amount-field">
				<span class="field-label">Total ({currency})</span>
				<input class="input" type="number" min="0" bind:value={total_amount} oninput={resetEqualShares} />
			</label>
			<div class="split-layout">
			<fieldset class="field-group participant-panel">
				<div class="participant-heading">
					<span class="field-label">Dibagi ke peserta</span>
					<div class="participant-actions">
						<button type="button" class="btn btn-ghost btn-mini" onclick={selectAllParticipants} disabled={allParticipantsSelected}>Pilih semua</button>
						<button type="button" class="btn btn-ghost btn-mini" onclick={clearParticipants} disabled={selectedCount === 0}>Kosongkan</button>
					</div>
				</div>
				<div class="participant-grid">
					{#each participants as p (p.id)}
						<label class="participant-card" class:selected={!!selected[p.id]}>
							<input type="checkbox" checked={!!selected[p.id]} onchange={() => toggleParticipant(p.id)} />
							<span class="participant-copy"><strong>{p.display_name}</strong><small>{participantSecondaryText(p)}</small></span>
							<span class="participant-check"><Icon name="check-circle" size={15} /></span>
						</label>
					{/each}
				</div>
				</fieldset>

				{#if selectedIds().length > 0}
					<div class="split-preview">
						<div class="split-preview-head">
							<div><strong>Preview pembagian</strong><span>Nominal awal dibagi rata, lalu bisa disesuaikan.</span></div>
							<span class:total-ok={equalShareTotal() === Number(total_amount)} class:total-bad={equalShareTotal() !== Number(total_amount)}>
								{equalShareTotal() === Number(total_amount) ? `Total sesuai ${formatIDR(Number(total_amount))}` : `Selisih ${formatIDR(Math.abs(Number(total_amount) - equalShareTotal()))}`}
							</span>
						</div>
						<div class="split-rows">
							{#each participants.filter((p) => selected[p.id]) as p (p.id)}
								<label class="split-row">
									<span><strong>{p.display_name}</strong><small>{participantSecondaryText(p)}</small></span>
									<input class="input split-input" type="number" min="0" value={equalShareFor(p.id)} oninput={(event) => editEqualShare(p.id, event.currentTarget.value)} />
								</label>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{:else if mode === 'custom'}
			<fieldset class="field-group">
				<div class="participant-heading">
					<span class="field-label">Peserta & pembagian</span>
					<div class="participant-actions">
						<button type="button" class="btn btn-ghost btn-mini" onclick={selectAllParticipants} disabled={allParticipantsSelected}>Pilih semua</button>
						<button type="button" class="btn btn-ghost btn-mini" onclick={clearParticipants} disabled={selectedCount === 0}>Kosongkan</button>
					</div>
				</div>
				<div class="participant-grid">
					{#each participants as p (p.id)}
						<label class="participant-card" class:selected={!!selected[p.id]}>
							<input type="checkbox" checked={!!selected[p.id]} onchange={() => toggleParticipant(p.id)} />
							<span class="participant-copy"><strong>{p.display_name}</strong><small>{participantSecondaryText(p)}</small></span>
							<span class="participant-check"><Icon name="check-circle" size={15} /></span>
						</label>
					{/each}
				</div>
				<div class="custom-rows">
					{#each participants as p (p.id)}
						{#if selected[p.id]}
							<div class="custom-row">
								<span class="c-name"><strong>{p.display_name}</strong><small>{participantSecondaryText(p)}</small></span>
								<div class="c-input-wrap">
									<span class="c-cur">{currency}</span>
									<input class="input c-input" type="number" min="0" placeholder="0" bind:value={customShares[p.id]} />
								</div>
							</div>
						{/if}
					{/each}
				</div>
			</fieldset>
		{:else}
			<fieldset class="field-group">
				<span class="field-label">Item</span>
				<div class="items">
					{#each items as item, i (item.id)}
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
		width: 100%;
		max-width: none;
		margin-inline: auto;
		display: flex;
		flex-direction: column;
		gap: 20px;
		padding: clamp(24px, 3vw, 36px);
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

	.amount-field {
		max-width: 360px;
	}

	.compact-fields {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.35fr);
		gap: 16px;
	}

	.split-layout {
		display: grid;
		grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
		gap: 20px;
		align-items: start;
	}

	.participant-panel,
	.split-preview {
		min-width: 0;
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

	.participant-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.participant-actions {
		display: flex;
		gap: 6px;
	}

	.participant-actions .btn-mini {
		width: auto;
		white-space: nowrap;
		padding: 7px 10px;
		font-size: 12px;
	}

	.participant-actions .btn-mini:disabled {
		box-shadow: none;
		opacity: 0.45;
		cursor: not-allowed;
		transform: none;
	}

	.participant-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
		gap: 10px;
	}

	.participant-card {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
		padding: 12px;
		border: 2px solid var(--surface-2);
		border-radius: var(--radius-sm);
		background: var(--surface);
		cursor: pointer;
		transition: border-color 0.12s ease, background 0.12s ease;
	}

	.participant-card:hover,
	.participant-card.selected {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 13%, var(--surface));
	}

	.participant-card input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}

	.participant-copy,
	.c-name {
		min-width: 0;
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 2px;
	}

	.participant-copy strong,
	.c-name strong {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 14px;
	}

	.participant-copy small,
	.c-name small {
		color: var(--muted);
		font-size: 12px;
	}

	.participant-check {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border: 2px solid var(--muted);
		border-radius: 6px;
		color: transparent;
	}

	.participant-card.selected .participant-check {
		border-color: #000;
		background: var(--accent);
		color: #000;
	}

	.split-preview {
		margin-top: 4px;
		padding: 14px;
		border: 2px solid #000;
		border-radius: var(--radius-sm);
		background: var(--surface-2);
	}

	.split-preview-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 10px;
	}

	.split-preview-head div,
	.split-row span {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.split-preview-head span,
	.split-row small {
		color: var(--muted);
		font-size: 12px;
	}

	.split-preview-head > span {
		padding: 5px 8px;
		border-radius: 999px;
		font-size: 12px;
		font-weight: 700;
		white-space: nowrap;
	}

	.split-preview-head .total-ok {
		background: #d8f8e7;
		color: #146b42;
	}

	.split-preview-head .total-bad {
		background: #ffe0e4;
		color: #9b1c2b;
	}

	.split-rows {
		display: flex;
		flex-direction: column;
		gap: 7px;
	}

	.split-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 8px 10px;
		border-radius: 8px;
		background: var(--surface);
	}

	.split-input {
		width: 140px;
		padding: 8px 10px;
		text-align: right;
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

	@media (max-width: 900px) {
		.split-layout {
			grid-template-columns: 1fr;
		}

		.split-preview {
			order: 2;
		}
	}

	@media (max-width: 640px) {
		.expense-card {
			padding: 20px 16px;
		}

		.compact-fields {
			grid-template-columns: 1fr;
		}

		.amount-field {
			max-width: none;
		}

		.participant-heading,
		.split-preview-head {
			align-items: flex-start;
			flex-direction: column;
		}

		.participant-actions {
			width: 100%;
		}

		.participant-actions .btn {
			flex: 1;
		}

		.participant-grid {
			grid-template-columns: 1fr;
		}

		.split-preview-head > span {
			white-space: normal;
		}
	}
</style>
