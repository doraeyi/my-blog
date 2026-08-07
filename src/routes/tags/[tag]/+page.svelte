<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<h1 class="text-3xl font-bold">#{data.tag}</h1>

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
		</li>
	{/each}
</ul>
