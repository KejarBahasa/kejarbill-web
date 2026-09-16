<script lang="ts">
	import Brand from '$lib/components/Brand.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { login } from '$lib/api/auth';
	import { auth } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';

	let identifier = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let loading = $state(false);
	let error = $state('');

	async function handleSubmit() {
		error = '';
		if (!identifier.trim() || !password) {
			error = 'Username/email dan password wajib diisi.';
			return;
		}

		loading = true;
		try {
			const res = await login({ identifier: identifier.trim(), password });
			auth.setToken(res.access_token);
			await goto('/dashboard');
		} catch (err) {
			error = 'Username/email atau password salah.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>MASUK — KEJARBILL</title>
</svelte:head>

<div class="auth-page">
	<main class="panel">
		<form class="card" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
			<div class="card-head">
				<Brand size={40} tagline="KEJARBILL" />
				<h1>MASUK</h1>
				<p>Lanjut kelola tagihan bareng teman!</p>
			</div>

			{#if error}
				<div class="alert alert-error" role="alert">
					<span>{error}</span>
				</div>
			{/if}

			<label class="field">
				<span class="field-label">USERNAME/EMAIL</span>
				<input class="input" type="text" placeholder="contoh: budi.santoso" bind:value={identifier} />
			</label>

			<label class="field">
				<span class="field-label">PASSWORD</span>
				<div class="input-wrap">
					<input class="input" type={showPassword ? 'text' : 'password'} placeholder="••••••••" bind:value={password} />
					<button type="button" class="input-toggle" onclick={() => (showPassword = !showPassword)}>
						<Icon name={showPassword ? 'eye-off' : 'eye'} size={20} />
					</button>
				</div>
			</label>

			<button class="btn btn-primary" type="submit" disabled={loading}>
				{loading ? 'MEMPROSES...' : 'MASUK SEKARANG'}
			</button>
			
			<p class="card-foot">
				Belum punya akun? <a href="/register">Daftar</a>
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
		gap: 24px;
	}

	.card-head {
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 8px;
	}

	.card-head h1 {
		font-family: var(--font-head);
		font-size: 24px;
		margin: 10px 0 0;
		text-shadow: 3px 3px 0 #ffdb33;
	}
	
	.card-head p {
		font-family: var(--font-sans);
		font-weight: 500;
		color: #555;
		margin: 0;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 8px;
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

	.input-wrap {
		position: relative;
	}

	.input-toggle {
		position: absolute;
		right: 10px;
		top: 10px;
		background: none;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
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

	.btn-primary:hover:not(:disabled) {
		transform: translate(2px, 2px);
		box-shadow: 4px 4px 0px 0px #000;
	}
	
	.btn-primary:active:not(:disabled) {
		transform: translate(6px, 6px);
		box-shadow: none;
	}

	.alert-error {
		background: #e63946;
		color: white;
		border: 2px solid #000;
		padding: 12px;
		font-family: var(--font-sans);
		font-weight: 700;
		font-size: 14px;
	}

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
</style>