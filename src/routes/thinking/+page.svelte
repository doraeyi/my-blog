<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import PinString from '$lib/components/PinString.svelte';
	import { pinned } from '$lib/actions/pinned';
	import { timeAgo } from '$lib/format';
	import Globe from '@lucide/svelte/icons/globe';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Seo title="現場筆記" description="想到什麼寫什麼，看完什麼順手丟上來。" />

<div class="mx-auto max-w-3xl px-6 pb-16">
	<PageHeader title="現場筆記" stamp="速記" description="想到什麼寫什麼，看完什麼順手丟上來。" />

	{#if data.thoughts.length === 0}
		<p class="py-16 text-center text-sm text-ink-muted">還沒有碎念。安靜也是一種狀態。</p>
	{:else}
		<!-- Slips pinned down the board, left and right, on one string -->
		<PinString class="slips">
			{#each data.thoughts as t, i (t.id)}
				<div class="slip" class:right={i % 2} use:pinned={{ delay: 60, tilt: i % 2 ? 1.1 : -0.9 }}>
					<p class="slip-time font-mono-hack">
						<time datetime={t.createdAt.toISOString()} title={t.createdAt.toLocaleString('zh-TW')}>
							{timeAgo(t.createdAt)}
						</time>
						<span>No.{String(data.thoughts.length - i).padStart(3, '0')}</span>
					</p>
					<p class="slip-body">{t.body}</p>
					{#if t.linkUrl}
						<!-- eslint-disable svelte/no-navigation-without-resolve -- external link the author attached -->
						<a href={t.linkUrl} target="_blank" rel="noopener" class="slip-link">
							<Globe class="size-4 shrink-0" />
							<span class="truncate">{t.linkHost}</span>
							<ArrowUpRight class="arrow ml-auto size-4 shrink-0" />
						</a>
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
					{/if}
				</div>
			{/each}
		</PinString>
		<p class="mt-14 text-center text-sm text-ink-muted/80 italic">更多時候，只是想說給空氣聽。</p>
	{/if}
</div>

<style>
	:global(.slips) {
		display: flex;
		flex-direction: column;
		gap: 2.6rem;
		margin-top: 3rem;
	}
	/* A memo slip: pale yellow, faint rules */
	.slip {
		width: min(100%, 30rem);
		padding: 1.3rem 1.3rem 1.1rem;
		border-radius: 2px;
		background:
			repeating-linear-gradient(
				180deg,
				transparent 0 1.85rem,
				rgb(43 76 155 / 0.1) 1.85rem calc(1.85rem + 1px)
			),
			linear-gradient(180deg, #fff8dc, #fbf0c9);
		background-position: 0 2.6rem;
		box-shadow:
			0 1px 2px rgb(40 25 10 / 0.1),
			0 14px 26px -14px rgb(40 25 10 / 0.4);
	}
	.slip.right {
		align-self: flex-end;
	}
	.slip-time {
		display: flex;
		justify-content: space-between;
		color: #76603f;
		font-size: 0.7rem;
		letter-spacing: 0.1em;
	}
	.slip-body {
		margin-top: 0.6rem;
		color: var(--color-ink);
		font-size: 1rem;
		line-height: 1.85rem;
		white-space: pre-line;
	}
	.slip-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.8rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid rgb(60 40 20 / 0.15);
		border-radius: 6px;
		background: rgb(255 255 255 / 0.55);
		color: var(--color-ink-muted);
		font-size: 0.85rem;
		transition:
			border-color 0.2s,
			color 0.2s;
	}
	.slip-link:hover {
		border-color: var(--color-accent);
		color: var(--color-ink);
	}
	.slip-link :global(.arrow) {
		transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.slip-link:hover :global(.arrow) {
		transform: translate(2px, -2px);
	}
	@media (max-width: 639px) {
		.slip {
			width: 92%;
		}
	}
</style>
