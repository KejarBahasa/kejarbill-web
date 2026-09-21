<script lang="ts">
	import { page } from '$app/state';
	import { getGroup } from '$lib/api/groups';
	import type { GroupDetail } from '$lib/types/group';

	let { children } = $props();

	let group = $state<GroupDetail | null>(null);
	let loading = $state(true);

	const id = $derived(String(page.params.id));

	$effect(() => {
		(async () => {
			loading = true;
			try {
				group = await getGroup(id);
			} catch (err) {
				group = null;
			} finally {
				loading = false;
			}
		})();
	});

	const tabs = $derived([
		{ href: `/groups/${id}`, label: 'Ringkasan', match: '' },
		{ href: `/groups/${id}/expenses`, label: 'Expense', match: '/expenses' },
		{ href: `/groups/${id}/settlements`, label: 'Settlement', match: '/settlements' },
		{ href: `/groups/${id}/members`, label: 'Anggota', match: '/members' }
	]);

	const currentPath = $derived(page.url.pathname);
	const activeMatch = $derived(
		(currentPath.replace(`/groups/${id}`, '') || '')
	);
</script>

<header class="group-head">
	<div>
		<h1>{group?.name ?? 'Grup'}</h1>
		{#if group?.description}
			<p class="desc">{group.description}</p>
		{/if}
		{#if group}
			<div class="stats">
				<span><strong>{group.total_members}</strong> member</span>
				<span><strong>{group.total_participants}</strong> peserta</span>
				<span><strong>{group.total_expenses}</strong> expense</span>
			</div>
		{/if}
	</div>
</header>

<nav class="tabs">
	{#each tabs as tab (tab.label)}
		<a
			href={tab.href}
			class:active={activeMatch === tab.match}
		>
			{tab.label}
		</a>
	{/each}
</nav>

{@render children()}

<style>
	.group-head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 16px;
		margin-bottom: 20px;
	}

	.group-head h1 {
		font-size: 28px;
		letter-spacing: -0.02em;
	}

	.desc {
		color: var(--muted);
		margin-top: 4px;
	}

	.stats {
		display: flex;
		gap: 20px;
		margin-top: 12px;
		font-size: 13.5px;
		color: var(--muted);
	}

	.stats strong {
		color: var(--text);
	}

	.tabs {
		display: flex;
		gap: 4px;
		border-bottom: 2px solid #000;
		margin-bottom: 24px;
	}

	.tabs a {
		padding: 10px 14px;
		color: var(--muted);
		font-size: 14px;
		font-weight: 600;
		text-decoration: none;
		border-bottom: 2px solid transparent;
		margin-bottom: -1px;
		transition: color 0.15s ease, border-color 0.15s ease;
	}

	.tabs a:hover {
		color: var(--text);
		text-decoration: none;
	}

	.tabs a.active {
		color: var(--accent-hi);
		border-bottom-color: var(--accent);
	}

	@media (max-width: 640px) {
		.tabs {
			overflow-x: auto;
		}

		.tabs a {
			white-space: nowrap;
		}
	}
</style>
