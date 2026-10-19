<script lang="ts">
	import { tilt } from '$lib/actions/tilt';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import type { PostNav } from '$lib/server/content-index';

	let { nav }: { nav: PostNav } = $props();

	const kindLabel = { blog: '文章', article: '技術文章', mood: '心情' } as const;
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- paths come from the server-built content index -->
{#if nav.prev || nav.next}
	<nav aria-label="上一篇與下一篇" class="mt-12 grid gap-3 sm:grid-cols-2">
		{#if nav.prev}
			<a
				href={nav.prev.path}
				use:tilt
				class="case-card group rounded-md border border-border-case bg-surface/75 p-4 backdrop-blur-sm"
			>
				<span class="flex items-center gap-1.5 font-mono-hack text-xs text-ink-muted">
					<ArrowLeft class="size-3.5 transition group-hover:-translate-x-0.5" /> 上一篇
				</span>
				<span class="mt-1.5 block font-medium text-ink">{nav.prev.title}</span>
			</a>
		{:else}
			<span class="hidden sm:block"></span>
		{/if}
		{#if nav.next}
			<a
				href={nav.next.path}
				use:tilt
				class="case-card group rounded-md border border-border-case bg-surface/75 p-4 text-right backdrop-blur-sm"
			>
				<span class="flex items-center justify-end gap-1.5 font-mono-hack text-xs text-ink-muted">
					下一篇 <ArrowRight class="size-3.5 transition group-hover:translate-x-0.5" />
				</span>
				<span class="mt-1.5 block font-medium text-ink">{nav.next.title}</span>
			</a>
		{/if}
	</nav>
{/if}

{#if nav.related.length > 0}
	<section class="mt-12">
		<h2 class="font-mono-hack text-xs tracking-[0.3em] text-ink-muted uppercase">
			Related Cases // 相關文章
		</h2>
		<ul class="mt-4 grid gap-3 sm:grid-cols-3">
			{#each nav.related as item (item.path)}
				<li>
					<a
						href={item.path}
						use:tilt
						class="case-card flex h-full flex-col rounded-md border border-border-case bg-surface/75 p-4 backdrop-blur-sm"
					>
						<span class="font-mono-hack text-[0.7rem] tracking-widest text-accent">
							{kindLabel[item.kind]}
						</span>
						<span class="mt-1.5 text-sm font-medium text-ink">{item.title}</span>
						<span class="mt-auto pt-2 font-mono-hack text-[0.7rem] text-ink-muted">
							{item.date.toLocaleDateString('zh-TW')}
						</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>
{/if}
<!-- eslint-enable svelte/no-navigation-without-resolve -->
