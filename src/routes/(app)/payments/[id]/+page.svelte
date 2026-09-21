<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Icon from '$lib/components/Icon.svelte';
	import { getPaymentMethods, updatePaymentMethod } from '$lib/api/paymentMethods';
	import { mapApiError } from '$lib/utils/errors';
	import { toast } from '$lib/stores/toast.svelte';
	import type { PaymentMethodSummary, Visibility } from '$lib/types/paymentMethod';

	const methodId = String(page.params.id);

	let method = $state<PaymentMethodSummary | null>(null);
	let loading = $state(true);
	let error = $state('');
	let notFound = $state(false);

	let provider_name = $state('');
	let account_name = $state('');
	let account_number = $state('');
	let qr_image_url = $state('');
	let visibility = $state<Visibility>('group_members');
	let saving = $state(false);

	$effect(() => {
		(async () => {
			loading = true;
			try {
				const data = await getPaymentMethods();
				const found = data.payment_methods.find((m) => m.id === methodId) ?? null;
				method = found;
				notFound = found === null;
				if (found) {
					provider_name = found.provider_name;
					account_name = found.account_name ?? '';
					qr_image_url = found.qr_image_url ?? '';
					visibility = found.visibility;
				}
			} catch (err) {
				notFound = true;
				error = mapApiError(err, 'Gagal memuat metode pembayaran.');
			} finally {
				loading = false;
			}
		})();
	});

	const typeLabel: Record<string, string> = { bank: 'Bank', ewallet: 'E-Wallet', qris: 'QRIS' };

	async function handleSave() {
		error = '';
		if (provider_name.trim().length < 1 || provider_name.trim().length > 100)
			return (error = 'Nama penyedia wajib diisi (maks. 100 karakter).');

		saving = true;
		try {
			await updatePaymentMethod(methodId, {
				provider_name: provider_name.trim(),
				account_name: account_name.trim() || undefined,
				account_number: account_number.trim() || undefined,
				qr_image_url: qr_image_url.trim() || undefined,
				visibility
			});
			toast.success('Metode pembayaran diperbarui.');
			await goto('/payments');
		} catch (err) {
			error = mapApiError(err, 'Gagal menyimpan perubahan.');
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Edit Metode — KejarBill</title>
</svelte:head>

<a href="/payments" class="back"><Icon name="chevron-right" size={16} /> Kembali</a>

{#if loading}
	<div class="status"><span class="spinner"></span> Memuat…</div>
{:else if notFound}
	<div class="alert alert-error" role="alert"><span>Metode pembayaran tidak ditemukan.</span></div>
{:else if method}
	<h1 class="page-title">Edit Metode Pembayaran</h1>

	<form class="card" onsubmit={(e) => { e.preventDefault(); handleSave(); }}>
		{#if error}
			<div class="alert alert-error" role="alert"><span>{error}</span></div>
		{/if}

		<div class="type-row">
			<span class="chip"><Icon name="bank" size={14} /> {typeLabel[method.method_type] ?? method.method_type}</span>
			<span class="hint">Tipe metode tidak dapat diubah.</span>
		</div>

		<label class="field">
			<span class="field-label">Nama penyedia</span>
			<input class="input" type="text" bind:value={provider_name} />
		</label>

		<label class="field">
			<span class="field-label">Nama pemilik (opsional)</span>
			<input class="input" type="text" bind:value={account_name} />
		</label>

		<label class="field">
			<span class="field-label">Nomor akun baru (opsional)</span>
			<input class="input" type="text" placeholder="{method.masked_account_number ?? 'cth: 1234567890'}" bind:value={account_number} />
			<span class="hint">Kosongkan jika tidak ingin mengubah. Tersimpan terenkripsi.</span>
		</label>

		{#if method.method_type === 'qris'}
			<label class="field">
				<span class="field-label">URL gambar QR (opsional)</span>
				<input class="input" type="url" placeholder="https://..." bind:value={qr_image_url} />
			</label>
		{/if}

		<fieldset class="field-group">
			<span class="field-label">Visibilitas</span>
			<div class="segmented">
				{#each ['private', 'group_members', 'debtor_only'] as v (v)}
					<button type="button" class:active={visibility === v} onclick={() => (visibility = v as Visibility)}>
						{v === 'private' ? 'Pribadi' : v === 'group_members' ? 'Anggota grup' : 'Hanya debitur'}
					</button>
				{/each}
			</div>
		</fieldset>

		<button class="btn btn-primary" type="submit" disabled={saving}>
			{#if saving}
				<span class="spinner"></span> Menyimpan…
			{:else}
				Simpan <Icon name="arrow-right" size={17} />
			{/if}
		</button>
	</form>
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

	.page-title {
		font-family: var(--font-head);
		font-size: 16px;
		margin-bottom: 20px;
	}

	.status {
		display: flex;
		align-items: center;
		gap: 10px;
		color: var(--muted);
		font-size: 14px;
	}

	.card {
		max-width: 520px;
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 28px;
		background: var(--surface);
		border: 3px solid #000;
		border-radius: var(--radius);
		box-shadow: var(--shadow);
	}

	.type-row {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.hint {
		font-size: 12.5px;
		color: var(--muted);
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin: 0;
		padding: 0;
		border: none;
	}

	.segmented {
		display: flex;
		gap: 6px;
		padding: 4px;
		background: var(--surface-2);
		border: 3px solid #000;
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
	}

	.segmented button.active {
		background: var(--accent);
		color: #000;
	}
</style>
