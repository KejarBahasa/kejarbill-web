<script lang="ts">
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import { getGroupBalances, getGroupParticipants } from '$lib/api/groups';
	import { getGroupSettlements, createSettlement } from '$lib/api/settlements';
	import { getRecipientPaymentMethods, revealRecipientPaymentMethod } from '$lib/api/paymentMethods';
	import { toast } from '$lib/stores/toast.svelte';
	import { mapApiError } from '$lib/utils/errors';
	import { formatIDR, formatDateShort, jakartaInputToISO } from '$lib/utils/format';
	import type { Balance, Participant } from '$lib/types/group';
	import type { SettlementSummary, PaymentChannel } from '$lib/types/settlement';
	import type { PaymentMethodSummary } from '$lib/types/paymentMethod';

	const id = String(page.params.id);

	let settlements = $state<SettlementSummary[]>([]);
	let participants = $state<Participant[]>([]);
	let balances = $state<Balance[]>([]);
	let recipientMethods = $state<PaymentMethodSummary[]>([]);
	let loading = $state(true);
	let loadingMore = $state(false);
	let loadingMethods = $state(false);
	let listError = $state('');
	let error = $state('');
	let pageNum = $state(1);
	let totalPages = $state(1);
	let totalItems = $state(0);

	let from_participant_id = $state('');
	let to_participant_id = $state('');
	let payment_channel = $state<PaymentChannel>('cash');
	let payment_method_id = $state('');
	let amount = $state(0);
	let notes = $state('');
	let paid_at = $state(new Date().toISOString().slice(0, 10));
	let submitting = $state(false);
	let copyingMethodId = $state('');
	let revealingMethodId = $state('');
	let revealedAccounts = $state<Record<string, { accountNumber: string; expiresAt: number }>>({});
	let showPaymentModal = $state(false);
	let paymentMethodsReload = $state(0);
	let idemKey = $state(crypto.randomUUID());
	const revealTimers = new Map<string, ReturnType<typeof setTimeout>>();
	const revealTtlMs = 5 * 60 * 1000;

	const methodOptions = $derived(
		payment_channel === 'cash'
			? []
			: recipientMethods.filter(
					(m) => m.method_type === (payment_channel === 'bank_transfer' ? 'bank' : 'ewallet')
				)
	);

	const hasMore = $derived(settlements.length < totalItems);

	const selfP = $derived(participants.find((p) => p.is_self));
	const canManage = $derived(selfP?.role === 'owner' || selfP?.role === 'admin');

	const payableBalances = $derived(
		balances
			.filter((balance) => {
				if (selfP && balance.from_participant.id === selfP.id) return true;
				return canManage && participants.some(
					(p) => p.id === balance.from_participant.id && p.participant_type === 'guest'
				);
			})
			.sort((a, b) => b.amount - a.amount)
	);

	const selectedPayee = $derived(
		participants.find((participant) => participant.id === to_participant_id)
	);

	const selectedPayer = $derived(
		participants.find((participant) => participant.id === from_participant_id)
	);

	async function load() {
		loading = true;
		listError = '';
		pageNum = 1;
		try {
			const [s, p, b] = await Promise.all([
				getGroupSettlements(id, 1),
				getGroupParticipants(id),
				getGroupBalances(id)
			]);
			settlements = s.data.settlements;
			totalItems = s.meta?.pagination?.total_items ?? s.data.settlements.length;
			totalPages = s.meta?.pagination?.total_pages ?? 1;
			participants = p.participants;
			balances = b;
			const me = participants.find((x) => x.is_self);
			const presetTo = page.url.searchParams.get('to');
			const presetAmount = Number(page.url.searchParams.get('amount'));
			const validPreset = presetTo && p.participants.some((x) => x.id === presetTo && x.id !== me?.id);
			const other = participants.find((x) => !x.is_self);
			from_participant_id = me?.id ?? participants[0]?.id ?? '';
			to_participant_id = validPreset ? presetTo : (other?.id ?? participants[1]?.id ?? '');
			amount = Number.isFinite(presetAmount) && presetAmount > 0 ? presetAmount : 0;
		} catch (err) {
			settlements = [];
			participants = [];
			balances = [];
			listError = mapApiError(err, 'Gagal memuat data settlement.');
		} finally {
			loading = false;
		}
	}

	function startPayment(balance: Balance) {
		from_participant_id = balance.from_participant.id;
		to_participant_id = balance.to_participant.id;
		amount = balance.amount;
		payment_channel = 'bank_transfer';
		payment_method_id = '';
		clearRevealedAccounts();
		revealingMethodId = '';
		notes = '';
		paid_at = new Date().toISOString().slice(0, 10);
		error = '';
		paymentMethodsReload += 1;
		showPaymentModal = true;
	}

	function closePaymentModal() {
		if (submitting) return;
		showPaymentModal = false;
		error = '';
		clearRevealedAccounts();
		revealingMethodId = '';
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && showPaymentModal) closePaymentModal();
	}

	$effect(() => {
		void load();
	});

	// muat metode pembayaran penerima saat channel non-cash atau penerima berubah
	$effect(() => {
		const recipient = to_participant_id;
		const reload = paymentMethodsReload;
		void reload;
		if (payment_channel === 'cash' || !recipient) {
			recipientMethods = [];
			return;
		}
		loadingMethods = true;
		payment_method_id = '';
		clearRevealedAccounts();
		revealingMethodId = '';
		getRecipientPaymentMethods(id, recipient)
			.then((res) => {
				recipientMethods = res.payment_methods;
				const expectedType = payment_channel === 'bank_transfer' ? 'bank' : 'ewallet';
				const defaultMethod = res.payment_methods.find(
					(method) => method.is_default && method.method_type === expectedType
				);
				payment_method_id = defaultMethod?.id ?? '';
			})
			.catch(() => (recipientMethods = []))
			.finally(() => (loadingMethods = false));
	});

	async function loadMore() {
		loadingMore = true;
		try {
			const s = await getGroupSettlements(id, pageNum + 1);
			pageNum += 1;
			settlements = [...settlements, ...s.data.settlements];
		} catch (err) {
			listError = mapApiError(err, 'Gagal memuat data settlement.');
		} finally {
			loadingMore = false;
		}
	}

	async function revealAccountNumber(method: PaymentMethodSummary) {
		revealingMethodId = method.id;
		try {
			const { account_number } = await revealRecipientPaymentMethod(id, to_participant_id, method.id);
			if (revealTimers.has(method.id)) clearTimeout(revealTimers.get(method.id));
			const expiresAt = Date.now() + revealTtlMs;
			revealedAccounts = { ...revealedAccounts, [method.id]: { accountNumber: account_number, expiresAt } };
			revealTimers.set(method.id, setTimeout(() => {
				if (revealedAccounts[method.id]?.expiresAt !== expiresAt) return;
				const next = { ...revealedAccounts };
				delete next[method.id];
				revealedAccounts = next;
				revealTimers.delete(method.id);
			}, revealTtlMs));
			payment_method_id = method.id;
		} catch (err) {
			error = mapApiError(err, 'Nomor rekening tidak dapat ditampilkan.');
		} finally {
			revealingMethodId = '';
		}
	}

	async function copyAccountNumber(method: PaymentMethodSummary) {
		const revealed = revealedAccounts[method.id];
		if (!revealed) return;
		copyingMethodId = method.id;
		try {
			await navigator.clipboard.writeText(revealed.accountNumber);
			toast.success('Nomor rekening disalin.');
		} catch {
			error = 'Nomor rekening tidak dapat disalin oleh browser ini.';
		} finally {
			copyingMethodId = '';
		}
	}

	function pickChannel(c: PaymentChannel) {
		payment_channel = c;
		payment_method_id = '';
		clearRevealedAccounts();
		revealingMethodId = '';
	}

	function clearRevealedAccounts() {
		for (const timer of revealTimers.values()) clearTimeout(timer);
		revealTimers.clear();
		revealedAccounts = {};
	}

	async function handleSubmit() {
		error = '';
		if (!from_participant_id || !to_participant_id) return (error = 'Pilih pengirim dan penerima.');
		if (from_participant_id === to_participant_id) return (error = 'Pengirim dan penerima tidak boleh sama.');
		if (!amount || amount <= 0) return (error = 'Jumlah wajib lebih dari 0.');
		if (payment_channel !== 'cash') {
			if (!payment_method_id) return (error = 'Pilih metode pembayaran untuk transfer bank / e-wallet.');
			if (!methodOptions.some((m) => m.id === payment_method_id)) {
				payment_method_id = '';
				return (error = 'Metode pembayaran tidak cocok dengan saluran yang dipilih.');
			}
		}
		submitting = true;
		try {
			await createSettlement(
				id,
				{
					from_participant_id,
					to_participant_id,
					payment_channel,
					payment_method_id: payment_channel === 'cash' ? undefined : payment_method_id,
					notes: notes.trim() || undefined,
					paid_at: jakartaInputToISO(`${paid_at}T00:00`),
					amount
				},
				idemKey
			);
			idemKey = crypto.randomUUID();
			toast.success('Settlement berhasil dicatat.');
			await load();
			showPaymentModal = false;
		} catch (err) {
			error = mapApiError(err, 'Gagal mencatat settlement.');
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Settlement — KejarBill</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<div class="cols">
		<section class="block">
			<h2 class="block-title">Utang yang Perlu Dibayar</h2>
			{#if payableBalances.length === 0}
				<div class="empty-payable">
					<span class="empty-icon"><Icon name="check-circle" size={18} /></span>
					<div>
						<strong>Semua sudah beres</strong>
						<p class="muted">Tidak ada utang yang perlu dibayar.</p>
					</div>
				</div>
			{:else}
				<ul class="payable-list">
				{#each payableBalances as balance (balance.from_participant.id + balance.to_participant.id)}
					<li class="payable-item">
						<div class="payable-copy">
							<span class="payable-kicker">
								{balance.from_participant.id === selfP?.id
									? 'Kamu berutang kepada'
									: `${balance.from_participant.display_name} membayar kepada`}
							</span>
							<strong>{balance.to_participant.display_name}</strong>
							<span class="payable-amount">{formatIDR(balance.amount)}</span>
						</div>
						<button class="btn btn-primary btn-pay" type="button" onclick={() => startPayment(balance)}>
							<Icon name="wallet" size={15} />
							Bayar
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="block">
		<h2 class="block-title">Riwayat Settlement</h2>
		{#if listError}
			<div class="alert alert-error" role="alert"><span>{listError}</span></div>
		{/if}
		{#if loading}
			<div class="status"><span class="spinner"></span> Memuat…</div>
		{:else if settlements.length === 0}
			<p class="muted">Belum ada settlement.</p>
		{:else}
			<ul class="list">
				{#each settlements as s (s.id)}
					<li>
						<a class="row" href={`/groups/${id}/settlements/${s.id}`}>
							<span class="s-icon"><Icon name="arrow-right" size={16} /></span>
							<span class="s-body">
								<strong>{s.from_participant.display_name} → {s.to_participant.display_name}</strong>
								<span class="s-sub">{formatDateShort(s.settlement_date)}</span>
							</span>
							<strong class="s-amount">{formatIDR(s.amount)}</strong>
						</a>
					</li>
				{/each}
			</ul>
			<div class="pager">
				<span class="muted">{settlements.length} dari {totalItems}</span>
				{#if hasMore}
					<button class="btn btn-ghost btn-mini" onclick={loadMore} disabled={loadingMore}>
						Muat lagi
					</button>
				{/if}
			</div>
		{/if}
	</section>

</div>

{#if showPaymentModal}
	<div class="modal-backdrop" role="presentation" onclick={(event) => event.target === event.currentTarget && closePaymentModal()}>
		<dialog open class="payment-modal" aria-labelledby="payment-modal-title">
			<div class="modal-head">
				<div>
					<span class="modal-kicker">Catat pelunasan</span>
					<h2 id="payment-modal-title">Tandai sudah dibayar</h2>
				</div>
				<button class="modal-close" type="button" aria-label="Tutup" onclick={closePaymentModal} disabled={submitting}>
					<Icon name="x" size={19} />
				</button>
			</div>

			<div class="payment-route">
				<div><span>{selectedPayer?.participant_type === 'guest' ? 'Tamu' : 'Dari'}</span><strong>{selectedPayer?.display_name ?? '—'}</strong></div>
				<Icon name="arrow-right" size={18} />
				<div><span>Kepada</span><strong>{selectedPayee?.display_name ?? '—'}</strong></div>
			</div>

			<div class="locked-amount">
				<span>Total yang dicatat</span>
				<strong>{formatIDR(amount)}</strong>
				<small>Nominal penuh dari saldo utang. Pembayaran sebagian belum dicatat di flow ini.</small>
			</div>

			<form class="modal-form" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
				<label class="field">
					<span class="field-label">Tanggal pembayaran</span>
					<input class="input" type="date" bind:value={paid_at} />
				</label>

				<fieldset class="field-group">
					<span class="field-label">Cara pembayaran</span>
					<div class="segmented">
						{#each ([['bank_transfer', 'Transfer'], ['ewallet', 'E-Wallet'], ['cash', 'Tunai']]) as [c, label] (c)}
							<button type="button" class:active={payment_channel === c} onclick={() => pickChannel(c as PaymentChannel)}>{label}</button>
						{/each}
					</div>
				</fieldset>

				{#if payment_channel !== 'cash'}
					<div class="method-section">
						<span class="field-label">Pilih metode pembayaran</span>
						{#if loadingMethods}
							<p class="hint muted">Memuat metode pembayaran penerima…</p>
						{:else if methodOptions.length > 0}
							<div class="method-options">
								{#each methodOptions as m (m.id)}
									<div
										class="method-option-row"
										class:selected={payment_method_id === m.id}
										role="button"
										tabindex="0"
										aria-pressed={payment_method_id === m.id}
										onclick={() => (payment_method_id = m.id)}
										onkeydown={(event) => {
											if (event.key === 'Enter' || event.key === ' ') {
												event.preventDefault();
												payment_method_id = m.id;
											}
										}}
									>
										<div class="method-option">
											<strong>{m.provider_name}</strong>
											<span>{m.account_name}</span>
											<span class="account-number">{revealedAccounts[m.id]?.accountNumber ?? m.masked_account_number ?? 'Metode penerima'}</span>
										</div>
										<div class="method-actions">
											{#if revealedAccounts[m.id]}
												<button type="button" class="btn-mini copy-method" onclick={(event) => { event.stopPropagation(); copyAccountNumber(m); }} disabled={copyingMethodId === m.id} aria-label="Salin nomor rekening" title="Salin nomor rekening">
													{#if copyingMethodId === m.id}<span class="spinner"></span>{:else}<Icon name="copy" size={15} />{/if}
												</button>
											{:else}
													<button type="button" class="btn-mini reveal-method" onclick={(event) => { event.stopPropagation(); revealAccountNumber(m); }} disabled={revealingMethodId === m.id} aria-label="Tampilkan nomor rekening" title="Tampilkan nomor rekening">
														{#if revealingMethodId === m.id}<span class="spinner"></span>{:else}<Icon name="eye" size={16} />{/if}
													</button>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<p class="hint muted">Penerima belum membagikan metode {payment_channel === 'bank_transfer' ? 'bank' : 'e-wallet'} yang terlihat untukmu.</p>
						{/if}
					</div>
				{/if}

				<label class="field">
					<span class="field-label">Catatan (opsional)</span>
					<input class="input" type="text" placeholder="cth: Sudah transfer BCA" bind:value={notes} />
				</label>

				{#if error}
					<div class="alert alert-error" role="alert"><span class="alert-icon"><Icon name="alert" size={17} /></span><span>{error}</span></div>
				{/if}

				<div class="modal-actions">
					<button class="btn btn-ghost" type="button" onclick={closePaymentModal} disabled={submitting}>Batal</button>
					<button class="btn btn-primary" type="submit" disabled={submitting}>
						{#if submitting}<span class="spinner"></span> Menyimpan…{:else}<Icon name="check-circle" size={17} /> Tandai sudah dibayar{/if}
					</button>
				</div>
			</form>
		</dialog>
	</div>
{/if}

<style>
	.cols {
		display: grid;
		grid-template-columns: 1.2fr 1fr;
		gap: 20px;
		align-items: start;
	}

	.block {
		background: var(--surface);
		border: 3px solid #000;
		box-shadow: var(--shadow);
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
	}

	.alert-icon {
		flex-shrink: 0;
		display: inline-flex;
		margin-top: 1px;
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
		gap: 10px;
	}

	.list li {
		display: flex;
		align-items: center;
		gap: 12px;
		padding-bottom: 10px;
		border-bottom: 2px solid #000;
	}

	.list li:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.payable-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.payable-item {
		display: flex;
		align-items: center;
		gap: 12px;
		min-height: 66px;
		padding-bottom: 10px;
		border-bottom: 2px solid #000;
	}

	.payable-item:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.payable-copy {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.payable-kicker {
		font-size: 12px;
		font-weight: 600;
		color: var(--muted);
	}

	.payable-copy strong {
		font-size: 15px;
	}

	.payable-amount {
		font-size: 14px;
		font-weight: 700;
		color: var(--danger);
	}

	.payable-item .btn {
		width: auto;
		padding: 9px 14px;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.empty-payable {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 0 4px;
	}

	.empty-payable p {
		margin-top: 3px;
		font-size: 13px;
	}

	.empty-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 34px;
		height: 34px;
		flex-shrink: 0;
		border: 2px solid #000;
		border-radius: 50%;
		background: var(--success);
		color: #000;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		color: inherit;
		text-decoration: none;
	}

	.row:hover {
		text-decoration: none;
	}

	.s-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		flex-shrink: 0;
		border-radius: 9px;
		background: rgba(52, 211, 153, 0.12);
		color: var(--success);
	}

	.s-body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.s-body strong {
		font-size: 14px;
	}

	.s-sub {
		font-size: 13px;
		color: var(--muted);
	}

	.s-amount {
		font-size: 14px;
		white-space: nowrap;
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
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
		border: 3px solid #000;
		border-radius: var(--radius-sm);
	}

	.segmented button {
		flex: 1;
		padding: 9px 8px;
		background: transparent;
		border: none;
		border-radius: 7px;
		color: var(--text-2);
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
	}

	.segmented button.active {
		background: var(--accent);
		color: #fff;
	}

	.pager {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-top: 14px;
		font-size: 13px;
	}

	.btn-mini {
		width: auto;
		padding: 7px 12px;
		font-size: 13px;
	}

	.hint {
		font-size: 13px;
	}

	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 40;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
		background: rgba(0, 0, 0, 0.48);
	}

	.payment-modal {
		width: min(560px, 100%);
		max-height: min(760px, calc(100dvh - 48px));
		overflow-y: auto;
		padding: 24px;
		background: var(--surface);
		border: 3px solid #000;
		border-radius: var(--radius);
		box-shadow: var(--shadow-lg);
	}

	.modal-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 18px;
	}

	.modal-kicker {
		display: block;
		margin-bottom: 4px;
		color: var(--muted);
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.modal-head h2 {
		font-size: 20px;
	}

	.modal-close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 7px;
		border: 2px solid #000;
		border-radius: 8px;
		background: var(--surface);
		color: var(--text);
	}

	.modal-close:hover {
		background: var(--surface-2);
	}

	.payment-route {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px;
		border: 2px solid #000;
		border-radius: var(--radius-sm);
		background: var(--surface-2);
	}

	.payment-route > div {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.payment-route span,
	.locked-amount span,
	.locked-amount small {
		color: var(--muted);
		font-size: 12px;
	}

	.payment-route strong {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 14px;
	}

	.locked-amount {
		display: flex;
		flex-direction: column;
		gap: 3px;
		margin: 16px 0;
		padding: 14px;
		border: 2px solid #000;
		border-radius: var(--radius-sm);
		background: var(--accent-soft);
	}

	.locked-amount strong {
		font-family: var(--font-head);
		font-size: 20px;
	}

	.locked-amount small {
		line-height: 1.4;
	}

	.modal-form {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.method-section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.method-options {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(225px, 1fr));
		gap: 8px;
	}

	.method-option {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 2px;
		padding: 11px;
		border: 2px solid var(--surface-2);
		border-radius: var(--radius-sm);
		background: var(--surface);
		color: var(--text);
		text-align: left;
	}

	.method-option-row {
		display: flex;
		align-items: stretch;
		gap: 8px;
		min-width: 0;
		padding: 6px;
		border: 2px solid var(--surface-2);
		border-radius: var(--radius-sm);
		background: transparent;
	}

	.method-option-row .method-option {
		flex: 1;
		min-width: 0;
		border: 0;
		background: transparent;
	}

	.method-actions {
		display: flex;
		align-items: center;
	}

	.copy-method,
	.reveal-method {
		align-self: center;
		width: 34px;
		height: 34px;
		padding: 0;
		border: 0;
		background: transparent;
		box-shadow: none;
		white-space: nowrap;
		font-size: 12px;
	}

	.copy-method:hover,
	.reveal-method:hover {
		background: rgba(0, 0, 0, 0.06);
		box-shadow: none;
	}

	.method-option-row:hover,
	.method-option-row.selected {
		background: transparent;
	}

	.method-option-row.selected {
		border-color: #000;
		background: var(--accent-soft);
	}

	.method-option span {
		color: var(--muted);
		font-size: 12px;
	}

	.method-option .account-number {
		display: block;
		width: 100%;
		margin-top: 4px;
		padding: 7px 0;
		overflow: hidden;
		border: 0;
		background: transparent;
		color: var(--text);
		font-size: 13px;
		font-weight: 600;
		letter-spacing: 0.02em;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.modal-actions {
		display: grid;
		grid-template-columns: 0.7fr 1.3fr;
		gap: 10px;
	}

	@media (max-width: 760px) {
		.cols {
			grid-template-columns: 1fr;
		}

		.modal-backdrop {
			align-items: flex-end;
			padding: 0;
		}

		.payment-modal {
			width: 100%;
			max-height: 92dvh;
			border-bottom: none;
			border-radius: var(--radius) var(--radius) 0 0;
		}
	}
</style>
