<!--
	Every page opens on its case-file cover: the file number, then the title
	set letter by letter, the description after it, and once the title has
	landed a rubber stamp comes down beside it. A rule draws itself under it all.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';

	let {
		title,
		description,
		stamp = '歸檔',
		children
	}: {
		title: string;
		description?: string;
		/** Text inside the rubber stamp (2–4 characters reads best). */
		stamp?: string;
		/** Extra content under the description (stats, search, …). */
		children?: Snippet;
	} = $props();

	// A stable file number per page, so the same page always has the same "case".
	const fileNo = $derived.by(() => {
		let h = 7;
		for (const ch of page.url.pathname) h = (h * 31 + ch.charCodeAt(0)) % 9973;
		return String(h).padStart(4, '0');
	});
	const letters = $derived([...title]);
	// When the last letter lands: the stamp and the rest follow it.
	const landed = $derived(0.25 + letters.length * 0.045 + 0.35);
</script>

<header class="cover relative pt-28 pb-10 sm:pt-32" style="--landed: {landed}s">
	<p class="file-no font-mono-hack">FILE № {fileNo}</p>

	<div class="title-row">
		<h1 class="font-display text-ink" aria-label={title}>
			{#each letters as ch, i (i)}<span
					class="ch"
					class:sp={ch === ' '}
					style="--i: {i}"
					aria-hidden="true">{ch}</span
				>{/each}
		</h1>
		<span class="stamp" aria-hidden="true">{stamp}</span>
	</div>

	{#if description}
		<p class="desc">{description}</p>
	{/if}

	{#if children}
		<div class="extra mt-8">{@render children()}</div>
	{/if}

	<span aria-hidden="true" class="rule"></span>
</header>

<style>
	.file-no {
		color: var(--color-ink-muted);
		font-size: 0.72rem;
		letter-spacing: 0.18em;
		animation: rise 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.1s both;
	}
	.title-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem 1.4rem;
		margin-top: 0.7rem;
	}
	h1 {
		font-size: clamp(2.6rem, 6vw, 4.2rem);
		line-height: 1.05;
		letter-spacing: -0.01em;
	}
	/* Each letter comes up out of the paper, one after another. */
	.ch {
		display: inline-block;
		animation: letter 0.7s cubic-bezier(0.2, 0.9, 0.25, 1.15) calc(0.25s + var(--i) * 0.045s) both;
	}
	.sp {
		width: 0.28em;
	}
	@keyframes letter {
		from {
			opacity: 0;
			transform: translateY(0.45em) rotate(6deg);
		}
	}

	/* Rubber stamp: comes down hard once the title has landed, ink a little uneven. */
	.stamp {
		padding: 0.2rem 0.7rem;
		border: 2px solid var(--color-accent);
		border-radius: 4px;
		outline: 1px solid var(--color-accent);
		outline-offset: 2px;
		/* The deeper red keeps the text above 4.5:1 even while it's fading in. */
		color: var(--color-accent-strong);
		font-family: 'LXGW WenKai TC', var(--font-display);
		font-size: 1rem;
		font-weight: 700;
		letter-spacing: 0.3em;
		white-space: nowrap;
		mix-blend-mode: multiply;
		mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='60'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.8' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -2.2 1.6'/%3E%3C/filter%3E%3Crect width='120' height='60' filter='url(%23n)'/%3E%3C/svg%3E");
		rotate: -7deg;
		animation: stamp-down 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.2) var(--landed) both;
	}
	@keyframes stamp-down {
		0% {
			opacity: 0;
			transform: scale(2.2) rotate(-8deg);
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

	.desc {
		max-width: 42rem;
		margin-top: 1rem;
		color: var(--color-ink-muted);
		font-size: clamp(0.9rem, 1.6vw, 1.02rem);
		line-height: 1.75;
		animation: rise 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) calc(var(--landed) - 0.25s) both;
	}
	.extra {
		animation: rise 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) calc(var(--landed) - 0.1s) both;
	}
	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
	}

	/* A rule that draws itself across the sheet, from a red pin at its start. */
	.rule {
		position: relative;
		display: block;
		height: 1px;
		margin-top: 2rem;
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
		.file-no,
		.ch,
		.stamp,
		.desc,
		.extra,
		.rule {
			animation: none;
		}
	}
</style>
