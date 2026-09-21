<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { createGroup } from '$lib/api/groups';
	import { ApiError } from '$lib/types';
	import { toast } from '$lib/stores/toast.svelte';
	import { goto } from '$app/navigation';

	let name = $state('');
	let description = $state('');
	let loading = $state(false);
	let error = $state('');

	async function handleSubmit() {
		error = '';
		if (name.trim().length < 1) return (error = 'Nama grup wajib diisi.');
		if (name.trim().length > 100) return (error = 'Nama grup maksimal 100 karakter.');
		if (description.length > 255) return (error = 'Deskripsi maksimal 255 karakter.');

		loading = true;
		try {
			const data = await createGroup({
				name: name.trim(),
				description: description.trim() || undefined
			});
			toast.success('Grup dibuat.');
			await goto(`/groups/${data.group_id}`);
		} catch (err) {
			error = err instanceof ApiError ? err.message : 'Terjadi kesalahan. Coba lagi.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Buat Grup — KejarBill</title>
</svelte:head>

<div class="page-head">
	<h1>Buat Grup Baru</h1>
	<p>Buat ruang untuk berbagi tagihan dengan teman, keluarga, atau rekan.</p>
</div>

<form class="card" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
	{#if error}
		<div class="alert alert-error" role="alert">
			<span class="alert-icon"><Icon name="alert" size={17} /></span>
			<span>{error}</span>
		</div>
	{/if}

	<label class="field">
		<span class="field-label">Nama grup</span>
		<input class="input" type="text" placeholder="cth: Liburan Bali" bind:value={name} />
	</label>

	<label class="field">
		<span class="field-label">Deskripsi (opsional)</span>
		<textarea class="input textarea" rows="3" placeholder="cth: Bareng keluarga" bind:value={description}></textarea>
	</label>

	<button class="btn btn-primary" type="submit" disabled={loading}>
		{#if loading}
			<span class="spinner"></span> Membuat…
		{:else}
			Buat Grup <Icon name="arrow-right" size={17} />
		{/if}
	</button>
</form>

<style>
	.page-head h1 {
		font-size: 28px;
		letter-spacing: -0.02em;
		margin-bottom: 4px;
	}

	.page-head p {
		color: var(--muted);
		margin-bottom: 20px;
	}

	.card {
		max-width: 520px;
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 28px;
		background: var(--surface);
		border: 3px solid #000;
		box-shadow: var(--shadow);
		border-radius: var(--radius);
	}

	.alert-icon {
		flex-shrink: 0;
		display: inline-flex;
		margin-top: 1px;
	}

	.textarea {
		resize: vertical;
	}
</style>
