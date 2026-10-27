<!--
	The end of a case file: the files on either side of it as index cards
	(上一宗 / 下一宗), and related files pinned below with their kind stamped on.
-->
<script lang="ts">
	import type { PostNav } from '$lib/server/content-index';

	let { nav }: { nav: PostNav } = $props();

	const kindLabel = { blog: '文章', article: '技術文章', mood: '心情' } as const;
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- paths come from the server-built content index -->
{#if nav.prev || nav.next}
	<nav aria-label="上一篇與下一篇" class="mt-14 grid gap-5 sm:grid-cols-2">
		{#if nav.prev}
			<a href={nav.prev.path} class="index-card file-card" style="rotate: -0.8deg">
				<span class="file-kicker">← 上一宗</span>
				<span class="file-title">{nav.prev.title}</span>
			</a>
		{:else}
			<span class="hidden sm:block"></span>
		{/if}
		{#if nav.next}
			<a href={nav.next.path} class="index-card file-card text-right" style="rotate: 0.8deg">
				<span class="file-kicker">下一宗 →</span>
				<span class="file-title">{nav.next.title}</span>
			</a>
		{/if}
	</nav>
{/if}

{#if nav.related.length > 0}
	<section class="mt-14">
		<h2 class="font-mono-hack text-xs tracking-[0.3em] text-ink-muted">相關案件</h2>
		<ul class="mt-4 grid gap-4 sm:grid-cols-3">
			{#each nav.related as item, i (item.path)}
				<li style="rotate: {[-1.2, 0.8, -0.5][i % 3]}deg">
					<a href={item.path} class="index-card file-card h-full">
						<span class="related-kind">{kindLabel[item.kind]}</span>
						<span class="file-title text-[0.95rem]">{item.title}</span>
						<span class="mt-auto pt-2 font-mono-hack text-[0.7rem] text-[#8a7458]">
							{item.date.toLocaleDateString('zh-TW')}
						</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<!-- eslint-enable svelte/no-navigation-without-resolve -->

<style>
	.file-card {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: 0.9rem 1.1rem 1.1rem;
		border-top: 3px solid var(--color-accent);
		border-radius: 2px;
		transition:
			translate 0.2s,
			box-shadow 0.2s;
	}
	.file-card:hover {
		translate: 0 -3px;
		box-shadow:
			0 1px 0 rgba(255, 255, 255, 0.6) inset,
			0 24px 40px -18px rgba(20, 12, 6, 0.6);
	}
	.file-kicker {
		color: var(--color-accent);
		font-family: var(--font-mono-hack);
		font-size: 0.75rem;
		letter-spacing: 0.2em;
	}
	.file-title {
		font-family: var(--font-display);
		font-size: 1.05rem;
		line-height: 1.5;
	}
	.file-card:hover .file-title {
		color: #8e1d12;
	}
	.related-kind {
		align-self: flex-start;
		padding: 0 0.5em;
		border: 2px solid #b3261e;
		color: #b3261e;
		font-family: var(--font-display);
		font-size: 0.72rem;
		letter-spacing: 0.2em;
		rotate: -4deg;
	}
</style>
