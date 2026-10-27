<!--
	The top of an article, typed like the cover sheet of a case file: file
	number and kind, a rubber stamp, the title, the filled-in fields (date,
	reading time, views) and the tags as manila evidence labels on string.
-->
<script lang="ts">
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
	// How long the title takes to type (45ms a key, capped), so the stamp lands after it.
	const typedIn = $derived(Math.min([...title].length * 45, 1400) + 250);
	// A file number from the date: 2026/7/1 → 2026-0701.
	const fileNo = $derived.by(() => {
		const [y, m, d] = date.split(/[-/.]/).map(Number);
		return y && m && d ? `${y}-${String(m).padStart(2, '0')}${String(d).padStart(2, '0')}` : date;
	});
</script>

<header class="case-head">
	<p class="kicker font-mono-hack">
		CASE FILE <span aria-hidden="true">·</span> No. {fileNo}
		<span aria-hidden="true">·</span>
		{kindLabel[kind]}
	</p>
	<span class="stamp font-display" aria-hidden="true" style="--t: {typedIn}ms">{stamp[kind]}</span>
	<!-- Typed in key by key, then the caret blinks out. -->
	<h1 class="title font-display" aria-label={title}>
		<span aria-hidden="true"
			>{#each [...title] as ch, i (i)}<span class="key" style="--i: {i}">{ch}</span>{/each}</span
		><span class="caret" aria-hidden="true" style="--t: {typedIn}ms"></span>
	</h1>

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
				<li style="rotate: {[-3, 2, -1.5, 3, -2.5][i % 5]}deg">
					<a href={resolve('/tags/[tag]', { tag })} class="tag">{tag}</a>
				</li>
			{/each}
		</ul>
	{/if}
</header>

<style>
	.case-head {
		position: relative;
		padding-bottom: 1.6rem;
		border-bottom: 2px solid #2c2118;
	}
	.case-head::after {
		content: '';
		position: absolute;
		right: 0;
		bottom: -6px;
		left: 0;
		border-bottom: 1px solid #2c2118;
	}
	.kicker {
		padding-right: 5.5rem;
		color: var(--color-accent);
		font-size: 0.72rem;
		letter-spacing: 0.25em;
	}
	.stamp {
		position: absolute;
		top: -0.4rem;
		right: 0;
		padding: 0.15em 0.7em;
		border: 3px double #b3261e;
		border-radius: 3px;
		color: #b3261e;
		font-size: 1.25rem;
		letter-spacing: 0.35em;
		opacity: 0.82;
		rotate: 8deg;
		mix-blend-mode: multiply;
		animation: slam 0.45s cubic-bezier(0.3, 1.4, 0.5, 1) var(--t) both;
	}
	.key {
		animation: strike 0.12s ease-out calc(min(var(--i) * 45ms, 1400ms) + 200ms) both;
	}
	@keyframes strike {
		from {
			opacity: 0;
			transform: translateY(-0.12em);
			color: #8e1d12;
		}
	}
	.caret {
		display: inline-block;
		width: 0.08em;
		height: 0.95em;
		margin-left: 0.08em;
		vertical-align: -0.1em;
		background: #8e1d12;
		/* Only once the line is typed: blinks a few times, then gone. */
		opacity: 0;
		animation: caret 0.55s steps(1) var(--t) 5 forwards;
	}
	@keyframes caret {
		0%,
		49% {
			opacity: 1;
		}
		50%,
		100% {
			opacity: 0;
		}
	}
	@keyframes slam {
		from {
			opacity: 0;
			transform: scale(1.8);
		}
	}
	.title {
		margin-top: 0.9rem;
		padding-right: 5.5rem;
		color: var(--color-ink);
		font-size: clamp(1.9rem, 4vw, 2.7rem);
		line-height: 1.3;
	}
	.fields {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 1.6rem;
		margin-top: 1.1rem;
		font-family: var(--font-mono-hack);
		font-size: 0.82rem;
	}
	.fields div {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}
	.fields dt {
		color: var(--color-ink-muted);
		font-size: 0.7rem;
		letter-spacing: 0.2em;
	}
	.fields dd {
		min-width: 4.5rem;
		padding: 0 0.3rem 0.1rem;
		border-bottom: 1px dotted #8a7458;
		color: #2b4c9b;
		font-family: 'LXGW WenKai TC', var(--font-display);
		font-size: 0.95rem;
	}
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.9rem 0.8rem;
		margin-top: 1.2rem;
	}
	.tag {
		position: relative;
		display: inline-block;
		padding: 0.2rem 0.75rem 0.25rem 1.35rem;
		border-radius: 2px 4px 4px 2px;
		background: linear-gradient(160deg, #ecd9a8, #dcc48a);
		color: #3b2a1c;
		font-size: 0.8rem;
		clip-path: polygon(0.55rem 0, 100% 0, 100% 100%, 0.55rem 100%, 0 50%);
		transition:
			translate 0.15s,
			background 0.15s;
	}
	.tag::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 0.6rem;
		width: 0.35rem;
		height: 0.35rem;
		margin-top: -0.175rem;
		border-radius: 50%;
		background: #fbf6e9;
		box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.25);
	}
	.tag:hover {
		translate: 0 -2px;
		background: linear-gradient(160deg, #f2e2b8, #e4cd95);
		color: #8e1d12;
	}
	@media (prefers-reduced-motion: reduce) {
		.stamp,
		.key {
			animation: none;
		}
		.caret {
			display: none;
		}
	}
</style>
