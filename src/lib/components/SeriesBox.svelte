<script lang="ts">
	import Layers from '@lucide/svelte/icons/layers';
	import type { PostNav } from '$lib/server/content-index';

	let { series }: { series: NonNullable<PostNav['series']> } = $props();

	const index = $derived(series.items.findIndex((i) => i.current) + 1);
</script>

<aside class="mt-8 rounded-md border border-border-case bg-surface-alt/70 p-5">
	<p
		class="flex items-center gap-2 font-mono-hack text-xs tracking-[0.2em] text-ink-muted uppercase"
	>
		<Layers class="size-3.5 text-accent" />
		系列 · {series.name}
		<span class="ml-auto tracking-normal">第 {index} / {series.items.length} 篇</span>
	</p>
	<ol class="mt-3 space-y-1.5 text-sm">
		{#each series.items as item, i (item.path)}
			<li class="flex gap-3">
				<span class="w-5 shrink-0 text-right font-mono-hack text-ink-muted">{i + 1}.</span>
				{#if item.current}
					<span class="font-medium text-accent">{item.title}</span>
				{:else}
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- path comes from the server-built content index -->
					<a href={item.path} class="text-ink transition hover:text-accent">{item.title}</a>
				{/if}
			</li>
		{/each}
	</ol>
</aside>
