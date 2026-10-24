<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { reveal } from '$lib/actions/reveal';
	import { timeAgo } from '$lib/format';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Seo title="通知" noindex />

<div class="mx-auto max-w-3xl px-6 pb-16">
	<PageHeader title="通知" stamp="收件" description="有人回覆你的留言時，會出現在這裡。" />

	{#if data.items.length === 0}
		<p class="text-sm text-ink-muted">目前沒有通知。</p>
	{:else}
		<ul class="space-y-3">
			{#each data.items as n, i (n.id)}
				<li use:reveal={{ delay: Math.min(i, 8) * 40, y: 8 }}>
					<!-- eslint-disable svelte/no-navigation-without-resolve -- url is a site path stored when the reply was made -->
					<a
						href={n.url}
						class="index-card block rounded-sm px-5 py-4 transition hover:-translate-y-0.5"
					>
						<p class="flex flex-wrap items-baseline gap-x-2 text-sm text-case-900">
							{#if !n.readAt}
								<span class="date-stamp">新</span>
							{/if}
							<span class="font-medium">{n.actorName}</span>
							{n.summary}
						</p>
						{#if n.excerpt}
							<p class="mt-2 border-l-2 border-stamp-400/60 pl-3 text-sm text-case-700">
								{n.excerpt}
							</p>
						{/if}
						<time class="mt-2 block font-mono-hack text-xs text-case-700">
							{timeAgo(n.createdAt)}
						</time>
					</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				</li>
			{/each}
		</ul>
	{/if}
</div>
