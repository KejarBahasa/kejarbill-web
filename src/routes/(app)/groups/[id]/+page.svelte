<script lang="ts">
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import { getGroupSummary, getGroupBalances, getGroupActivities, getGroupParticipants } from '$lib/api/groups';
	import { mapApiError } from '$lib/utils/errors';
	import { formatIDR, formatDateShort } from '$lib/utils/format';
	import type { Balance, GroupActivity, GroupSummary, Participant } from '$lib/types/group';

	const id = String(page.params.id);

	let summary = $state<GroupSummary | null>(null);
	let balances = $state<Balance[]>([]);
	let activities = $state<GroupActivity[]>([]);
	let participants = $state<Participant[]>([]);
	let loading = $state(true);
	let error = $state('');
	let showAllBalances = $state(false);

	const self = $derived(participants.find((p) => p.is_self));

	const myDebts = $derived(
		balances
			.filter((b) => self && b.from_participant.id === self.id)
			.sort((a, b) => b.amount - a.amount)
	);

	const myCredits = $derived(
		balances
			.filter((b) => self && b.to_participant.id === self.id)
			.sort((a, b) => b.amount - a.amount)
	);

	$effect(() => {
		(async () => {
			loading = true;
			error = '';
			try {
				const [s, b, a, p] = await Promise.all([
					getGroupSummary(id),
					getGroupBalances(id),
					getGroupActivities(id),
					getGroupParticipants(id)
				]);
				summary = s;
				balances = b;
				activities = a.activities;
				participants = p.participants;
			} catch (err) {
				error = mapApiError(err, 'Gagal memuat data grup.');
			} finally {
				loading = false;
			}
		})();
	});
</script>

<svelte:head>
	<title>Dashboard — KejarBill</title>
</svelte:head>

