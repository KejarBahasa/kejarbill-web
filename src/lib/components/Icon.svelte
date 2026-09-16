<script lang="ts">
	interface Props {
		name: string;
		size?: number;
	}
	import { icons } from './Icon.paths';
	let { name, size = 18 }: Props = $props();
</script>

<svg
	width="{size}"
	height="{size}"
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	{#each icons[name] ?? [] as d}
		<path d={d} />
	{/each}
</svg>