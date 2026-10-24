<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import CommentThread from '$lib/components/CommentThread.svelte';
	import { resolve } from '$app/paths';
	import { reveal } from '$lib/actions/reveal';
	import Star from '@lucide/svelte/icons/star';
	import LikeButton from '$lib/components/LikeButton.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

</script>

<Seo
	title={data.item.title}
	description={data.item.overview}
	image={data.item.backdropUrl ?? data.item.posterUrl ?? undefined}
/>

<div class="mx-auto max-w-4xl px-6 pt-28 pb-16">
	{#if data.item.backdropUrl}
		<div class="relative -mt-8 mb-6 overflow-hidden rounded-2xl">
			<img src={data.item.backdropUrl} alt="" class="h-56 w-full object-cover opacity-40" />
		</div>
	{/if}

	<div use:reveal class="flex flex-col gap-6 sm:flex-row">
		{#if data.item.posterUrl}
			<img
				src={data.item.posterUrl}
				alt={data.item.title}
				class="h-72 w-auto shrink-0 self-start rounded-xl object-cover shadow-md"
			/>
		{/if}

		<article class="min-w-0">
			<span class="rounded-full border border-border-case px-2 py-0.5 text-xs text-ink-muted">
				{data.item.mediaType === 'movie' ? '電影' : '影集'}
			</span>
			<h1 class="mt-2 font-display text-3xl text-ink sm:text-4xl">{data.item.title}</h1>

			<div class="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
				{#if data.item.voteAverage}
					<span class="flex items-center gap-1">
						<Star class="size-4 fill-brass text-brass" />
						{data.item.voteAverage.toFixed(1)} / TMDB
					</span>
				{/if}
				{#if data.item.releaseDate}
					<span>{data.item.releaseDate}</span>
				{/if}
				{#if data.item.mediaType === 'tv' && data.item.currentSeason}
					<span>
						第 {data.item.currentSeason} 季 第 {data.item.currentEpisode ?? '?'} 集
						{#if data.item.totalSeasons}（共 {data.item.totalSeasons} 季）{/if}
					</span>
				{/if}
			</div>

			{#if data.item.overview}
				<p class="mt-4 text-sm leading-relaxed text-ink-muted">{data.item.overview}</p>
			{/if}

			<div class="mt-4">
				<LikeButton liked={data.liked} count={data.likeCount} signedIn={!!data.user} />
			</div>
		</article>
	</div>

	{#if data.item.cast.length}
		<section class="mt-10">
			<h2 class="section-title">演員</h2>
			<ul class="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5">
				{#each data.item.cast as member, i (member.id)}
					<li use:reveal={{ delay: Math.min(i * 30, 300), y: 10 }} class="text-center">
						<a
							href={resolve('/watch/actor/[personId]', { personId: String(member.tmdbPersonId) })}
							class="group block"
						>
							{#if member.profileUrl}
								<img
									src={member.profileUrl}
									alt={member.name}
									class="mx-auto aspect-[2/3] w-full rounded-lg object-cover shadow-sm"
								/>
							{:else}
								<div
									class="mx-auto flex aspect-[2/3] w-full items-center justify-center rounded-lg bg-surface-alt text-xs text-ink-muted"
								>
									無照片
								</div>
							{/if}
							<p class="mt-1.5 truncate text-sm font-medium text-ink group-hover:underline">
								{member.name}
							</p>
							{#if member.character}
								<p class="truncate text-xs text-ink-muted">{member.character}</p>
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<CommentThread
		comments={data.comments}
		message={form && 'message' in form ? (form.message as string) : undefined}
		title="留言"
	/>
</div>
