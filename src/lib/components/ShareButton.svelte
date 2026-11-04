<!--
	Passing the file on: the phone's share sheet where there is one, otherwise
	the link is copied and the slip says so.
-->
<script lang="ts">
	import { page } from '$app/state';
	import Share from '@lucide/svelte/icons/share-2';
	import Check from '@lucide/svelte/icons/check';

	let { title }: { title: string } = $props();

	let copied = $state(false);

	async function share() {
		const url = page.url.origin + page.url.pathname;
		if (navigator.share) {
			try {
				await navigator.share({ title, url });
				return;
			} catch (e) {
				// Dismissing the sheet is a choice, not a reason to copy instead.
				if ((e as DOMException).name === 'AbortError') return;
			}
		}
		try {
			await navigator.clipboard.writeText(url);
			copied = true;
			setTimeout(() => (copied = false), 1800);
		} catch {
			// No clipboard access (insecure context): nothing more we can do quietly.
		}
	}
</script>

<button type="button" class="share" onclick={share} aria-live="polite">
	{#if copied}
		<Check class="size-4" aria-hidden="true" />已複製連結
	{:else}
		<Share class="size-4" aria-hidden="true" />轉寄這份檔案
	{/if}
</button>

<style>
	.share {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.45rem 0.9rem;
		border: 1px dashed rgb(60 40 20 / 0.35);
		border-radius: 2px;
		background: rgb(255 252 240 / 0.6);
		color: var(--color-case-800);
		font-size: 0.85rem;
		rotate: -1deg;
		transition:
			rotate 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
			border-color 0.2s,
			color 0.2s;
	}
	.share:hover,
	.share:focus-visible {
		border-color: var(--color-accent);
		color: var(--color-accent);
		rotate: 0deg;
	}
	@media (prefers-reduced-motion: reduce) {
		.share {
			transition: none;
		}
	}
</style>
