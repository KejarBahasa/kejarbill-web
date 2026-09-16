<script lang="ts">
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import { getGroupBalances, getGroupActivities } from '$lib/api/groups';
	import { ApiError } from '$lib/types';
	import type { Balance, GroupActivity } from '$lib/types/group';

	const id = String(page.params.id);

	let balances = $state<Balance[]>([]);
	let activities = $state<GroupActivity[]>([]);
	let loading = $state(true);
	let error = $state('');

	$effect(() => {
		(async () => {
			loading = true;
			error = '';
			try {
				const [b, a] = await Promise.all([getGroupBalances(id), getGroupActivities(id)]);
				balances = b;
				activities = a;
			} catch (err) {
				error = err instanceof ApiError ? err.message : 'Gagal memuat data grup.';
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
	<title>Ringkasan — KejarBill</title>
</svelte:head>

{#if loading}
	<div class="status"><span class="spinner"></span> Memuat…</div>
{:else if error}
	<div class="alert alert-error" role="alert">
		<span class="alert-icon"><Icon name="alert" size={17} /></span>
		<span>{error}</span>
	</div>
{:else}
	<div class="grid">
		<section class="block">
			<h2 class="block-title">Ringkasan Saldo</h2>
			{#if balances.length === 0}
				<p class="muted">Belum ada saldo utang piutang.</p>
			{:else}
				<ul class="balance-list">
					{#each balances as bal (bal.from_participant.id + bal.to_participant.id)}
						<li>
							<span>{bal.from_participant.display_name}</span>
							<Icon name="arrow-right" size={14} />
							<span>{bal.to_participant.display_name}</span>
							<strong>{formatIDR(bal.amount)}</strong>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section class="block">
			<h2 class="block-title">Aktivitas</h2>
			{#if activities.length === 0}
				<p class="muted">Belum ada aktivitas di grup ini.</p>
			{:else}
				<ul class="activity-list">
					{#each activities as act (act.created_at + (act.expense?.id ?? act.settlement?.id))}
						<li class="activity">
							<span class="act-badge" class:expense={act.type === 'expense'} class:settlement={act.type === 'settlement'}>
								<Icon name={act.type === 'expense' ? 'receipt' : 'arrow-right'} size={15} />
							</span>
							{#if act.type === 'expense' && act.expense}
								<a class="act-main" href={`/groups/${id}/expenses/${act.expense.id}`}>
									<strong>{act.expense.title}</strong>
									<span class="act-sub">{act.expense.payer_display_name} membayar {formatIDR(act.expense.total_amount)}</span>
								</a>
							{:else if act.settlement}
								<a class="act-main" href={`/groups/${id}/settlements/${act.settlement.id}`}>
									<strong>Settlement</strong>
									<span class="act-sub">{act.settlement.from_display_name} → {act.settlement.to_display_name} · {formatIDR(act.settlement.amount)}</span>
								</a>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	</div>
{/if}

<style>
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

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 20px;
	}

	.block {
		background: var(--surface);
		border: 1px solid var(--border);
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
		font-size: 14px;
	}

	.balance-list,
	.activity-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.balance-list li {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 14px;
		color: var(--text-2);
	}

	.balance-list strong {
		margin-left: auto;
		color: var(--text);
	}

	.activity {
		display: flex;
		gap: 12px;
		align-items: flex-start;
		padding: 10px 0;
		border-bottom: 1px solid var(--border);
	}

	.activity:last-child {
		border-bottom: none;
	}

	.act-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		flex-shrink: 0;
		border-radius: 9px;
		background: var(--surface-2);
		color: var(--muted);
	}

	.act-badge.expense {
		background: var(--accent-soft);
		color: var(--accent-hi);
	}

	.act-badge.settlement {
		background: rgba(52, 211, 153, 0.12);
		color: var(--success);
	}

	.act-main {
		display: flex;
		flex-direction: column;
		gap: 2px;
		color: inherit;
		text-decoration: none;
	}

	.act-main:hover {
		text-decoration: none;
	}

	.act-main strong {
		font-size: 14px;
	}

	.act-sub {
		font-size: 13px;
		color: var(--muted);
	}
</style>
