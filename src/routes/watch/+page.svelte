<script lang="ts">
	import { tilt } from '$lib/actions/tilt';
	import Seo from '$lib/components/Seo.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { resolve } from '$app/paths';
	import { reveal } from '$lib/actions/reveal';
	import { pinned } from '$lib/actions/pinned';
	import PinString from '$lib/components/PinString.svelte';
	import Star from '@lucide/svelte/icons/star';
	import Clapperboard from '@lucide/svelte/icons/clapperboard';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Seo title="追劇紀錄" description="最近在看與看過的電影、影集。" />

<div class="mx-auto max-w-5xl px-6 pb-16">
	<PageHeader title="追劇紀錄" stamp="監視" description="我看過的電影與影集。" />

	<h2 class="section-title mt-10" use:reveal>正在觀看</h2>
	{#if data.current}
		{@const current = data.current}
		<a
			use:reveal
			href={resolve('/watch/[id]', { id: current.id })}
			use:tilt
			class="case-card group relative mt-4 flex overflow-hidden rounded-2xl border border-border-case bg-surface shadow-sm"
		>
			{#if current.backdropUrl}
				<img
					src={current.backdropUrl}
					alt=""
					class="absolute inset-0 h-full w-full object-cover opacity-15"
				/>
			{/if}
			<div class="relative flex w-full flex-col gap-4 p-6 sm:flex-row">
				{#if current.posterUrl}
					<img
						src={current.posterUrl}
						alt={current.title}
						class="h-56 w-auto shrink-0 rounded-xl object-cover shadow-md"
					/>
				{/if}
				<div class="min-w-0">
					{#if current.live}
						<span
							class="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-white"
						>
							<span class="relative flex size-2">
								<span
									class="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-70"
								></span>
								<span class="relative inline-flex size-2 rounded-full bg-white"></span>
							</span>
							正在觀看{#if current.currentEpisode}
								· 第 {current.currentEpisode} 集{/if}
						</span>
					{:else}
						<span
							class="inline-flex items-center gap-1 rounded-full border border-accent/50 px-2 py-0.5 text-xs text-accent"
						>
							<Clapperboard class="size-3.5" />
							觀看中
						</span>
					{/if}
					<h3 class="mt-2 font-display text-2xl font-semibold text-ink group-hover:underline">
						{current.title}
					</h3>
					{#if current.voteAverage}
						<p class="mt-1.5 flex items-center gap-1 text-sm text-ink-muted">
							<Star class="size-4 fill-brass text-brass" />
							{current.voteAverage.toFixed(1)}
						</p>
					{/if}
					{#if current.mediaType === 'tv' && current.currentSeason}
						<p class="mt-1 text-sm text-ink-muted">
							第 {current.currentSeason} 季 第 {current.currentEpisode ?? '?'} 集
							{#if current.totalSeasons}（共 {current.totalSeasons} 季）{/if}
						</p>
					{/if}
					{#if current.overview}
						<p class="mt-3 line-clamp-3 text-sm text-ink-muted">{current.overview}</p>
					{/if}
				</div>
			</div>
		</a>
	{:else}
		<p class="mt-4 text-sm text-ink-muted">目前沒有正在觀看的作品。</p>
	{/if}

	<h2 class="section-title mt-12" use:reveal>看過的</h2>
	{#if data.watched.length === 0}
		<p class="mt-4 text-sm text-ink-muted">還沒有紀錄。</p>
	{/if}

	<PinString class="mt-6">
		<ul class="grid grid-cols-2 gap-x-5 gap-y-9 pt-2 sm:grid-cols-3 md:grid-cols-4">
			{#each data.watched as item, i (item.id)}
				<li>
					<a
						href={resolve('/watch/[id]', { id: item.id })}
						use:pinned={{ delay: Math.min(i, 8) * 80, tilt: [-1.6, 1.1, -0.6, 1.4][i % 4] }}
						class="photo group flex flex-col"
					>
						{#if item.posterUrl}
							<img src={item.posterUrl} alt={item.title} class="aspect-[2/3] w-full object-cover" />
						{:else}
							<div class="flex aspect-[2/3] w-full items-center justify-center bg-surface-alt">
								<Clapperboard class="size-8 text-ink-muted" />
							</div>
						{/if}
						<div class="flex flex-1 flex-col gap-1 px-1 pt-2.5">
							<h3 class="line-clamp-2 font-display text-[0.95rem] leading-snug text-ink">
								<span class="ink-line">{item.title}</span>
							</h3>
							{#if item.voteAverage}
								<p class="mt-auto flex items-center gap-1 font-mono-hack text-xs text-ink-muted">
									<Star class="size-3 fill-brass text-brass" />
									{item.voteAverage.toFixed(1)}
								</p>
							{/if}
						</div>
					</a>
				</li>
			{/each}
		</ul>
	</PinString>
</div>

<style>
	/* Surveillance photos: a print with a white border, pinned up by its top edge.
	   The print warms up and comes into focus on hover. */
	.photo {
		padding: 0.55rem 0.55rem 0.75rem;
		background: #fffdf8;
		box-shadow:
			0 1px 2px rgb(40 25 10 / 0.1),
			0 14px 26px -14px rgb(40 25 10 / 0.42);
	}
	.photo img {
		filter: grayscale(0.55) contrast(1.05) sepia(0.15);
		transition: filter 0.6s ease;
	}
	.photo:hover img {
		filter: none;
	}
	.photo:hover {
		box-shadow:
			0 1px 2px rgb(40 25 10 / 0.1),
			0 28px 44px -20px rgb(40 25 10 / 0.5);
	}
</style>
