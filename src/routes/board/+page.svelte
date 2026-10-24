<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import EvidenceBoard from '$lib/components/EvidenceBoard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const tagTotal = $derived(new Set(data.posts.flatMap((p) => p.tags)).size);
</script>

<Seo title="證物牆" description="所有文章釘在同一面牆上，用紅線串起共同的線索。" />

<div class="mx-auto max-w-[80rem] px-6 pb-16">
	<PageHeader
		title="證物牆"
		stamp="串線"
		description="每一篇文章都是一張證物卡，紅線連到它的線索。移到卡片上看它牽扯到哪些線索，移到線索上看它串起哪些案件。"
	>
		<p class="font-mono-hack text-xs tracking-widest text-ink-muted">
			{data.posts.length} 件證物 · {tagTotal} 條線索
		</p>
	</PageHeader>

	{#if data.posts.length === 0}
		<p class="text-sm text-ink-muted">牆上還沒有證物。</p>
	{:else}
		<p class="mb-2 font-mono-hack text-xs tracking-widest text-ink-muted md:hidden">
			← 左右滑動看整面牆 →
		</p>
		<EvidenceBoard posts={data.posts} />
	{/if}
</div>
