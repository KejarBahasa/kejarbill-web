<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { createPaymentMethod } from '$lib/api/paymentMethods';
	import { ApiError } from '$lib/types';
	import { toast } from '$lib/stores/toast.svelte';
	import type { MethodType, Visibility } from '$lib/types/paymentMethod';
	import { goto } from '$app/navigation';

	let method_type = $state<MethodType>('bank');
	let provider_name = $state('');
	let account_name = $state('');
	let account_number = $state('');
	let qr_image_url = $state('');
	let visibility = $state<Visibility>('group_members');
	let is_default = $state(false);
	let loading = $state(false);
	let error = $state('');

	async function handleSubmit() {
		error = '';
		if (provider_name.trim().length < 1 || provider_name.trim().length > 100)
			return (error = 'Nama penyedia wajib diisi (maks. 100 karakter).');

		loading = true;
		try {
			await createPaymentMethod({
				method_type,
				provider_name: provider_name.trim(),
				account_name: account_name.trim() || undefined,
				account_number: account_number.trim() || undefined,
				qr_image_url: qr_image_url.trim() || undefined,
				visibility,
				is_default
			});
			toast.success('Metode pembayaran disimpan.');
			await goto('/payments');
		} catch (err) {
			error = err instanceof ApiError ? err.message : 'Terjadi kesalahan. Coba lagi.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Tambah Metode — KejarBill</title>
</svelte:head>

<a href="/payments" class="back"><Icon name="chevron-right" size={16} /> Kembali</a>

<div class="page-head">
	<h1>Tambah Metode Pembayaran</h1>
	<p>Simpan detail rekening atau QRIS untuk memudahkan settlement.</p>
</div>

<form class="card" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
	{#if error}
		<div class="alert alert-error" role="alert">
			<span class="alert-icon"><Icon name="alert" size={17} /></span>
			<span>{error}</span>
		</div>
	{/if}

	<fieldset class="field-group">
		<span class="field-label">Jenis</span>
		<div class="segmented">
			{#each ['bank', 'ewallet', 'qris'] as t (t)}
				<button
					type="button"
					class:active={method_type === t}
					onclick={() => (method_type = t as MethodType)}
				>
					{t === 'bank' ? 'Bank' : t === 'ewallet' ? 'E-Wallet' : 'QRIS'}
				</button>
			{/each}
		</div>
	</fieldset>

	<label class="field">
		<span class="field-label">Nama penyedia</span>
		<input class="input" type="text" placeholder="cth: BCA, GoPay, QRIS" bind:value={provider_name} />
	</label>

	<label class="field">
		<span class="field-label">Nama pemilik (opsional)</span>
		<input class="input" type="text" placeholder="cth: Budi Santoso" bind:value={account_name} />
	</label>

	<label class="field">
		<span class="field-label">Nomor akun (opsional)</span>
		<input class="input" type="text" placeholder="cth: 1234567890" bind:value={account_number} />
	</label>

	{#if method_type === 'qris'}
		<label class="field">
			<span class="field-label">URL gambar QR (opsional)</span>
			<input class="input" type="url" placeholder="https://..." bind:value={qr_image_url} />
		</label>
	{/if}

	<fieldset class="field-group">
		<span class="field-label">Visibilitas</span>
		<div class="segmented">
			{#each ['private', 'group_members', 'debtor_only'] as v (v)}
				<button
					type="button"
					class:active={visibility === v}
					onclick={() => (visibility = v as Visibility)}
				>
					{v === 'private' ? 'Pribadi' : v === 'group_members' ? 'Anggota grup' : 'Hanya debitur'}
				</button>
			{/each}
		</div>
	</fieldset>

	<label class="check">
		<input type="checkbox" bind:checked={is_default} />
		<span>Jadikan metode default</span>
	</label>

	<button class="btn btn-primary" type="submit" disabled={loading}>
		{#if loading}
			<span class="spinner"></span> Menyimpan…
		{:else}
			Simpan <Icon name="arrow-right" size={17} />
		{/if}
	</button>
</form>

<style>
	.back {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 14px;
		transform: rotate(180deg);
		margin-bottom: 16px;
	}

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
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}

	.alert-icon {
		flex-shrink: 0;
		display: inline-flex;
		margin-top: 1px;
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: 7px;
		margin: 0;
		padding: 0;
		border: none;
	}

	.field-label {
		font-size: 13.5px;
		font-weight: 600;
		color: var(--text-2);
	}

	.segmented {
		display: flex;
		gap: 6px;
		padding: 4px;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
	}

	.segmented button {
		flex: 1;
		padding: 9px 12px;
		background: transparent;
		border: none;
		border-radius: 7px;
		color: var(--text-2);
		font-size: 13.5px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s ease, color 0.15s ease;
	}

	.segmented button.active {
		background: var(--accent);
		color: #fff;
	}

	.check {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
		color: var(--text-2);
		cursor: pointer;
	}
</style>
