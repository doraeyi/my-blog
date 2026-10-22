<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { reveal } from '$lib/actions/reveal';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Feather from '@lucide/svelte/icons/feather';
	import FileText from '@lucide/svelte/icons/file-text';
	import Clapperboard from '@lucide/svelte/icons/clapperboard';
	import FolderGit2 from '@lucide/svelte/icons/folder-git-2';
	import type { PageData } from './$types';
	import type { TimelineKind } from './+page.server';

	let { data }: { data: PageData } = $props();

	const kinds: Record<TimelineKind, { label: string; icon: typeof BookOpen }> = {
		blog: { label: '文章', icon: FileText },
		article: { label: '技術文章', icon: BookOpen },
		mood: { label: '心情', icon: Feather },
		watch: { label: '看完', icon: Clapperboard },
		project: { label: '作品', icon: FolderGit2 }
	};

	let filter = $state<TimelineKind | 'all'>('all');

	const years = $derived(
		filter === 'all'
			? data.years
			: data.years
					.map((y) => ({
						...y,
						months: y.months
							.map((m) => ({ ...m, items: m.items.filter((i) => i.kind === filter) }))
							.filter((m) => m.items.length > 0)
					}))
					.filter((y) => y.months.length > 0)
	);
</script>

<Seo title="案件時間軸" description="文章、心情、作品與追劇，依時間排列的完整紀錄。" />

<div class="mx-auto max-w-3xl px-6 pb-16">
	<PageHeader title="案件時間軸" stamp="編年" description={`共 ${data.total} 筆紀錄`} />

	<div class="mt-6 flex flex-wrap gap-2" role="group" aria-label="篩選類型">
		{#each [['all', '全部'], ...Object.entries(kinds).map( ([k, v]) => [k, v.label] )] as [key, label] (key)}
			<button
				type="button"
				onclick={() => (filter = key as TimelineKind | 'all')}
				aria-pressed={filter === key}
				class="rounded-full border px-3 py-1 text-sm transition {filter === key
					? 'border-accent bg-accent text-white'
					: 'border-border-case bg-surface/80 text-ink-muted hover:text-ink'}"
			>
				{label}
			</button>
		{/each}
	</div>

	{#each years as year (year.year)}
		<section class="mt-12">
			<h2 use:reveal class="font-display text-4xl text-case-300 dark:text-case-800">{year.year}</h2>
			{#each year.months as month (month.month)}
				<div class="mt-6 grid grid-cols-[3.5rem_1fr] gap-4">
					<p class="pt-0.5 font-mono-hack text-sm text-accent">
						{String(month.month).padStart(2, '0')} 月
					</p>
					<ol class="relative space-y-3 border-l border-dashed border-border-case pl-6">
						{#each month.items as item, i (item.path)}
							{@const K = kinds[item.kind]}
							<li use:reveal={{ delay: i * 40, y: 8 }} class="relative">
								<span
									class="absolute top-1 -left-[2.1rem] flex size-5 items-center justify-center rounded-full border border-border-case bg-surface text-ink-muted"
								>
									<K.icon class="size-3" />
								</span>
								<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- path comes from the server-built index -->
								<a href={item.path} class="group flex flex-wrap items-baseline gap-x-3">
									<span class="text-ink transition group-hover:text-accent">{item.title}</span>
									<span class="font-mono-hack text-xs text-ink-muted">
										{K.label} · {item.date.getDate()} 日
									</span>
								</a>
							</li>
						{/each}
					</ol>
				</div>
			{/each}
		</section>
	{:else}
		<p class="mt-8 text-sm text-ink-muted">這個分類還沒有紀錄。</p>
	{/each}
</div>
