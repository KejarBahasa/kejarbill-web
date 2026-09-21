<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { getGroups } from '$lib/api/groups';
import { mapApiError } from '$lib/utils/errors';
	import type { GroupDetail } from '$lib/types/group';

	let groups = $state<GroupDetail[]>([]);
	let loading = $state(true);
	let error = $state('');

	$effect(() => {
		(async () => {
			loading = true;
			error = '';
			try {
				const data = await getGroups();
				groups = data.groups;
			} catch (err) {
				groups = [];
				error = mapApiError(err, 'Gagal memuat grup.');
			} finally {
				loading = false;
			}
		})();
	});
</script>

<svelte:head>
	<title>Grup — KejarBill</title>
</svelte:head>

<div class="page-head">
	<div>
		<h1>Grup</h1>
		<p>Semua grup yang kamu ikuti.</p>
	</div>
	<a href="/groups/new" class="btn btn-primary btn-inline">
		<Icon name="plus" size={17} /> Buat Grup
	</a>
</div>

{#if loading}
	<div class="status"><span class="spinner"></span> Memuat…</div>
{:else if error}
	<div class="alert alert-error" role="alert"><span>{error}</span></div>
{:else if groups.length === 0}
	<div class="empty">
		<span class="empty-mark"><Icon name="users" size={22} /></span>
		<p>Belum ada grup. Buat yang pertama buat mulai bagi tagihan.</p>
		<a href="/groups/new" class="btn btn-ghost btn-inline">Buat Grup</a>
	</div>
{:else}
	<ul class="cards">
		{#each groups as g (g.id)}
			<li>
				<a class="card" href={`/groups/${g.id}`}>
					<h2>{g.name}</h2>
					{#if g.description}
						<p class="desc">{g.description}</p>
					{/if}
					<div class="stats">
						<span class="chip">{g.total_members} member</span>
						<span class="chip">{g.total_participants} peserta</span>
						<span class="chip">{g.total_expenses} expense</span>
					</div>
				</a>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.page-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 24px;
	}

	.page-head h1 {
		font-family: var(--font-head);
		font-size: 20px;
	}

	.page-head p {
		color: var(--muted);
		margin-top: 6px;
	}

	.btn-inline {
		width: auto;
		white-space: nowrap;
	}

	.status {
		display: flex;
		align-items: center;
		gap: 10px;
		color: var(--muted);
		font-size: 14px;
	}

	.cards {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 18px;
	}

	.card {
		display: block;
		padding: 20px;
		background: var(--surface);
		border: 3px solid #000;
		box-shadow: var(--shadow);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		color: var(--text);
		text-decoration: none;
		transition: transform 0.12s ease, box-shadow 0.12s ease;
	}

	.card:hover {
		transform: translateY(-3px);
		box-shadow: 9px 9px 0 0 #000;
		text-decoration: none;
	}

	.card h2 {
		font-size: 17px;
		font-weight: 700;
		margin-bottom: 6px;
	}

	.desc {
		color: var(--muted);
		font-size: 13.5px;
		margin-bottom: 14px;
	}

	.stats {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 10px;
		max-width: 380px;
		padding: 48px 20px;
		margin: 0 auto;
		color: var(--muted);
	}

	.empty-mark {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 52px;
		height: 52px;
		border: 3px solid #000;
		border-radius: var(--radius-sm);
		background: var(--accent);
		box-shadow: 4px 4px 0 0 #000;
		color: #000;
		margin-bottom: 4px;
	}
</style>
