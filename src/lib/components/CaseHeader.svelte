<!--
	The top of an article, the cover sheet of a case file: file number and
	kind, the title set letter by letter, then the stamp comes down beside it,
	the filled-in fields (date, reading time, views) and the tags as clues.
	A rule draws itself under it all. Same motion as every page's PageHeader.
-->
<script lang="ts">
	import { titleWords } from '$lib/title-words';
	import { resolve } from '$app/paths';

	let {
		kind,
		title,
		date,
		minutes,
		views,
		tags = []
	}: {
		kind: 'blog' | 'article' | 'mood';
		title: string;
		/** Display date, e.g. 2026-07-01 or 2026/7/1. */
		date: string;
		minutes?: number;
		views: number;
		tags?: string[];
	} = $props();

	const kindLabel = { blog: '文章', article: '技術文章', mood: '心情' } as const;
	const stamp = { blog: '手記', article: '技術', mood: '心情' } as const;
	const color = { blog: '#2b4c9b', article: '#b3261e', mood: '#5b3a8a' } as const;
	const letters = $derived([...title]);
	const words = $derived(titleWords(title));
	// The letters come up 35ms apart (capped for long titles); the stamp lands after the last.
	const landed = $derived(0.25 + Math.min(letters.length * 0.035, 1.2) + 0.35);
	// A file number from the date: 2026/7/1 → 2026-0701.
	const fileNo = $derived.by(() => {
		const [y, m, d] = date.split(/[-/.]/).map(Number);
		return y && m && d ? `${y}-${String(m).padStart(2, '0')}${String(d).padStart(2, '0')}` : date;
	});
</script>

