<script lang="ts">
	import { inkReveal } from '$lib/actions/ink';
	import CaseClosed from '$lib/components/CaseClosed.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import CommentThread from '$lib/components/CommentThread.svelte';
	import CaseHeader from '$lib/components/CaseHeader.svelte';
	import SeriesBox from '$lib/components/SeriesBox.svelte';
	import PostFooterNav from '$lib/components/PostFooterNav.svelte';
	import LikeButton from '$lib/components/LikeButton.svelte';
	import ShareButton from '$lib/components/ShareButton.svelte';
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
			<div>
				<CaseHeader
					kind="blog"
					title={data.metadata.title}
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
				use:inkReveal={data.metadata.title}
				class="prose prose-sm mt-8 max-w-none sm:prose-base dark:prose-invert"
			>
				<Post />
			</div>

			<CaseClosed />
		</article>

		<div class="mt-2 flex flex-wrap items-center justify-center gap-5">
			<LikeButton liked={data.liked} count={data.likeCount} signedIn={!!data.user} />
			<ShareButton title={data.metadata.title} />
		</div>

		{#if data.nav}
			<PostFooterNav nav={data.nav} />
		{/if}

		<PostMentions mentions={data.mentions} />

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
