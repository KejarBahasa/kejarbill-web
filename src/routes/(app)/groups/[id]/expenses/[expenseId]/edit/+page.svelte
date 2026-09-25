<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Icon from '$lib/components/Icon.svelte';
	import { getGroupParticipants } from '$lib/api/groups';
	import { getExpense, updateExpense } from '$lib/api/expenses';
	import { mapApiError } from '$lib/utils/errors';
	import { formatIDR, formatJakartaDateTimeInput, jakartaInputToISO } from '$lib/utils/format';
	import { toast } from '$lib/stores/toast.svelte';
	import type { Participant } from '$lib/types/group';
	import type { ExpenseDetail, UpdateExpenseRequest } from '$lib/types/expense';

	const groupId = String(page.params.id);
	const expenseId = String(page.params.expenseId);
	type Mode = 'equal' | 'custom' | 'itemized';
	type DraftItem = { id: string; name: string; participant_ids: string[]; qty: number; unit_price: number; notes: string };

	let expense = $state<ExpenseDetail | null>(null);
	let participants = $state<Participant[]>([]);
	let mode = $state<Mode>('custom');
	let title = $state('');
	let description = $state('');
	let currency = $state('IDR');
	let expense_date = $state('');
	let payer_participant_id = $state('');
	let total_amount = $state(0);
	let selected = $state<Record<string, boolean>>({});
	let participantOrder = $state<string[]>([]);
	let customShares = $state<Record<string, number>>({});
	let items = $state<DraftItem[]>([]);
	let loading = $state(true);
	let saving = $state(false);
	let error = $state('');

	const selectedIds = () => participantOrder.filter((id) => selected[id]);
	const selectedCount = $derived(selectedIds().length);
	const allSelected = $derived(participants.length > 0 && selectedCount === participants.length);

	function participantText(p: Participant) {
		return p.username ? `@${p.username}` : p.participant_type === 'guest' ? 'Tamu' : 'Akun terdaftar';
	}

	function equalShares() {
		const ids = selectedIds();
		const base = ids.length ? Math.floor(total_amount / ids.length) : 0;
		const remainder = ids.length ? total_amount % ids.length : 0;
		return Object.fromEntries(ids.map((id, index) => [id, base + (index < remainder ? 1 : 0)]));
	}

	function isEqualExpense(detail: ExpenseDetail) {
		if (!detail.participants.length) return false;
		const base = Math.floor(detail.total_amount / detail.participants.length);
		const remainder = detail.total_amount % detail.participants.length;
		return detail.participants.every((p, index) => p.share_amount === base + (index < remainder ? 1 : 0));
	}

	function itemSubtotal(item: DraftItem) {
		return (Number(item.qty) || 0) * (Number(item.unit_price) || 0);
	}

	function itemShare(item: DraftItem, participantId: string) {
		const index = item.participant_ids.indexOf(participantId);
		if (index < 0 || !item.participant_ids.length) return 0;
		const subtotal = itemSubtotal(item);
		const base = Math.floor(subtotal / item.participant_ids.length);
		return base + (index < subtotal % item.participant_ids.length ? 1 : 0);
	}

	function participantItemTotal(participantId: string) {
		return items.reduce((sum, item) => sum + itemShare(item, participantId), 0);
	}

	function toggleParticipant(id: string) {
		selected[id] = !selected[id];
	}

	function selectAll() {
		selected = Object.fromEntries(participants.map((p) => [p.id, true]));
	}

	function clearAll() {
		selected = {};
	}

	function toggleItemParticipant(itemId: string, participantId: string) {
		items = items.map((item) => item.id !== itemId ? item : {
			...item,
			participant_ids: item.participant_ids.includes(participantId)
				? item.participant_ids.filter((id) => id !== participantId)
				: [...item.participant_ids, participantId]
		});
	}

	function selectAllItem(itemId: string) {
		items = items.map((item) => item.id === itemId ? { ...item, participant_ids: participants.map((p) => p.id) } : item);
	}

	function clearItem(itemId: string) {
		items = items.map((item) => item.id === itemId ? { ...item, participant_ids: [] } : item);
	}

	function addItem() {
		items = [...items, { id: crypto.randomUUID(), name: '', participant_ids: [], qty: 1, unit_price: 0, notes: '' }];
	}

	function removeItem(index: number) {
		items = items.filter((_, i) => i !== index);
	}

	$effect(() => {
		(async () => {
			try {
				const [detail, groupParticipants] = await Promise.all([getExpense(expenseId), getGroupParticipants(groupId)]);
				expense = detail;
				participants = groupParticipants.participants;
				participantOrder = [
					...detail.participants.map((p) => p.participant_id),
					...groupParticipants.participants
						.filter((p) => !detail.participants.some((selectedParticipant) => selectedParticipant.participant_id === p.id))
						.map((p) => p.id)
				];
				title = detail.title;
				description = detail.description ?? '';
				currency = detail.currency;
				expense_date = formatJakartaDateTimeInput(new Date(detail.expense_date));
				payer_participant_id = detail.payer.participant_id;
				total_amount = detail.total_amount;
				selected = Object.fromEntries(detail.participants.map((p) => [p.participant_id, true]));
				customShares = Object.fromEntries(detail.participants.map((p) => [p.participant_id, p.share_amount]));
				if (detail.items.length > 0) {
					mode = 'itemized';
					items = detail.items.map((item) => ({
						id: item.id,
						name: item.name,
						participant_ids: item.participants.map((p) => p.participant_id),
						qty: item.qty,
						unit_price: item.unit_price,
						notes: item.notes ?? ''
					}));
				} else {
					mode = isEqualExpense(detail) ? 'equal' : 'custom';
				}
			} catch (err) {
				error = mapApiError(err, 'Gagal memuat expense.');
			} finally {
				loading = false;
			}
		})();
	});

	function validate(): string {
		if (!title.trim()) return 'Judul expense wajib diisi.';
		if (!payer_participant_id) return 'Pilih pembayar.';
		if (mode === 'equal' && (total_amount <= 0 || !selectedCount)) return 'Isi total dan pilih minimal satu peserta.';
		if (mode === 'custom') {
			const ids = selectedIds();
			if (!ids.length || ids.some((id) => Number(customShares[id]) <= 0)) return 'Isi pembagian untuk semua peserta terpilih.';
			if (ids.reduce((sum, id) => sum + Number(customShares[id]), 0) !== total_amount) return `Total pembagian harus sama dengan ${formatIDR(total_amount)}.`;
		}
		if (mode === 'itemized' && items.some((item) => !item.name.trim() || item.qty <= 0 || item.unit_price <= 0 || !item.participant_ids.length)) return 'Lengkapi item dan minimal satu peserta per item.';
		return '';
	}

	async function submit() {
		error = validate();
		if (error || !expense) return;
		saving = true;
		const base = { title: title.trim(), description: description.trim() || undefined, currency, expense_date: jakartaInputToISO(expense_date), payer_participant_id, version: expense.version };
		let body: UpdateExpenseRequest;
		if (mode === 'equal') body = { ...base, split_method: 'equal', total_amount, participant_ids: selectedIds() };
		else if (mode === 'custom') body = { ...base, split_method: 'custom', participants: selectedIds().map((id) => ({ participant_id: id, share_amount: Number(customShares[id]) })) };
		else body = { ...base, split_method: 'itemized', items: items.map((item) => ({ name: item.name.trim(), qty: Number(item.qty), unit_price: Number(item.unit_price), notes: item.notes.trim() || undefined, participant_ids: item.participant_ids })) };
		try {
			await updateExpense(expenseId, body);
			toast.success('Expense berhasil diperbarui.');
			await goto(`/groups/${groupId}/expenses/${expenseId}`);
		} catch (err) {
			error = mapApiError(err, 'Gagal memperbarui expense.');
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head><title>Edit Expense — KejarBill</title></svelte:head>
<a class="back" href={`/groups/${groupId}/expenses/${expenseId}`}><Icon name="chevron-right" size={16} /> Kembali</a>
<h2 class="page-title">Edit Expense</h2>

{#if loading}
	<div class="status"><span class="spinner"></span> Memuat expense…</div>
{:else if error && !expense}
	<div class="alert alert-error" role="alert">{error}</div>
{:else if expense}
	<form class="card edit-card" onsubmit={(event) => { event.preventDefault(); submit(); }}>
		{#if error}
			<div class="alert alert-error" role="alert">{error}</div>
			{#if error.includes('berubah')}
				<button type="button" class="btn btn-ghost reload" onclick={() => window.location.reload()}>Muat ulang data terbaru</button>
			{/if}
		{/if}
		<div class="segmented">
			{#each ([['equal', 'Bagi Rata'], ['custom', 'Custom'], ['itemized', 'Per Item']]) as [value, label] (value)}
				<button type="button" class:active={mode === value} onclick={() => (mode = value as Mode)}>{label}</button>
			{/each}
		</div>
		<label class="field"><span class="field-label">Judul</span><input class="input" bind:value={title} /></label>
		<label class="field"><span class="field-label">Deskripsi</span><input class="input" bind:value={description} /></label>
		<div class="grid2">
			<label class="field"><span class="field-label">Tanggal & waktu</span><input class="input" type="datetime-local" step="60" bind:value={expense_date} /></label>
			<label class="field"><span class="field-label">Dibayar oleh</span><select class="input" bind:value={payer_participant_id}>{#each participants as p (p.id)}<option value={p.id}>{p.display_name}{p.username ? ` (@${p.username})` : ''}</option>{/each}</select></label>
		</div>

		{#if mode !== 'itemized'}
			<label class="field amount"><span class="field-label">Total ({currency})</span><input class="input" type="number" min="1" bind:value={total_amount} /></label>
			<div class="participant-head"><span class="field-label">Peserta</span><div><button type="button" class="btn btn-ghost mini" onclick={selectAll} disabled={allSelected}>Pilih semua</button><button type="button" class="btn btn-ghost mini" onclick={clearAll} disabled={!selectedCount}>Kosongkan</button></div></div>
			<div class="participant-grid">{#each participants as p (p.id)}<label class="participant" class:selected={!!selected[p.id]}><input type="checkbox" checked={!!selected[p.id]} onchange={() => toggleParticipant(p.id)} /><span><strong>{p.display_name}</strong><small>{participantText(p)}</small></span></label>{/each}</div>
			{#if mode === 'equal'}
				<div class="preview"><strong>Preview pembagian</strong>{#each participants.filter((p) => selected[p.id]) as p, index (p.id)}<span>{p.display_name}: {formatIDR(equalShares()[p.id] ?? 0)}</span>{/each}</div>
			{:else}
				<div class="custom-list">{#each participants.filter((p) => selected[p.id]) as p (p.id)}<label class="custom-row"><span>{p.display_name}</span><input class="input" type="number" min="0" bind:value={customShares[p.id]} /></label>{/each}<strong>Total: {formatIDR(selectedIds().reduce((sum, id) => sum + Number(customShares[id] || 0), 0))} / {formatIDR(total_amount)}</strong></div>
			{/if}
		{:else}
			<div class="items">{#each items as item, index (item.id)}
				<div class="item-card"><div class="item-top"><input class="input" placeholder="Nama item" bind:value={item.name} /><input class="input qty" type="number" min="1" bind:value={item.qty} /><input class="input" type="number" min="1" bind:value={item.unit_price} /><strong>{formatIDR(itemSubtotal(item))}</strong><button type="button" class="icon-btn" onclick={() => removeItem(index)}><Icon name="trash" size={15} /></button></div>
					<div class="item-head"><strong>Ditanggung oleh</strong><div><button type="button" class="btn btn-ghost mini" onclick={() => selectAllItem(item.id)} disabled={item.participant_ids.length === participants.length}>Semua</button><button type="button" class="btn btn-ghost mini" onclick={() => clearItem(item.id)} disabled={!item.participant_ids.length}>Kosongkan</button></div></div>
					<div class="item-grid">{#each participants as p (p.id)}<label class:selected={item.participant_ids.includes(p.id)}><input type="checkbox" checked={item.participant_ids.includes(p.id)} onchange={() => toggleItemParticipant(item.id, p.id)} /><span>{p.display_name}</span></label>{/each}</div>
					{#if item.participant_ids.length}<div class="preview">{#each item.participant_ids as pid (pid)}<span>{participants.find((p) => p.id === pid)?.display_name}: {formatIDR(itemShare(item, pid))}</span>{/each}</div>{/if}
				</div>
			{/each}</div>
			<button type="button" class="btn btn-ghost add" onclick={addItem}><Icon name="plus" size={16} /> Tambah item</button>
			<div class="preview aggregate"><strong>Total beban peserta</strong>{#each participants as p (p.id)}<span>{p.display_name}: {formatIDR(participantItemTotal(p.id))}</span>{/each}</div>
		{/if}
		<button class="btn btn-primary" type="submit" disabled={saving}>{#if saving}<span class="spinner"></span> Menyimpan…{:else}Simpan perubahan <Icon name="arrow-right" size={17} />{/if}</button>
	</form>
{/if}

<style>
	.back { display: inline-flex; gap: 4px; margin-bottom: 16px; font-size: 14px; font-weight: 700; }
	.back :global(svg) { transform: rotate(180deg); }
	.page-title { margin-bottom: 20px; font-size: 24px; }
	.card { width: 100%; padding: clamp(24px, 3vw, 36px); background: var(--surface); border: 3px solid #000; border-radius: var(--radius); box-shadow: var(--shadow); display: flex; flex-direction: column; gap: 18px; }
	.field { display: flex; flex-direction: column; gap: 7px; }
	.field-label { font-size: 13px; font-weight: 700; text-transform: uppercase; }
	.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
	.amount { max-width: 360px; }
	.participant-head, .item-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
	.participant-head > div, .item-head > div { display: flex; gap: 6px; }
	.mini { width: auto; padding: 7px 10px; font-size: 12px; }
	.participant-grid, .item-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
	.participant, .item-grid label { display: flex; gap: 8px; align-items: center; padding: 10px; border: 2px solid var(--surface-2); border-radius: var(--radius-sm); cursor: pointer; }
	.participant.selected, .item-grid label.selected { border-color: #000; background: var(--accent-soft); }
	.participant input, .item-grid input { accent-color: var(--accent); }
	.participant span { display: flex; flex-direction: column; gap: 1px; }
	.participant small { color: var(--muted); font-size: 12px; }
	.preview { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px; border: 2px solid #000; border-radius: var(--radius-sm); background: var(--surface-2); font-size: 13px; }
	.preview span { padding: 5px 8px; border-radius: 6px; background: var(--surface); }
	.custom-list { display: flex; flex-direction: column; gap: 8px; }
	.custom-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
	.custom-row .input { width: 180px; }
	.items { display: flex; flex-direction: column; gap: 12px; }
	.item-card { display: flex; flex-direction: column; gap: 12px; padding: 14px; border: 2px solid #000; border-radius: var(--radius-sm); background: var(--surface-2); }
	.item-top { display: grid; grid-template-columns: minmax(180px, 1fr) 90px 150px auto auto; gap: 8px; align-items: center; }
	.icon-btn { display: inline-flex; padding: 9px; border: 2px solid #000; border-radius: 7px; background: var(--surface); }
	.add { width: auto; }
	.reload { width: auto; }
	.aggregate { margin-top: 2px; }
	.status { display: flex; gap: 10px; color: var(--muted); }
	@media (max-width: 700px) { .grid2 { grid-template-columns: 1fr; } .amount { max-width: none; } .item-top { grid-template-columns: 1fr auto; } .item-top .qty { grid-column: 1; } .item-top > .input:nth-child(3) { grid-column: 2; grid-row: 2; } .item-top strong { grid-column: 1; grid-row: 3; } .item-top .icon-btn { grid-column: 2; grid-row: 3; } .participant-head, .item-head { align-items: flex-start; flex-direction: column; } }
</style>
