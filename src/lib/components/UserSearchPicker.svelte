<script lang="ts">
	import Icon from './Icon.svelte';
	import { searchUsers } from '$lib/api/users';
	import type { PublicUser } from '$lib/types/user';

	interface Props {
		multiple?: boolean;
		busy?: boolean;
		addLabel?: string;
		placeholder?: string;
		onPick: (users: PublicUser[]) => void | Promise<void>;
	}

	let {
		multiple = false,
		busy = false,
		addLabel = 'Tambah',
		placeholder = 'Cari nama atau username...',
		onPick
	}: Props = $props();

	let query = $state('');
	let results = $state<PublicUser[]>([]);
	let searching = $state(false);
	let notFound = $state(false);
	let selected = $state<PublicUser[]>([]);
	let timer: ReturnType<typeof setTimeout>;

	function onInput() {
		clearTimeout(timer);
		results = [];
		notFound = false;
		const q = query.trim();
		if (q.length < 2) return;
		timer = setTimeout(async () => {
			searching = true;
			try {
				const data = await searchUsers(q);
				results = data.users;
				notFound = data.users.length === 0;
			} catch {
				results = [];
			} finally {
				searching = false;
			}
		}, 300);
	}

	function isSelected(u: PublicUser) {
		return selected.some((s) => s.id === u.id);
	}

	function toggle(u: PublicUser) {
		selected = isSelected(u) ? selected.filter((s) => s.id !== u.id) : [...selected, u];
	}

	async function pickSingle(u: PublicUser) {
		await onPick([u]);
		query = '';
		results = [];
	}

	async function pickMany() {
		if (selected.length === 0) return;
		await onPick(selected);
		selected = [];
		query = '';
		results = [];
	}
</script>

<div class="picker">
	<div class="input-wrap">
		<span class="input-icon"><Icon name="user" size={16} /></span>
		<input
			class="input input-with-icon"
			type="text"
			{placeholder}
			bind:value={query}
			oninput={onInput}
		/>
	</div>

	{#if searching}
		<div class="status"><span class="spinner"></span> Mencari…</div>
	{:else if notFound}
		<p class="hint">User tidak ditemukan.</p>
	{:else if results.length > 0}
		<ul class="results">
			{#each results as u (u.id)}
				<li>
					{#if multiple}
						<input
							type="checkbox"
							class="cbox"
							checked={isSelected(u)}
							onchange={() => toggle(u)}
							aria-label="Pilih {u.name}"
						/>
					{/if}
					<span class="avatar">{u.name.slice(0, 1).toUpperCase()}</span>
					<span class="u-body">
						<strong>{u.name}</strong>
						<span class="u-sub">@{u.username}</span>
					</span>
					{#if !multiple}
						<button class="btn btn-primary btn-mini" onclick={() => pickSingle(u)} disabled={busy}>
							Pilih
						</button>
					{/if}
				</li>
			{/each}
		</ul>
	{:else}
		<p class="hint">Ketik minimal 2 karakter untuk mencari user terdaftar.</p>
	{/if}

	{#if multiple}
		<button class="btn btn-primary" onclick={pickMany} disabled={busy || selected.length === 0}>
			{addLabel}{selected.length > 0 ? ` (${selected.length})` : ''}
		</button>
	{/if}
</div>

<style>
	.picker {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.status {
		display: flex;
		align-items: center;
		gap: 10px;
		color: var(--muted);
		font-size: 14px;
	}

	.hint {
		font-size: 13px;
		color: var(--muted);
	}

	.results {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.results li {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px;
		border: 2px solid var(--surface-2);
		border-radius: var(--radius-sm);
	}

	.cbox {
		width: 18px;
		height: 18px;
		accent-color: #000;
	}

	.avatar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		flex-shrink: 0;
		border: 2px solid #000;
		border-radius: 50%;
		background: var(--accent);
		color: #000;
		font-weight: 700;
	}

	.u-body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.u-body strong {
		font-size: 14px;
	}

	.u-sub {
		font-size: 12.5px;
		color: var(--muted);
	}

	.btn-mini {
		width: auto;
		padding: 6px 12px;
		font-size: 13px;
	}
</style>