{#if loading}
	<div class="status"><span class="spinner"></span> Memuat…</div>
{:else if error}
	<div class="alert alert-error" role="alert"><span>{error}</span></div>
{:else if summary}
	<div class="stats">
		<a class="stat debt" href="/groups/{id}/settlements">
			<span class="stat-label">Tagihan Saya</span>
			<strong class="stat-value">{formatIDR(summary.my_total_debt)}</strong>
			<span class="stat-foot">{myDebts.length > 0 ? `ke ${myDebts.length} orang` : 'tidak ada utang 🎉'}</span>
		</a>
		<div class="stat credit">
			<span class="stat-label">Piutang Saya</span>
			<strong class="stat-value">{formatIDR(summary.my_total_credit)}</strong>
			<span class="stat-foot">{myCredits.length > 0 ? `dari ${myCredits.length} orang` : 'tak ada tagihan'}</span>
		</div>
		<div class="stat paid">
			<span class="stat-label">Total Saya Bayar</span>
			<strong class="stat-value">{formatIDR(summary.my_total_paid)}</strong>
			<span class="stat-label2">uang yang kamu talangi</span>
		</div>
		<div class="stat total">
			<span class="stat-label">Total Grup</span>
			<strong class="stat-value">{formatIDR(summary.group_total)}</strong>
			<span class="stat-label2">semua expense aktif</span>
		</div>
	</div>

	<div class="cols">
		<section class="block">
			<h2 class="block-title">Kamu Utang Ke</h2>
			{#if myDebts.length === 0}
				<p class="muted">Zerang bersih! Tidak ada utang di grup ini.</p>
			{:else}
				<ul class="debts">
					{#each myDebts as d (d.to_participant.id)}
						<li>
							<span class="avatar">{d.to_participant.display_name.slice(0, 1).toUpperCase()}</span>
							<div class="d-body">
								<strong>{d.to_participant.display_name}</strong>
								<span class="d-amount">{formatIDR(d.amount)}</span>
							</div>
							<a
								class="btn btn-primary btn-pay"
								href="/groups/{id}/settlements?to={d.to_participant.id}"
							>
								<Icon name="wallet" size={14} /> Bayar
							</a>
						</li>
					{/each}
				</ul>
			{/if}

			{#if myCredits.length > 0}
				<h2 class="block-title second">Orang Utang Ke Kamu</h2>
				<ul class="credits">
					{#each myCredits.slice(0, showAllBalances ? myCredits.length : 5) as c (c.from_participant.id)}
						<li>
							<span>{c.from_participant.display_name}</span>
							<strong>{formatIDR(c.amount)}</strong>
						</li>
					{/each}
				</ul>
			{/if}

			<details class="pairwise">
				<summary>Semua saldo antar-peserta ({balances.length})</summary>
				{#if balances.length === 0}
					<p class="muted">Belum ada saldo.</p>
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
			</details>
		</section>

		<section class="block">
			<h2 class="block-title">Aktivitas Terakhir</h2>
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
									<span class="act-sub">
										{act.expense.payer_display_name} membayar {formatIDR(act.expense.total_amount)} · {formatDateShort(act.created_at)}
									</span>
								</a>
							{:else if act.settlement}
								<a class="act-main" href={`/groups/${id}/settlements/${act.settlement.id}`}>
									<strong>Settlement</strong>
									<span class="act-sub">
										{act.settlement.from_display_name} → {act.settlement.to_display_name} · {formatIDR(act.settlement.amount)}
									</span>
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

	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
		gap: 16px;
		margin-bottom: 24px;
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 18px;
		border: 3px solid #000;
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		color: var(--text);
		text-decoration: none;
		transition: transform 0.12s ease, box-shadow 0.12s ease;
	}

	a.stat:hover {
		transform: translateY(-3px);
		box-shadow: 9px 9px 0 0 #000;
		text-decoration: none;
	}

	.stat.debt {
		background: var(--danger);
		color: #fff;
	}

	.stat.credit {
		background: var(--success);
		color: #000;
	}

	.stat.paid {
		background: var(--accent);
		color: #000;
	}

	.stat.total {
		background: var(--surface);
	}

	.stat-label {
		font-size: 12px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.85;
	}

	.stat-value {
		font-family: var(--font-head);
		font-size: 15px;
		line-height: 1.4;
	}

	.stat-foot,
	.stat-label2 {
		font-size: 12px;
		font-weight: 600;
		opacity: 0.8;
	}

	.cols {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20px;
		align-items: start;
	}

	.block {
		background: var(--surface);
		border: 3px solid #000;
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		padding: 20px;
	}

	.block-title {
		font-size: 14px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		margin-bottom: 14px;
	}

	.block-title.second {
		margin-top: 22px;
	}

	.muted {
		color: var(--muted);
		font-size: 14px;
	}

	.debts {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.debts li {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.avatar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 38px;
		height: 38px;
		flex-shrink: 0;
		border: 2px solid #000;
		border-radius: 50%;
		background: var(--accent);
		color: #000;
		font-weight: 700;
	}

	.d-body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.d-body strong {
		font-size: 14.5px;
	}

	.d-amount {
		font-size: 13px;
		font-weight: 700;
		color: var(--danger);
	}

	.btn-pay {
		width: auto;
		padding: 8px 14px;
		font-size: 12.5px;
	}

	.credits {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.credits li {
		display: flex;
		justify-content: space-between;
		font-size: 14px;
		padding-bottom: 8px;
		border-bottom: 2px solid var(--surface-2);
	}

	.credits li:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.credits strong {
		color: var(--success);
	}

	.pairwise {
		margin-top: 22px;
		border-top: 3px solid #000;
		padding-top: 14px;
	}

	.pairwise summary {
		font-size: 13px;
		font-weight: 700;
		cursor: pointer;
		color: var(--text-2);
	}

	.balance-list {
		list-style: none;
		margin: 12px 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
		font-size: 13.5px;
		color: var(--text-2);
	}

	.balance-list li {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.balance-list strong {
		margin-left: auto;
		color: var(--text);
	}

	.activity-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.activity {
		display: flex;
		gap: 12px;
		align-items: flex-start;
		padding: 10px 0;
		border-bottom: 2px solid var(--surface-2);
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
		border: 2px solid #000;
		border-radius: 9px;
		background: var(--surface-2);
		color: var(--muted);
	}

	.act-badge.expense {
		background: var(--accent);
		color: #000;
	}

	.act-badge.settlement {
		background: var(--success);
		color: #000;
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

	@media (max-width: 860px) {
		.cols {
			grid-template-columns: 1fr;
		}
	}
</style>
