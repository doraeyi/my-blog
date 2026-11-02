<!--
	The end of a case file: the files on either side of it (上一宗 / 下一宗),
	and the related files below, all pinned to the board and strung together.
-->
<script lang="ts">
	import type { PostNav } from '$lib/server/content-index';
	import PinString from '$lib/components/PinString.svelte';
	import { pinned } from '$lib/actions/pinned';

	let { nav }: { nav: PostNav } = $props();

	const kindLabel = { blog: '文章', article: '技術文章', mood: '心情' } as const;
	const kindColor = { blog: '#2b4c9b', article: '#b3261e', mood: '#5b3a8a' } as const;
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- paths come from the server-built content index -->
{#if nav.prev || nav.next}
	<nav aria-label="上一篇與下一篇" class="mt-16">
		<PinString class="sides">
			{#if nav.prev}
				<a href={nav.prev.path} class="side" use:pinned={{ tilt: -0.8 }}>
					<span class="side-kicker font-mono-hack">← 上一篇 · 上一宗</span>
					<span class="side-title font-display"><span class="ink-line">{nav.prev.title}</span></span
					>
				</a>
			{:else}
				<span class="hidden sm:block"></span>
			{/if}
			{#if nav.next}
				<a href={nav.next.path} class="side next" use:pinned={{ delay: 120, tilt: 0.8 }}>
					<span class="side-kicker font-mono-hack">下一宗 · 下一篇 →</span>
					<span class="side-title font-display"><span class="ink-line">{nav.next.title}</span></span
					>
				</a>
			{/if}
		</PinString>
	</nav>
{/if}

{#if nav.related.length > 0}
	<section class="mt-16">
		<h2 class="related-head font-mono-hack">相關案件 · 你可能也會想看</h2>
		<PinString class="related">
			{#each nav.related as item, i (item.path)}
				<a
					href={item.path}
					class="rel"
					style="--k: {kindColor[item.kind]}"
					use:pinned={{ delay: i * 110, tilt: [-1.2, 0.8, -0.5][i % 3] }}
				>
					<span class="rel-kind font-mono-hack">{kindLabel[item.kind]}</span>
					<span class="rel-title font-display"><span class="ink-line">{item.title}</span></span>
					<span class="rel-date font-mono-hack">{item.date.toLocaleDateString('zh-TW')}</span>
				</a>
			{/each}
		</PinString>
	</section>
{/if}

<!-- eslint-enable svelte/no-navigation-without-resolve -->

<style>
	:global(.sides) {
		display: grid;
		gap: 2.4rem 1.6rem;
	}
	:global(.related) {
		display: grid;
		gap: 2.4rem 1.4rem;
		margin-top: 2rem;
	}
	@media (min-width: 640px) {
		:global(.sides) {
			grid-template-columns: 1fr 1fr;
		}
		:global(.related) {
			grid-template-columns: repeat(3, 1fr);
		}
	}
	.side,
	.rel {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1.3rem 1.2rem 1.2rem;
		border: 1px solid rgb(60 40 20 / 0.1);
		border-radius: 3px;
		background: linear-gradient(180deg, rgb(255 255 255 / 0.65), transparent 45%), #fffcf5;
		box-shadow:
			0 1px 2px rgb(40 25 10 / 0.08),
			0 12px 26px -14px rgb(40 25 10 / 0.36);
		transition: box-shadow 0.35s;
	}
	.side:hover,
	.rel:hover {
		box-shadow:
			0 1px 2px rgb(40 25 10 / 0.08),
			0 26px 44px -18px rgb(40 25 10 / 0.46),
			0 0 0 1px color-mix(in srgb, var(--color-accent) 30%, transparent);
	}
	.next {
		text-align: right;
	}
	.side-kicker {
		color: var(--color-accent);
		font-size: 0.72rem;
		letter-spacing: 0.2em;
	}
	.side-title {
		color: var(--color-ink);
		font-size: 1.3rem;
		line-height: 1.35;
	}
	.related-head {
		color: var(--color-ink-muted);
		font-size: 0.72rem;
		letter-spacing: 0.3em;
	}
	.rel-kind {
		color: var(--k);
		font-size: 0.68rem;
		letter-spacing: 0.15em;
	}
	.rel-kind::before {
		content: '';
		display: inline-block;
		width: 12px;
		height: 3px;
		margin-right: 0.45rem;
		border-radius: 2px;
		background: var(--k);
		vertical-align: middle;
	}
	.rel-title {
		color: var(--color-ink);
		font-size: 1.05rem;
		line-height: 1.45;
	}
	.rel-date {
		margin-top: auto;
		padding-top: 0.4rem;
		color: var(--color-ink-muted);
		font-size: 0.68rem;
	}
</style>
