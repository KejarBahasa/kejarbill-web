<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Icon from '$lib/components/Icon.svelte';
	import { getExpense, deleteExpense } from '$lib/api/expenses';
	import { ApiError } from '$lib/types';
	import type { ExpenseDetail } from '$lib/types/expense';
	import { toast } from '$lib/stores/toast.svelte';

	const expenseId = String(page.params.expenseId);

	let expense = $state<ExpenseDetail | null>(null);
	let loading = $state(true);
	let error = $state('');
	let deleting = $state(false);

	$effect(() => {
		(async () => {
			loading = true;
			error = '';
			try {
				expense = await getExpense(expenseId);
			} catch (err) {
				expense = null;
				error = err instanceof ApiError ? err.message : 'Gagal memuat expense.';
			} finally {
				loading = false;
			}
		})();
	});

	function formatIDR(n: number) {
		return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
	}

	async function handleDelete() {
		if (!expense) return;
		if (!confirm(`Hapus expense "${expense.title}"?`)) return;
		deleting = true;
		try {
			await deleteExpense(expenseId);
			toast.success('Expense dihapus.');
			await goto(`/groups/${page.params.id}/expenses`);
		} catch (err) {
			error = err instanceof ApiError ? err.message : 'Gagal menghapus expense.';
		} finally {
			deleting = false;
		}
	}
</script>

<svelte:head>
	<title>{expense?.title ?? 'Expense'} — KejarBill</title>
</svelte:head>

<a href={`/groups/${page.params.id}/expenses`} class="back"><Icon name="chevron-right" size={16} /> Kembali</a>

{#if loading}
	<div class="status"><span class="spinner"></span> Memuat…</div>
{:else if error}
	<div class="alert alert-error" role="alert"><span>{error}</span></div>
{:else if expense}
	<div class="head">
		<h1>{expense.title}</h1>
		<button class="btn btn-ghost btn-inline danger" onclick={handleDelete} disabled={deleting}>
			<Icon name="trash" size={16} /> Hapus
		</button>
	</div>

	<div class="meta">
		<span class="chip"><Icon name="user" size={13} /> {expense.payer.display_name}</span>
		<span class="chip"><Icon name="calendar" size={13} /> {new Date(expense.expense_date).toLocaleDateString('id-ID', { dateStyle: 'long' })}</span>
		<strong class="total">{formatIDR(expense.total_amount)}</strong>
	</div>

	{#if expense.description}
		<p class="desc">{expense.description}</p>
	{/if}

	<div class="grid">
		<section class="block">
			<h2>Pembagian ({expense.participants.length})</h2>
			<ul class="rows">
				{#each expense.participants as p (p.participant_id)}
					<li>
						<span>{p.display_name}</span>
						<strong>{formatIDR(p.share_amount)}</strong>
					</li>
				{/each}
			</ul>
		</section>

		{#if expense.items.length > 0}
			<section class="block">
				<h2>Item ({expense.items.length})</h2>
				<ul class="rows">
					{#each expense.items as it (it.id)}
						<li>
							<span>
								{it.qty}× {it.name} <em>({formatIDR(it.unit_price)})</em>
							</span>
							<strong>{formatIDR(it.subtotal)}</strong>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
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
		font-size: 18px;
		line-height: 1.4;
	}

	.btn-inline {
		width: auto;
		white-space: nowrap;
	}

	.danger:hover:not(:disabled) {
		background: var(--danger-soft);
	}

	.meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 10px;
		margin-bottom: 16px;
	}

	.total {
		margin-left: auto;
		font-family: var(--font-head);
		font-size: 14px;
		background: var(--accent);
		border: 3px solid #000;
		border-radius: var(--radius-sm);
		padding: 6px 10px;
	}

	.desc {
		color: var(--text-2);
		margin-bottom: 20px;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 16px;
	}

	.block {
		background: var(--surface);
		border: 3px solid #000;
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		padding: 18px;
	}

	.block h2 {
		font-size: 14px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		margin-bottom: 14px;
	}

	.rows {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.rows li {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		font-size: 14px;
		padding-bottom: 10px;
		border-bottom: 2px solid var(--surface-2);
	}

	.rows li:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.rows em {
		color: var(--muted);
		font-style: normal;
		font-size: 13px;
	}
</style>
