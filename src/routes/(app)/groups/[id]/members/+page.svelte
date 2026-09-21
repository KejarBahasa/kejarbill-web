<script lang="ts">
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import UserSearchPicker from '$lib/components/UserSearchPicker.svelte';
	import { getGroupParticipants, addMembersBulk, addGuests, claimGuest } from '$lib/api/groups';
	import { mapApiError } from '$lib/utils/errors';
	import { toast } from '$lib/stores/toast.svelte';
	import type { Participant, GroupRole } from '$lib/types/group';
	import type { PublicUser } from '$lib/types/user';

	const id = String(page.params.id);

	let participants = $state<Participant[]>([]);
	let loading = $state(true);
	let error = $state('');
	let addingMembers = $state(false);
	let addingGuests = $state(false);
	let claimFor = $state('');
	let claiming = $state(false);
	let guestsInput = $state('');

	const roleLabels: Record<GroupRole, string> = { owner: 'Owner', admin: 'Admin', member: 'Member' };

	const self = $derived(participants.find((p) => p.is_self));
	const canManage = $derived(self?.role === 'owner' || self?.role === 'admin');

	async function load() {
		loading = true;
		try {
			participants = (await getGroupParticipants(id)).participants;
		} catch (err) {
			participants = [];
			error = mapApiError(err, 'Gagal memuat anggota.');
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		void load();
	});

	async function handleAddMembers(users: PublicUser[]) {
		error = '';
		addingMembers = true;
		try {
			await addMembersBulk(id, { user_ids: users.map((u) => u.id) });
			toast.success(`${users.length} member berhasil ditambahkan.`);
			await load();
		} catch (err) {
			error = mapApiError(err, 'Gagal menambah member.');
		} finally {
			addingMembers = false;
		}
	}

	async function handleAddGuests() {
		error = '';
		const names = guestsInput.split(',').map((n) => n.trim()).filter(Boolean);
		if (names.length < 1) return (error = 'Masukkan minimal satu nama tamu.');
		addingGuests = true;
		try {
			await addGuests(id, { guests: names.map((display_name) => ({ display_name })) });
			guestsInput = '';
			toast.success(`${names.length} tamu berhasil ditambahkan.`);
			await load();
		} catch (err) {
			error = mapApiError(err, 'Gagal menambah tamu.');
		} finally {
			addingGuests = false;
		}
	}

	async function handleClaim(user: PublicUser[]) {
		error = '';
		claiming = true;
		try {
			await claimGuest(id, claimFor, { user_id: user[0].id });
			toast.success('Tamu berhasil di-claim.');
			claimFor = '';
			await load();
		} catch (err) {
			error = mapApiError(err, 'Gagal claim tamu.');
		} finally {
			claiming = false;
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
			<ul class="plist">
				{#each participants as p (p.id)}
					<li class="prow">
						<span class="avatar">{p.display_name.slice(0, 1).toUpperCase()}</span>
						<div class="p-body">
							<strong>{p.display_name}</strong>
							{#if p.participant_type === 'guest'}
								<span class="tag">Tamu</span>
							{:else if p.role}
								<span class="tag {p.role}">{roleLabels[p.role]}</span>
							{/if}
							{#if p.is_self}
								<span class="tag self">Kamu</span>
							{/if}
						</div>
						{#if canManage && p.participant_type === 'guest'}
							<button
								class="btn-claim"
								onclick={() => (claimFor = claimFor === p.id ? '' : p.id)}
							>
								Jadikan Member
							</button>
						{/if}
					</li>
					{#if claimFor === p.id}
						<div class="claim-box">
							<p class="muted">Klaim <strong>{p.display_name}</strong> sebagai user terdaftar:</p>
							<UserSearchPicker busy={claiming} onPick={handleClaim} />
						</div>
					{/if}
				{/each}
			</ul>
		{/if}
	</section>

	<div class="stack">
		<section class="block">
			<h2 class="block-title">Tambah Member</h2>
			{#if canManage}
				<UserSearchPicker multiple busy={addingMembers} addLabel="Tambah Member" onPick={handleAddMembers} />
			{:else}
				<p class="hint muted">Hanya owner/admin yang bisa menambah member.</p>
			{/if}
		</section>

		<section class="block">
			<h2 class="block-title">Tambah Tamu</h2>
			<input class="input" type="text" placeholder="cth: Dewi, Rina" bind:value={guestsInput} />
			<p class="hint muted">Pisahkan beberapa nama dengan koma.</p>
			<button class="btn btn-primary" onclick={handleAddGuests} disabled={addingGuests}>
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

	.plist {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.prow {
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

	.p-body {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.p-body strong {
		font-size: 14.5px;
	}

	.tag {
		font-size: 11px;
		font-weight: 700;
		padding: 2px 8px;
		border: 2px solid #000;
		border-radius: 999px;
		background: var(--surface-2);
		color: var(--text-2);
	}

	.tag.owner {
		background: var(--danger);
		color: #fff;
	}

	.tag.admin {
		background: var(--accent);
		color: #000;
	}

	.tag.self {
		background: var(--success);
		color: #000;
	}

	.btn-claim {
		margin-left: auto;
		padding: 6px 10px;
		background: var(--surface);
		border: 2px solid #000;
		border-radius: var(--radius-sm);
		font-size: 12.5px;
		font-weight: 700;
		box-shadow: 3px 3px 0 0 #000;
		transition: transform 0.12s ease, box-shadow 0.12s ease;
	}

	.btn-claim:hover {
		transform: translate(1px, 1px);
		box-shadow: 2px 2px 0 0 #000;
	}

	.claim-box {
		padding: 12px;
		border: 2px dashed #000;
		border-radius: var(--radius-sm);
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	@media (max-width: 720px) {
		.cols {
			grid-template-columns: 1fr;
		}
	}
</style>
