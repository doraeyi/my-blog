<script lang="ts">
	import { tilt } from '$lib/actions/tilt';
	import Seo from '$lib/components/Seo.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { resolve } from '$app/paths';
	import { reveal } from '$lib/actions/reveal';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Seo title="技術文章" description="前端、SvelteKit 與各種工程筆記。" />

<div class="mx-auto max-w-3xl px-6 pb-16">
	<PageHeader title="技術文章" stamp="技術" description="前端、SvelteKit 與各種工程筆記。" />

	{#if data.posts.length === 0}
		<p class="mt-8 text-sm text-ink-muted">還沒有文章。</p>
	{/if}

	<ul class="mt-8 space-y-4">
		{#each data.posts as post, i (post.id)}
			<li
				use:reveal={{ delay: i * 60 }}
				use:tilt
				class="case-card relative rounded-lg border border-border-case bg-surface p-5"
			>
				<span
					aria-hidden="true"
					class="absolute -top-2 left-4 h-2 w-10 rounded-t-sm border border-b-0 border-border-case bg-surface-alt"
				></span>
				<p class="font-display text-xs tracking-widest text-accent uppercase">
					{post.createdAt.toLocaleDateString('zh-TW')}
				</p>
				<a
					class="mt-1 block text-xl font-semibold text-ink hover:underline"
					href={resolve('/articles/[slug]', { slug: post.slug })}
				>
					{post.title}
				</a>
				{#if post.excerpt}
					<p class="mt-1.5 text-ink-muted">{post.excerpt}</p>
				{/if}
			</li>
		{/each}
	</ul>
</div>
