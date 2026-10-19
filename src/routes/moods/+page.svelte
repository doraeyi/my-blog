<script lang="ts">
	import { tilt } from '$lib/actions/tilt';
	import Seo from '$lib/components/Seo.svelte';
	import { resolve } from '$app/paths';
	import { reveal } from '$lib/actions/reveal';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Seo title="心情" description="工作與生活之間的碎碎念。" />

<div class="mx-auto max-w-3xl px-6 pt-28 pb-16">
	<h1 class="font-display text-3xl font-bold text-ink">心情</h1>

	{#if data.posts.length === 0}
		<p class="mt-8 text-sm text-ink-muted">還沒有心情文章。</p>
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
					href={resolve('/moods/[slug]', { slug: post.slug })}
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
