<script lang="ts">
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import { getGroupExpenses } from '$lib/api/expenses';
	import { ApiError } from '$lib/types';
	import type { ExpenseSummary } from '$lib/types/expense';

	const id = String(page.params.id);

	let expenses = $state<ExpenseSummary[]>([]);
	let loading = $state(true);
	let error = $state('');

	$effect(() => {
		(async () => {
			loading = true;
			error = '';
			try {
				expenses = (await getGroupExpenses(id)).expenses;
			} catch (err) {
				expenses = [];
				error = err instanceof ApiError ? err.message : 'Gagal memuat expense.';
			} finally {
				loading = false;
			}
		})();
	});

	function formatIDR(n: number) {
		return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
	}
</script>

<svelte:head>
	<title>Expense — KejarBill</title>
</svelte:head>

<div class="head">
	<h2>Expense</h2>
	<a href={`/groups/${id}/expenses/new`} class="btn btn-primary btn-inline">
		<Icon name="plus" size={17} /> Tambah
	</a>
</div>

{#if loading}
	<div class="status"><span class="spinner"></span> Memuat…</div>
{:else if error}
	<div class="alert alert-error" role="alert">
		<span class="alert-icon"><Icon name="alert" size={17} /></span>
		<span>{error}</span>
	</div>
{:else if expenses.length === 0}
	<p class="muted">Belum ada expense. Tambahkan yang pertama.</p>
{:else}
	<ul class="list">
		{#each expenses as e (e.id)}
			<li>
				<a class="row" href={`/groups/${id}/expenses/${e.id}`}>
					<span class="e-icon"><Icon name="receipt" size={18} /></span>
					<span class="e-body">
						<strong>{e.title}</strong>
						<span class="e-sub">{e.payer.display_name} · {new Date(e.expense_date).toLocaleDateString('id-ID')}</span>
					</span>
					<strong class="e-amount">{formatIDR(e.total_amount)}</strong>
				</a>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 16px;
	}

	.head h2 {
		font-size: 18px;
	}

	.btn-inline {
		width: auto;
		white-space: nowrap;
		padding: 9px 14px;
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

	.muted {
		color: var(--muted);
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
		gap: 14px;
		padding: 14px 16px;
		background: var(--surface);
		border: 3px solid #000;
		box-shadow: var(--shadow);
		border-radius: var(--radius);
	}

	.row {
		display: flex;
		align-items: center;
		gap: 14px;
		width: 100%;
		color: inherit;
		text-decoration: none;
	}

	.row:hover {
		text-decoration: none;
	}

	.e-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 38px;
		height: 38px;
		flex-shrink: 0;
		border-radius: 10px;
		background: var(--accent-soft);
		color: var(--accent-hi);
	}

	.e-body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.e-body strong {
		font-size: 14.5px;
	}

	.e-sub {
		font-size: 13px;
		color: var(--muted);
	}

	.e-amount {
		font-size: 14px;
		white-space: nowrap;
	}
</style>