<header class="case-head" style="--landed: {landed}s; --k: {color[kind]}">
	<p class="kicker font-mono-hack">
		<span class="kind">{kindLabel[kind]}</span>
		<span class="file-no"><span class="file-word">CASE FILE </span>№ {fileNo}</span>
	</p>

	<div class="title-row">
		<h1 class="title font-display" aria-label={title}>
			{#each words as word, w (w)}<span class="word" aria-hidden="true"
					>{#each word as { ch, i } (i)}<span
							class="ch"
							class:sp={ch === ' '}
							style="--i: {Math.min(i, 34)}">{ch}</span
						>{/each}</span
				>{/each}
		</h1>
	</div>
	<span class="stamp" aria-hidden="true" data-word={stamp[kind]}></span>

	<dl class="fields">
		<div>
			<dt>日期</dt>
			<dd>{date}</dd>
		</div>
		{#if minutes}
			<div>
				<dt>閱讀</dt>
				<dd>{minutes} 分鐘</dd>
			</div>
		{/if}
		<div>
			<dt>瀏覽</dt>
			<dd>{views} 次</dd>
		</div>
	</dl>

	{#if tags.length}
		<ul class="tags" aria-label="標籤">
			{#each tags as tag, i (tag)}
				<li style="--i: {i}">
					<a href={resolve('/tags/[tag]', { tag })} class="tag font-mono-hack">#{tag}</a>
				</li>
			{/each}
		</ul>
	{/if}

	<span class="rule" aria-hidden="true"></span>
</header>

<style>
	.case-head {
		position: relative;
		padding-bottom: 2rem;
	}
	.kicker {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding-right: 6rem;
		color: var(--color-ink-muted);
		font-size: 0.72rem;
		letter-spacing: 0.18em;
		animation: rise 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.1s both;
	}
	.kind {
		color: var(--k);
		white-space: nowrap;
	}
	.file-no {
		white-space: nowrap;
	}
	/* A phone keeps just the number, so the line doesn't break under the stamp. */
	@media (max-width: 479px) {
		.file-word {
			display: none;
		}
	}
	.kind::before {
		content: '';
		display: inline-block;
		width: 14px;
		height: 3px;
		margin-right: 0.5rem;
		border-radius: 2px;
		background: var(--k);
		vertical-align: middle;
	}
	.title-row {
		margin-top: 1rem;
		padding-right: 6rem;
	}
	.title {
		color: var(--color-ink);
		font-size: clamp(2.1rem, 4.6vw, 3.4rem);
		line-height: 1.18;
		letter-spacing: -0.01em;
	}
	/* Each letter comes up out of the paper, one after another. */
	.ch {
		display: inline-block;
		animation: letter 0.7s cubic-bezier(0.2, 0.9, 0.25, 1.15) calc(0.25s + var(--i) * 0.035s) both;
	}
	.sp {
		width: 0.28em;
	}
	.word {
		white-space: nowrap;
	}
	@keyframes letter {
		from {
			opacity: 0;
			transform: translateY(0.45em) rotate(6deg);
		}
	}

	.stamp::before {
		content: attr(data-word);
	}
	.stamp {
		position: absolute;
		top: 1.6rem;
		right: 0;
		padding: 0.2rem 0.7rem;
		border: 2px solid var(--color-accent);
		border-radius: 4px;
		outline: 1px solid var(--color-accent);
		outline-offset: 2px;
		color: var(--color-accent-strong);
		font-family: 'LXGW WenKai TC', var(--font-display);
		font-size: 1.05rem;
		font-weight: 700;
		letter-spacing: 0.3em;
		mix-blend-mode: multiply;
		mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='60'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.8' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -2.2 1.6'/%3E%3C/filter%3E%3Crect width='120' height='60' filter='url(%23n)'/%3E%3C/svg%3E");
		rotate: 7deg;
		animation: stamp-down 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.2) var(--landed) both;
	}
	@keyframes stamp-down {
		0% {
			opacity: 0;
			transform: scale(2.2) rotate(8deg);
		}
		60% {
			opacity: 1;
			transform: scale(0.94);
		}
		100% {
			opacity: 0.92;
			transform: none;
		}
	}

	.fields {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 1.8rem;
		margin-top: 1.4rem;
		font-family: var(--font-mono-hack);
		font-size: 0.82rem;
		animation: rise 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) calc(var(--landed) - 0.25s) both;
	}
	.fields div {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}
	.fields dt {
		color: var(--color-ink-muted);
		font-size: 0.68rem;
		letter-spacing: 0.2em;
	}
	/* Filled in by hand, in blue ink */
	.fields dd {
		min-width: 4.5rem;
		padding: 0 0.3rem 0.1rem;
		border-bottom: 1px dotted #8a7458;
		color: #2b4c9b;
		font-family: 'LXGW WenKai TC', var(--font-display);
		font-size: 0.98rem;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 1.2rem;
	}
	.tags li {
		animation: rise 0.6s cubic-bezier(0.34, 1.4, 0.64, 1) calc(var(--landed) + var(--i) * 0.06s)
			both;
	}
	.tag {
		display: inline-block;
		padding: 0.25rem 0.7rem;
		border: 1px solid var(--color-border-case);
		border-radius: 999px;
		background: rgb(255 255 255 / 0.5);
		color: var(--color-ink-muted);
		font-size: 0.74rem;
		transition:
			color 0.2s,
			border-color 0.2s,
			translate 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.tag:hover {
		border-color: var(--color-accent);
		color: var(--color-accent);
		translate: 0 -2px;
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
	}
	/* A rule that draws itself across the sheet, from a red pin at its start. */
	.rule {
		position: absolute;
		right: 0;
		bottom: 0;
		left: 0;
		height: 1px;
		background: linear-gradient(90deg, var(--color-border-case), transparent);
		transform-origin: left;
		animation: draw 1.1s cubic-bezier(0.65, 0, 0.35, 1) calc(var(--landed) - 0.2s) both;
	}
	.rule::before {
		content: '';
		position: absolute;
		top: -3px;
		left: 0;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--color-accent);
	}
	@keyframes draw {
		from {
			transform: scaleX(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.kicker,
		.ch,
		.stamp,
		.fields,
		.tags li,
		.rule {
			animation: none;
		}
	}
</style>
