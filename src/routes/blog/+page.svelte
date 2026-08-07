<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<h1 class="text-3xl font-bold">Blog</h1>

<ul class="mt-6 space-y-8">
	{#each data.posts as post (post.slug)}
		<li>
			<a
				class="text-xl font-semibold hover:underline"
				href={resolve('/blog/[slug]', { slug: post.slug })}>{post.title}</a
			>
			<p class="text-sm text-gray-500">{post.date}</p>
			{#if post.excerpt}
				<p class="mt-1">{post.excerpt}</p>
			{/if}
			{#if post.tags?.length}
				<div class="mt-2 flex gap-2">
					{#each post.tags as tag (tag)}
						<a class="text-xs text-gray-500 hover:underline" href={resolve('/tags/[tag]', { tag })}
							>#{tag}</a
						>
					{/each}
				</div>
			{/if}
		</li>
	{/each}
</ul>
