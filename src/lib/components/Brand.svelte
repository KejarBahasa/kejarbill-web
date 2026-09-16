<script lang="ts">
	interface Props {
		size?: number;
		tagline?: string;
	}
	let { size = 40, tagline = 'KejarBill' }: Props = $props();
</script>

<span class="brand" style="--s: {size}px">
	<span class="brand-mark">
		<svg
			width="{size}"
			height="{size}"
			viewBox="0 0 48 48"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<rect x="2" y="2" width="44" height="44" rx="10" fill="#ffdb33" stroke="#000" stroke-width="3" />
			<path
				d="M14 34V14h11.4c3.9 0 6.8 2.2 6.8 5.7 0 2.5-1.5 4.3-3.8 5.1 3 .6 4.9 2.7 4.9 5.6 0 3.6-3 5.6-7.1 5.6H14Zm5.8-12.3h4.6c1.8 0 2.9-.9 2.9-2.3 0-1.4-1.1-2.2-2.9-2.2h-4.6v4.5Zm0 5.4v4.6h5.2c1.8 0 3-1.1 3-2.4 0-1.4-1.1-2.2-3-2.2h-5.2Z"
				fill="#000"
			/>
		</svg>
	</span>
	{#if tagline}
		<span class="brand-name">{tagline}</span>
	{/if}
</span>

<style>
	.brand {
		display: inline-flex;
		align-items: center;
		gap: 11px;
	}

	.brand-mark {
		display: inline-flex;
	}

	.brand-name {
		font-family: var(--font-head);
		font-size: 15px;
		letter-spacing: 0.01em;
		color: var(--text);
	}
</style>