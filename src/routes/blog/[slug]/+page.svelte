<script lang="ts">
	import { enhance } from '$app/forms';
	import { reveal } from '$lib/actions/reveal';
	import Seo from '$lib/components/Seo.svelte';
	import PostMeta from '$lib/components/PostMeta.svelte';
	import SeriesBox from '$lib/components/SeriesBox.svelte';
	import PostFooterNav from '$lib/components/PostFooterNav.svelte';
	import LikeButton from '$lib/components/LikeButton.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let Post = $derived(data.component);
	let message = $derived(form && 'message' in form ? form.message : undefined);
</script>

<Seo
	title={data.metadata.title}
	description={data.metadata.excerpt}
	image={data.ogImage}
	type="article"
	publishedTime={new Date(data.metadata.date)}
	tags={data.metadata.tags}
/>

<div class="mx-auto max-w-3xl px-6 pt-28 pb-16">
	<article class="min-w-0">
		<div use:reveal>
			<h1 class="font-display text-3xl leading-snug text-ink sm:text-4xl">{data.metadata.title}</h1>
			<PostMeta
				date={data.metadata.date}
				minutes={data.nav?.minutes}
				views={data.views}
				tags={data.metadata.tags}
			/>
		</div>

		{#if data.nav?.series}
			<SeriesBox series={data.nav.series} />
		{/if}

		<div
			use:reveal={{ delay: 100 }}
			class="prose prose-sm mt-8 max-w-none sm:prose-base dark:prose-invert"
		>
			<Post />
		</div>
	</article>

	{#if data.nav}
		<PostFooterNav nav={data.nav} />
	{/if}

	<div class="mt-8 flex justify-center">
		<LikeButton liked={data.liked} count={data.likeCount} signedIn={!!data.user} />
	</div>

	<section class="mt-8">
		<h2 class="section-title">留言（{data.comments.length}）</h2>

		<ul class="mt-4 space-y-3">
			{#each data.comments as comment, i (comment.id)}
				<li
					use:reveal={{ delay: i * 50, y: 8 }}
					class="rounded-xl border border-border-case bg-surface-alt p-4"
				>
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
				class="w-full rounded-lg border border-border-case bg-surface p-3 text-sm text-ink focus:border-accent focus:ring-2 focus:ring-accent/40 focus:outline-none"
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
