<script lang="ts">
	import { tilt } from '$lib/actions/tilt';
	import Seo from '$lib/components/Seo.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { resolve } from '$app/paths';
	import { reveal } from '$lib/actions/reveal';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Seo title="#{data.tag}" description="標籤「{data.tag}」下的所有文章。" />

<div class="mx-auto max-w-3xl px-6 pb-16">
	<PageHeader title={`#${data.tag}`} stamp="證物" description={`共 ${data.posts.length} 篇`}>
		<a
			href={resolve('/tags')}
			class="font-mono-hack text-xs tracking-widest text-accent hover:underline">← 所有標籤</a
		>
	</PageHeader>

	<!-- eslint-disable svelte/no-navigation-without-resolve -- paths come from the server-built content index -->
	<ul class="mt-8 space-y-4">
		{#each data.posts as post, i (post.path)}
			<li use:reveal={{ delay: i * 60 }}>
				<a
					href={post.path}
					use:tilt
					class="case-card block rounded-lg border border-border-case bg-surface p-5"
				>
					<p class="font-mono-hack text-xs tracking-widest text-accent">
						{post.type} · {post.date.toLocaleDateString('zh-TW')}
					</p>
					<p class="mt-1 text-xl font-semibold text-ink">{post.title}</p>
					{#if post.excerpt}
						<p class="mt-1.5 text-ink-muted">{post.excerpt}</p>
					{/if}
				</a>
			</li>
		{/each}
	</ul>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
</div>
