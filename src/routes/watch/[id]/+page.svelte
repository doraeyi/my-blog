<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Star from '@lucide/svelte/icons/star';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let liked = $derived(form && 'liked' in form ? form.liked : data.liked);
	let message = $derived(form && 'message' in form ? form.message : undefined);
</script>

<div class="mx-auto max-w-4xl px-6 pt-28 pb-16">
	{#if data.item.backdropUrl}
		<div class="relative -mt-8 mb-6 overflow-hidden rounded-2xl">
			<img src={data.item.backdropUrl} alt="" class="h-56 w-full object-cover opacity-40" />
		</div>
	{/if}

	<div class="flex flex-col gap-6 sm:flex-row">
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
			<h1 class="mt-2 text-3xl font-bold text-ink">{data.item.title}</h1>

			<div class="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
				{#if data.item.voteAverage}
					<span class="flex items-center gap-1">
						<Star class="size-4 text-yellow-500" />
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
				<form method="post" action="?/like" use:enhance>
					<button
						type="submit"
						class="rounded-md border border-border-case px-3 py-1 text-sm"
						class:bg-blue-600={liked}
						class:text-white={liked}
					>
						{liked ? '已按讚' : '按讚'} ({data.likeCount})
					</button>
				</form>
			</div>
		</article>
	</div>

	{#if data.item.cast.length}
		<section class="mt-10">
			<h2 class="text-lg font-semibold text-ink">演員</h2>
			<ul class="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5">
				{#each data.item.cast as member (member.id)}
					<li class="text-center">
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

	<section id="comments" class="mt-10">
		<h2 class="text-lg font-semibold text-ink">留言（{data.comments.length}）</h2>

		<ul class="mt-4 space-y-3">
			{#each data.comments as comment (comment.id)}
				<li class="rounded-xl border border-border-case bg-surface-alt p-4 shadow-sm">
					<span class="font-medium text-ink">{comment.author.name}</span>
					<p class="mt-1 text-sm text-ink-muted">{comment.body}</p>
				</li>
			{/each}
		</ul>

		<form method="post" action="?/comment" use:enhance class="mt-4 space-y-2">
			<textarea
				name="body"
				required
				rows="3"
				placeholder="留下你的想法..."
				class="w-full rounded-lg border border-border-case bg-surface p-3 text-sm text-ink focus:border-accent focus:ring-2 focus:ring-accent focus:outline-none"
			></textarea>
			<button
				type="submit"
				class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-strong"
			>
				送出留言
			</button>
		</form>
		{#if message}
			<p class="mt-2 text-sm text-stamp-500 dark:text-stamp-300">{message}</p>
		{/if}
	</section>
</div>
