<!--
	Every page opens on its case-file cover: file number and drawer typed along
	the top, the title typed in, then a rubber stamp comes down on the corner.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { drawerFor } from '$lib/site-nav';

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

	const drawer = $derived(drawerFor(page.url.pathname));

	// A stable file number per page, so the same page always has the same "case".
	const fileNo = $derived.by(() => {
		let h = 7;
		for (const ch of page.url.pathname) h = (h * 31 + ch.charCodeAt(0)) % 9973;
		return String(h).padStart(4, '0');
	});
</script>

<header class="cover relative pt-28 pb-10 sm:pt-32">
	<p
		class="flex flex-wrap items-center gap-x-3 font-mono-hack text-xs tracking-widest text-ink-muted"
	>
		<span>FILE № {fileNo}</span>
		{#if drawer && drawer.id !== 'cover'}
			<span aria-hidden="true" class="h-px w-6 bg-border-case"></span>
			<span>{drawer.label}</span>
		{/if}
	</p>

	<div class="relative mt-4 inline-block pr-28 sm:pr-36">
		<svg
			aria-hidden="true"
			class="clip absolute -top-6 -left-7 h-12 w-5 text-case-500"
			viewBox="0 0 20 48"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
		>
			<path d="M6 44V10a4 4 0 0 1 8 0v30a6 6 0 0 1-12 0V8a8 8 0 0 1 16 0v28" />
		</svg>
		<h1 class="font-display text-4xl leading-tight text-ink sm:text-5xl">
			<span class="title-ink">{title}</span>
		</h1>
		<span class="stamp" aria-hidden="true">{stamp}</span>
	</div>

	{#if description}
		<p class="mt-4 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">
			{description}
		</p>
	{/if}

	<span aria-hidden="true" class="perforation mt-8 block"></span>

	{#if children}
		<div class="mt-8">{@render children()}</div>
	{/if}
</header>

<style>
	/* The title types itself in; negative insets leave room for overhanging
	   glyphs and the end state drops the clip so nothing stays trimmed. */
	.title-ink {
		display: inline-block;
		animation: type-in 0.9s steps(14, end) both;
	}
	@keyframes type-in {
		from {
			clip-path: inset(-0.4em 100% -0.4em -0.2em);
		}
		99% {
			clip-path: inset(-0.4em -0.2em -0.4em -0.2em);
		}
		to {
			clip-path: none;
		}
	}

	/* Rubber stamp: comes down hard after the title, ink slightly uneven. */
	.stamp {
		position: absolute;
		right: 0;
		top: 50%;
		padding: 0.15rem 0.6rem;
		border: 3px double var(--color-accent);
		border-radius: 4px;
		/* The deeper red keeps the text above 4.5:1 even while it's fading in. */
		color: var(--color-accent-strong);
		font-family: var(--font-display);
		font-size: 1.1rem;
		letter-spacing: 0.25em;
		white-space: nowrap;
		/* The ink texture comes from the mask; at .85 the red text fell under 4.5:1. */
		opacity: 0.95;
		transform: translateY(-50%) rotate(-9deg);
		mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='60'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.8' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -2.2 1.6'/%3E%3C/filter%3E%3Crect width='120' height='60' filter='url(%23n)'/%3E%3C/svg%3E");
		animation: stamp-down 0.45s 0.95s cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
	}
	@keyframes stamp-down {
		0% {
			opacity: 0;
			transform: translateY(-50%) rotate(-18deg) scale(2.1);
		}
		70% {
			opacity: 0.95;
			transform: translateY(-50%) rotate(-8deg) scale(0.96);
		}
		100% {
			opacity: 0.85;
			transform: translateY(-50%) rotate(-9deg) scale(1);
		}
	}

	.clip {
		animation: clip-in 0.5s 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
	}
	@keyframes clip-in {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
	}

	/* Tear-off perforation instead of a hairline rule. */
	.perforation {
		height: 2px;
		background-image: radial-gradient(circle, var(--color-border-case) 1.2px, transparent 1.6px);
		background-size: 10px 2px;
		background-repeat: repeat-x;
	}

	@media (prefers-reduced-motion: reduce) {
		.title-ink,
		.stamp,
		.clip {
			animation: none;
		}
	}
</style>
