<script lang="ts">
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import { getGroupParticipants, addMember, addGuests } from '$lib/api/groups';
	import { searchUsers } from '$lib/api/users';
	import { ApiError } from '$lib/types';
	import { toast } from '$lib/stores/toast.svelte';
	import type { Participant } from '$lib/types/group';
	import type { PublicUser } from '$lib/types/user';

	const id = String(page.params.id);

	let participants = $state<Participant[]>([]);
	let loading = $state(true);
	let error = $state('');

	let query = $state('');
	let results = $state<PublicUser[]>([]);
	let searching = $state(false);
	let notFound = $state(false);
	let addingUserId = $state('');
	let guestsInput = $state('');
	let submitting = $state(false);

	let timer: ReturnType<typeof setTimeout>;

	async function load() {
		loading = true;
		error = '';
		try {
			participants = (await getGroupParticipants(id)).participants;
		} catch (err) {
			participants = [];
			error = err instanceof ApiError ? err.message : 'Gagal memuat anggota.';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		void load();
		return () => clearTimeout(timer);
	});

	function onQueryInput() {
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

	const memberUserIds = $derived(new Set(participants.map((p) => p.user_id).filter(Boolean)));

	async function pick(u: PublicUser) {
		addingUserId = u.id;
		try {
			await addMember(id, { user_id: u.id });
			query = '';
			results = [];
			notFound = false;
			toast.success(`${u.name} ditambahkan sebagai member.`);
			await load();
		} catch (err) {
			error = err instanceof ApiError ? err.message : 'Gagal menambah member.';
		} finally {
			addingUserId = '';
		}
	}

	async function handleAddGuests() {
		error = '';
		const names = guestsInput.split(',').map((n) => n.trim()).filter(Boolean);
		if (names.length < 1) return (error = 'Masukkan minimal satu nama tamu.');
		submitting = true;
		try {
			await addGuests(id, { guests: names.map((display_name) => ({ display_name })) });
			guestsInput = '';
			toast.success(`${names.length} tamu berhasil ditambahkan.`);
			await load();
		} catch (err) {
			error = err instanceof ApiError ? err.message : 'Gagal menambah tamu.';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Anggota — KejarBill</title>
</svelte:head>

{#if error}
	<div class="alert alert-error" role="alert"><span>{error}</span></div>
{/if}

<div class="cols">
	<section class="block">
		<h2 class="block-title">Peserta ({participants.length})</h2>
		{#if loading}
			<div class="status"><span class="spinner"></span> Memuat…</div>
		{:else if participants.length === 0}
			<p class="muted">Belum ada peserta.</p>
		{:else}
			<ul class="list">
				{#each participants as p (p.id)}
					<li>
						<span class="avatar">{p.display_name.slice(0, 1).toUpperCase()}</span>
						<div class="p-body">
							<strong>{p.display_name}</strong>
							<span class="p-tag">{p.participant_type === 'member' ? 'Member' : 'Tamu'}</span>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<div class="stack">
		<section class="block">
			<h2 class="block-title">Tambah Member</h2>
			<div class="input-wrap">
				<span class="input-icon"><Icon name="user" size={16} /></span>
				<input
					class="input input-with-icon"
					type="text"
					placeholder="Cari nama atau username..."
					bind:value={query}
					oninput={onQueryInput}
				/>
			</div>

			{#if searching}
				<div class="status"><span class="spinner"></span> Mencari…</div>
			{:else if notFound}
				<p class="hint muted">User tidak ditemukan.</p>
			{:else if results.length > 0}
				<ul class="results">
					{#each results as u (u.id)}
						<li>
							<span class="avatar sm">{u.name.slice(0, 1).toUpperCase()}</span>
							<span class="u-body">
								<strong>{u.name}</strong>
								<span class="u-sub">@{u.username}</span>
							</span>
							<button
								class="btn btn-primary btn-mini"
								onclick={() => pick(u)}
								disabled={addingUserId === u.id || memberUserIds.has(u.id)}
							>
								{#if memberUserIds.has(u.id)}
									Sudah
								{:else}
									<Icon name="plus" size={14} />
								{/if}
							</button>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="hint muted">Ketik minimal 2 karakter untuk mencari user terdaftar.</p>
			{/if}
		</section>

		<section class="block">
			<h2 class="block-title">Tambah Tamu</h2>
			<input class="input" type="text" placeholder="cth: Dewi, Rina" bind:value={guestsInput} />
			<p class="hint muted">Pisahkan beberapa nama dengan koma.</p>
			<button class="btn btn-primary full" onclick={handleAddGuests} disabled={submitting}>
				Tambah Tamu
			</button>
		</section>
	</div>
</div>

<style>
	.cols {
		display: grid;
		grid-template-columns: 1.4fr 1fr;
		gap: 20px;
		align-items: start;
	}

	.stack {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.block {
		background: var(--surface);
		border: 3px solid #000;
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.block-title {
		font-size: 14px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.muted {
		color: var(--muted);
	}

	.hint {
		font-size: 13px;
	}

	.status {
		display: flex;
		align-items: center;
		gap: 10px;
		color: var(--muted);
		font-size: 14px;
	}

	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.list li {
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

	.avatar.sm {
		width: 32px;
		height: 32px;
		font-size: 14px;
	}

	.p-body {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.p-body strong {
		font-size: 14.5px;
	}

	.p-tag {
		font-size: 11px;
		font-weight: 700;
		padding: 2px 8px;
		border: 2px solid #000;
		border-radius: 999px;
		background: var(--surface-2);
		color: var(--text-2);
	}

	.input-icon {
		left: 12px;
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
		padding: 6px 10px;
		font-size: 13px;
	}

	.full {
		width: 100%;
	}

	@media (max-width: 720px) {
		.cols {
			grid-template-columns: 1fr;
		}
	}
</style>
