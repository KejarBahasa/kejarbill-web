<script lang="ts">
	import Brand from '$lib/components/Brand.svelte';
	import { register, checkUsername, login } from '$lib/api/auth';
	import { auth } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';

	let name = $state('');
	let username = $state('');
	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state('');
	let usernameAvailable = $state<null | boolean>(null);

	const USERNAME_RE = /^[a-z0-9_]([a-z0-9_.]*[a-z0-9_])?$/;
	const NAME_RE = /^[A-Za-z0-9 ]+$/;

	function usernameProblem(v: string): string {
		if (v.length < 3 || v.length > 50) return 'Username 3–50 karakter.';
		if (v.includes('..')) return 'Username tidak boleh memakai dua titik berurutan.';
		if (!USERNAME_RE.test(v)) return 'Username: huruf kecil, angka, underscore, titik (tanpa spasi/kapital).';
		return '';
	}

	function passwordProblem(v: string): string {
		if (v.length < 8 || v.length > 128) return 'Password 8–128 karakter.';
		if (/\s/.test(v)) return 'Password tidak boleh mengandung spasi.';
		if (!/[A-Za-z]/.test(v) || !/[0-9]/.test(v) || !/[^A-Za-z0-9\s]/.test(v))
			return 'Password harus mengandung huruf, angka, dan simbol (mis. ! $ #).';
		return '';
	}

	async function handleCheckUsername() {
		if (username.length < 3) return;
		try {
			const res = await checkUsername(username);
			usernameAvailable = res.is_available;
		} catch {
			usernameAvailable = null;
		}
	}

	async function handleSubmit() {
		error = '';
		if (!name || !username || !email || !password) {
			error = 'Semua field wajib diisi.';
			return;
		}
		if (name.length > 100 || !NAME_RE.test(name)) {
			error = 'Nama: huruf/angka/spasi, maks. 100 karakter.';
			return;
		}
		const up = usernameProblem(username);
		if (up) {
			error = up;
			return;
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
			error = 'Alamat email tidak valid.';
			return;
		}
		const pp = passwordProblem(password);
		if (pp) {
			error = pp;
			return;
		}

		loading = true;
		try {
			await register({ name, username, email, password });
			const res = await login({ identifier: username, password });
			auth.setToken(res.access_token);
			await goto('/dashboard');
		} catch (err: any) {
			error = err.message || 'Gagal mendaftar. Coba lagi.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>DAFTAR — KEJARBILL</title>
</svelte:head>

<div class="auth-page">
	<main class="panel">
		<form class="card" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
			<div class="card-head">
				<Brand size={40} tagline="KEJARBILL" />
				<h1>DAFTAR</h1>
				<p>Mulai catat tagihanmu sekarang!</p>
			</div>

			{#if error}
				<div class="alert alert-error">{error}</div>
			{/if}

			<label class="field">
				<span class="field-label">NAMA LENGKAP</span>
				<input class="input" type="text" placeholder="Budi Santoso" bind:value={name} />
			</label>

			<label class="field">
				<span class="field-label">USERNAME</span>
				<input class="input" type="text" placeholder="budi.s" bind:value={username} onblur={handleCheckUsername} />
				<span class="tip">3–50 karakter: huruf kecil, angka, underscore, titik</span>
				{#if usernameAvailable === true}
					<span class="tip success">✓ Tersedia</span>
				{:else if usernameAvailable === false}
					<span class="tip error">✗ Sudah terpakai</span>
				{/if}
			</label>

			<label class="field">
				<span class="field-label">EMAIL</span>
				<input class="input" type="email" placeholder="budi@example.com" bind:value={email} />
			</label>

			<label class="field">
				<span class="field-label">PASSWORD</span>
				<input class="input" type="password" placeholder="••••••••" bind:value={password} />
				<span class="tip">8–128 karakter: huruf + angka + simbol, tanpa spasi</span>
			</label>

			<button class="btn btn-primary" type="submit" disabled={loading}>
				{loading ? 'MEMPROSES...' : 'DAFTAR AKUN'}
			</button>
			
			<p class="card-foot">
				Sudah punya akun? <a href="/login">Masuk</a>
			</p>
		</form>
	</main>
</div>

<style>
	.auth-page {
		min-height: 100dvh;
		background: #f8f9fa;
		background-image: linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px);
		background-size: 30px 30px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
	}

	.panel {
		width: 100%;
		max-width: 450px;
	}

	.card {
		background: #ffffff;
		border: 4px solid #000;
		padding: 40px;
		box-shadow: 12px 12px 0px 0px rgba(0,0,0,1);
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.card-head {
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.card-head h1 {
		font-family: var(--font-head);
		font-size: 24px;
		margin: 10px 0 0;
		text-shadow: 3px 3px 0 #ffdb33;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.field-label {
		font-family: var(--font-sans);
		font-weight: 700;
		font-size: 13px;
	}

	.input {
		width: 100%;
		padding: 12px;
		border: 3px solid #000;
		font-family: var(--font-sans);
		font-size: 16px;
		box-shadow: 4px 4px 0px 0px rgba(0,0,0,0.1);
	}
	
	.input:focus {
		outline: none;
		background: #ffdb33;
	}

	.btn-primary {
		font-family: var(--font-head);
		background: #e63946;
		color: #fff;
		border: 3px solid #000;
		padding: 15px;
		font-size: 16px;
		cursor: pointer;
		box-shadow: 6px 6px 0px 0px #000;
		transition: all 0.1s;
		margin-top: 10px;
	}

	.btn-primary:hover {
		transform: translate(2px, 2px);
		box-shadow: 4px 4px 0px 0px #000;
	}

	.tip {
		font-size: 12px;
		font-weight: 700;
	}
	.tip.success { color: #2b9348; }
	.tip.error { color: #e63946; }

	.card-foot {
		text-align: center;
		font-family: var(--font-sans);
		font-weight: 600;
		font-size: 14px;
	}
	.card-foot a {
		color: #e63946;
		text-decoration: underline;
	}
	.alert-error {
		background: #e63946;
		color: white;
		border: 2px solid #000;
		padding: 12px;
		font-family: var(--font-sans);
		font-weight: 700;
	}
</style>