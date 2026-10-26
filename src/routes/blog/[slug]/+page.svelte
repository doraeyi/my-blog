<script lang="ts">
	import { reveal } from '$lib/actions/reveal';
	import Seo from '$lib/components/Seo.svelte';
	import CommentThread from '$lib/components/CommentThread.svelte';
	import PostMeta from '$lib/components/PostMeta.svelte';
	import SeriesBox from '$lib/components/SeriesBox.svelte';
	import PostFooterNav from '$lib/components/PostFooterNav.svelte';
	import LikeButton from '$lib/components/LikeButton.svelte';
	import SubscribeBox from '$lib/components/SubscribeBox.svelte';
	import PostMentions from '$lib/components/PostMentions.svelte';
	import ReadingProgress from '$lib/components/ReadingProgress.svelte';
	import { page } from '$app/state';
	import PostToc from '$lib/components/PostToc.svelte';
	import { proseEnhance } from '$lib/actions/prose';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let Post = $derived(data.component);
	let body: HTMLElement | undefined = $state();
</script>

<ReadingProgress path={page.url.pathname} />

<Seo
	title={data.metadata.title}
	description={data.metadata.excerpt}
	image={data.ogImage}
	type="article"
	publishedTime={new Date(data.metadata.date)}
	tags={data.metadata.tags}
/>

<div class="mx-auto max-w-6xl px-6 pt-28 pb-16 lg:flex lg:justify-center lg:gap-12">
	<div class="w-full max-w-3xl min-w-0">
		<article class="min-w-0">
			<div use:reveal>
				<h1 class="font-display text-3xl leading-snug text-ink sm:text-4xl">
					{data.metadata.title}
				</h1>
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

			<div class="lg:hidden">
				<PostToc container={body} variant="inline" />
			</div>

			<div
				bind:this={body}
				use:proseEnhance={data.metadata.title}
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

		<PostMentions mentions={data.mentions} />

		<div class="mt-10"><SubscribeBox /></div>

		<CommentThread
			comments={data.comments}
			message={form && 'message' in form ? (form.message as string) : undefined}
			title="留言"
		/>
	</div>

	<aside class="hidden w-56 shrink-0 lg:block">
		<div class="sticky top-28">
			<PostToc container={body} variant="side" />
		</div>
	</aside>
</div>
