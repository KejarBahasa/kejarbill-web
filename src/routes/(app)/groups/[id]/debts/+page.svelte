<script lang="ts">
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import { getMyDebts } from '$lib/api/groups';
	import { mapApiError } from '$lib/utils/errors';
	import { formatDateShort, formatIDR } from '$lib/utils/format';
	import type { MyDebtsResponse } from '$lib/types/group';

	const id = String(page.params.id);
	let result = $state<MyDebtsResponse | null>(null);
	let loading = $state(true);
	let error = $state('');

	$effect(() => {
		(async () => {
			try {
				result = await getMyDebts(id);
			} catch (err) {
				error = mapApiError(err, 'Gagal memuat detail tagihan.');
			} finally {
				loading = false;
			}
		})();
	});
</script>

<svelte:head>
	<title>Tagihan Saya — KejarBill</title>
</svelte:head>

<a class="back" href={`/groups/${id}`}><Icon name="chevron-right" size={16} /> Kembali ke dashboard</a>

<div class="page-heading">
	<div>
		<p class="eyebrow">Ringkasan pembayaran</p>
		<h1>Tagihan saya</h1>
		<p class="subtitle">Daftar pengeluaran yang masih perlu kamu bayarkan.</p>
	</div>
	{#if result}
		<div class="total-box">
			<span>Total tersisa</span>
			<strong>{formatIDR(result.remaining_amount)}</strong>
		</div>
	{/if}
</div>

{#if loading}
	<div class="status"><span class="spinner"></span> Memuat tagihan…</div>
{:else if error}
	<div class="alert alert-error" role="alert"><span>{error}</span></div>
{:else if result && result.debts.length === 0}
	<section class="empty block">
		<span class="empty-icon"><Icon name="check-circle" size={22} /></span>
		<h2>Semua sudah lunas</h2>
		<p>Tidak ada tagihan yang perlu kamu bayarkan.</p>
	</section>
{:else if result}
	<div class="debt-list">
		{#each result.debts as debt (debt.to_participant.id)}
			<section class="debt-card">
				<div class="debt-head">
					<div class="person">
						<span class="avatar">{debt.to_participant.display_name.slice(0, 1).toUpperCase()}</span>
						<div>
							<span class="kicker">Bayar ke</span>
							<h2>{debt.to_participant.display_name}</h2>
						</div>
					</div>
					<div class="debt-total">
						<span>Sisa tagihan</span>
						<strong>{formatIDR(debt.remaining_amount)}</strong>
						<a class="btn btn-primary" href={`/groups/${id}/settlements?to=${debt.to_participant.id}&amount=${debt.remaining_amount}`}>
							<Icon name="wallet" size={15} /> Bayar
						</a>
					</div>
				</div>

				<div class="transactions">
					<div class="table-head"><span>Transaksi</span><span>Nominal</span><span>Status</span></div>
					{#each debt.expenses as expense (expense.expense_id)}
						<a class="transaction" href={`/groups/${id}/expenses/${expense.expense_id}`}>
							<span class="transaction-name">
								<strong>{expense.title}</strong>
								<small>{formatDateShort(expense.expense_date)}</small>
							</span>
							<strong>{formatIDR(expense.amount)}</strong>
							<span class="status-pill" class:paid={expense.status === 'paid'} class:partial={expense.status === 'partial'}>
								{expense.status === 'paid' ? 'Lunas' : expense.status === 'partial' ? `Sisa ${formatIDR(expense.remaining_amount)}` : 'Belum bayar'}
							</span>
						</a>
					{/each}
				</div>
			</section>
		{/each}
	</div>
{/if}

<style>
	.page-heading { display: flex; justify-content: space-between; align-items: end; gap: 20px; margin: 18px 0 24px; }
	.eyebrow { margin: 0 0 4px; color: var(--muted); font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; }
	h1 { margin: 0; font-family: var(--font-head); font-size: clamp(28px, 5vw, 42px); }
	.subtitle { margin: 6px 0 0; color: var(--muted); }
	.total-box { display: flex; flex-direction: column; gap: 3px; padding: 14px 18px; border: 3px solid #000; border-radius: var(--radius); background: var(--accent); box-shadow: var(--shadow); }
	.total-box span { font-size: 12px; font-weight: 700; text-transform: uppercase; }
	.total-box strong { font-family: var(--font-head); font-size: 20px; }
	.status { display: flex; align-items: center; gap: 10px; color: var(--muted); }
	.block, .debt-card { background: var(--surface); border: 3px solid #000; border-radius: var(--radius); box-shadow: var(--shadow); }
	.empty { padding: 42px 20px; text-align: center; }
	.empty-icon { display: inline-flex; padding: 10px; border: 2px solid #000; border-radius: 50%; background: var(--success); color: #000; }
	.empty h2 { margin: 12px 0 4px; font-size: 20px; }
	.empty p { margin: 0; color: var(--muted); }
	.debt-list { display: flex; flex-direction: column; gap: 20px; }
	.debt-card { overflow: hidden; }
	.debt-head { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 22px; }
	.person { display: flex; align-items: center; gap: 12px; }
	.avatar { display: inline-flex; align-items: center; justify-content: center; width: 42px; height: 42px; border: 2px solid #000; border-radius: 50%; background: var(--accent); font-weight: 700; }
	.kicker, .debt-total span { display: block; color: var(--muted); font-size: 12px; font-weight: 600; }
	.person h2 { margin: 2px 0 0; font-size: 18px; }
	.debt-total { display: flex; flex-direction: column; align-items: end; gap: 5px; }
	.debt-total strong { font-family: var(--font-head); font-size: 20px; color: var(--danger); }
	.debt-total .btn { margin-top: 5px; width: auto; }
	.transactions { margin: 0 22px 22px; border: 2px solid var(--surface-2); border-radius: var(--radius-sm); overflow: hidden; }
	.table-head, .transaction { display: grid; grid-template-columns: 1fr minmax(90px, auto) minmax(100px, auto); align-items: center; gap: 16px; padding: 12px 16px; }
	.table-head { background: var(--surface-2); color: var(--muted); font-size: 12px; font-weight: 700; text-transform: uppercase; }
	.transaction { color: inherit; text-decoration: none; border-top: 1px solid var(--surface-2); }
	.transaction:hover { background: color-mix(in srgb, var(--accent) 14%, transparent); text-decoration: none; }
	.transaction-name { display: flex; flex-direction: column; gap: 2px; }
	.transaction-name small { color: var(--muted); font-size: 12px; }
	.status-pill { justify-self: start; padding: 5px 9px; border-radius: 999px; background: var(--surface-2); color: var(--muted); font-size: 12px; font-weight: 700; }
	.status-pill.partial { background: #fff0c2; color: #765400; }
	.status-pill.paid { background: #d8f8e7; color: #146b42; }
	@media (max-width: 650px) {
		.page-heading, .debt-head { align-items: stretch; flex-direction: column; }
		.debt-total { align-items: start; }
		.debt-total .btn { width: 100%; }
		.table-head, .transaction { grid-template-columns: 1fr auto; }
		.table-head span:nth-child(2), .transaction > strong { display: none; }
		.transaction .status-pill { justify-self: end; }
	}
</style>
