<script lang="ts">
	import { resolve } from '$app/paths';
	import Seo from '$lib/components/Seo.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import CommentThread from '$lib/components/CommentThread.svelte';
	import { reveal } from '$lib/actions/reveal';
	import { milestones } from '$lib/site-history';
	import { SITE_LAUNCHED_AT } from '$lib/site-nav';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const newestFirst = [...milestones].reverse();
	const days = Math.floor((Date.now() - SITE_LAUNCHED_AT.getTime()) / 86_400_000);
</script>

<Seo title="結案紀錄" description="站點走過的路：每一個重要的轉折。" />

<div class="mx-auto max-w-3xl px-6 pb-16">
	<PageHeader
		title="結案紀錄"
		stamp="結案"
		description="從第一個 commit 到現在，只挑重要的轉折，碎碎的變更就不列了。"
	/>

	<section>
		<h2 class="text-lg font-semibold text-ink">里程碑</h2>
		<ol class="relative mt-6 ml-2 border-l border-border-case/70">
			{#each newestFirst as m, i (m.date + m.title)}
				<li class="relative pb-8 pl-8 last:pb-0" use:reveal={{ delay: i * 60, y: 10 }}>
					<span
						aria-hidden="true"
						class="absolute top-1 -left-[0.4rem] size-3 rounded-full border-2 border-surface {i ===
						0
							? 'bg-accent ring-4 ring-accent/20'
							: 'bg-case-400'}"
					></span>
					<time class="font-mono-hack text-xs tracking-wide text-ink-muted">{m.date}</time>
					<p class="mt-1 font-semibold text-ink">{m.title}</p>
					{#if m.detail}
						<p class="mt-1 text-sm text-ink-muted">{m.detail}</p>
					{/if}
				</li>
			{/each}
		</ol>
	</section>

	<div
		class="mt-12 rounded-2xl border border-border-case/70 bg-surface-alt/50 p-6 text-center"
		use:reveal={{ delay: 100 }}
	>
		<p class="text-sm text-ink-muted">本站已運行</p>
		<p class="mt-1 font-display text-3xl font-bold text-ink">{days} 天</p>
		<p class="mt-3 text-sm text-ink-muted">一路走來，感謝有你。</p>
	</div>

	<p class="mt-8 text-sm text-ink-muted">
		繼續瞭解：
		<a href={resolve('/messages')} class="text-accent underline-offset-4 hover:underline">證詞</a>
		— 想說什麼都可以
	</p>

	<CommentThread comments={data.comments} message={form?.message} />
</div>
