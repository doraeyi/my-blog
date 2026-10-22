<script lang="ts">
	import { tilt } from '$lib/actions/tilt';
	import Seo from '$lib/components/Seo.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { resolve } from '$app/paths';
	import { reveal } from '$lib/actions/reveal';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const max = $derived(Math.max(1, ...data.tags.map((t) => t.count)));
</script>

<Seo title="標籤" description="依主題瀏覽所有文章。" />

<div class="mx-auto max-w-3xl px-6 pb-16">
	<PageHeader title="標籤" stamp="索引" description="依主題瀏覽所有文章。" />

	{#if data.tags.length === 0}
		<p class="mt-8 text-sm text-ink-muted">還沒有任何標籤。</p>
	{:else}
		<ul use:reveal class="mt-8 flex flex-wrap gap-3">
			{#each data.tags as { tag, count } (tag)}
				<li>
					<a
						href={resolve('/tags/[tag]', { tag })}
						use:tilt
						class="case-card inline-flex items-baseline gap-2 rounded-full border border-border-case bg-surface/80 px-4 py-2 text-ink"
						style="font-size: {0.85 + (count / max) * 0.5}rem"
					>
						#{tag}
						<span class="font-mono-hack text-xs text-ink-muted">{count}</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>
