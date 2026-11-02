<!--
	Where a page ends: no website footer, just the close of the file — a 本卷完
	stamp, the way back to the board, and the few things worth keeping at hand
	(subscribe, RSS, contact). Quiet under a post, which has closed with its
	own 結案 stamp: just the rule and the links.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { contactEmail } from '$lib/social-links';

	let { quiet = false }: { quiet?: boolean } = $props();
</script>

<footer
	class="case-end mx-auto mb-16 max-w-3xl px-6 text-center {quiet ? 'mt-12' : 'mt-24'}"
	aria-label="本卷完"
>
	<div class="rule" aria-hidden="true"></div>
	{#if !quiet}
		<p class="stamp font-display">本卷完</p>
		<p class="mt-2 font-mono-hack text-[11px] tracking-[0.3em] text-ink-muted">
			END OF FILE · © {new Date().getFullYear()} LIAM
		</p>
	{/if}
	<nav
		class="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm"
		aria-label="收尾"
	>
		<a href={resolve('/')} class="text-accent hover:underline">← 回案件板</a>
		<a href={resolve('/subscribe')} class="text-ink-muted hover:text-accent">訂閱新檔案</a>
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- feed file -->
		<a href="/rss.xml" class="text-ink-muted hover:text-accent">RSS</a>
		<a href="mailto:{contactEmail}" class="text-ink-muted hover:text-accent">寫信給 Liam</a>
	</nav>
</footer>

<style>
	.rule {
		height: 1px;
		margin-bottom: 2.25rem;
		background: repeating-linear-gradient(
			90deg,
			var(--color-border-case) 0 6px,
			transparent 6px 12px
		);
	}
	.stamp {
		display: inline-block;
		padding: 0.2rem 1.1rem;
		border: 3px double var(--color-accent);
		color: var(--color-accent-strong);
		font-size: 1.25rem;
		letter-spacing: 0.4em;
		rotate: -4deg;
	}
</style>
