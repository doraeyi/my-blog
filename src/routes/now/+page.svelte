<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import { resolve } from '$app/paths';
	import { reveal } from '$lib/actions/reveal';
	import { now } from '$lib/now';
	import Briefcase from '@lucide/svelte/icons/briefcase';
	import GraduationCap from '@lucide/svelte/icons/graduation-cap';
	import Lightbulb from '@lucide/svelte/icons/lightbulb';
	import Clapperboard from '@lucide/svelte/icons/clapperboard';
	import PenLine from '@lucide/svelte/icons/pen-line';
	import FolderGit2 from '@lucide/svelte/icons/folder-git-2';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const lists = [
		{ title: '正在做', icon: Briefcase, items: now.doing },
		{ title: '正在學', icon: GraduationCap, items: now.learning },
		{ title: '正在想', icon: Lightbulb, items: now.thinking }
	].filter((l) => l.items.length > 0);
</script>

<Seo title="現在" description="我最近在做什麼、學什麼、看什麼。" />

<div class="mx-auto max-w-3xl px-6 pt-28 pb-16">
	<p class="font-mono-hack text-xs tracking-[0.3em] text-accent uppercase">
		Live Surveillance // 現況回報
	</p>
	<h1 class="mt-2 font-display text-3xl font-bold text-ink">現在</h1>
	<p class="mt-2 flex items-center gap-2 font-mono-hack text-xs text-ink-muted">
		<span class="relative flex size-2">
			<span
				class="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60 motion-reduce:animate-none"
			></span>
			<span class="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
		</span>
		最後更新 {now.updatedAt} · {now.location}
	</p>

	<div class="mt-10 space-y-8">
		{#each lists as list, i (list.title)}
			<section use:reveal={{ delay: i * 80 }}>
				<h2 class="flex items-center gap-2 font-display text-lg text-ink">
					<list.icon class="size-4 text-accent" />
					{list.title}
				</h2>
				<ul class="mt-3 space-y-2 border-l-2 border-border-case pl-5">
					{#each list.items as item (item)}
						<li class="text-ink-muted">{item}</li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>

	<div class="mt-14 grid gap-5 sm:grid-cols-2">
		<section
			use:reveal
			class="rounded-md border border-border-case bg-surface/75 p-5 backdrop-blur-sm"
		>
			<h2
				class="flex items-center gap-2 font-mono-hack text-xs tracking-[0.2em] text-ink-muted uppercase"
			>
				<Clapperboard class="size-3.5 text-accent" /> 正在看
			</h2>
			{#if data.watching}
				<a
					href={resolve('/watch/[id]', { id: data.watching.id })}
					class="mt-4 flex gap-4 transition hover:opacity-80"
				>
					{#if data.watching.posterUrl}
						<img
							src={data.watching.posterUrl}
							alt=""
							class="h-28 w-20 shrink-0 rounded object-cover shadow"
						/>
					{/if}
					<div>
						<p class="font-medium text-ink">{data.watching.title}</p>
						{#if data.watching.mediaType === 'tv' && data.watching.episode}
							<p class="mt-1 font-mono-hack text-xs text-ink-muted">
								S{data.watching.season ?? 1} · E{data.watching.episode}
								{#if data.watching.totalEpisodes}/ {data.watching.totalEpisodes} 集{/if}
							</p>
						{/if}
					</div>
				</a>
			{:else}
				<p class="mt-4 text-sm text-ink-muted">目前沒有在追的劇。</p>
			{/if}
			{#if data.recentlyWatched.length > 0}
				<p class="mt-5 text-xs text-ink-muted">最近看完</p>
				<div class="mt-2 flex gap-2">
					{#each data.recentlyWatched as w (w.id)}
						<a href={resolve('/watch/[id]', { id: w.id })} title={w.title}>
							{#if w.posterUrl}
								<img src={w.posterUrl} alt={w.title} class="h-16 w-11 rounded object-cover" />
							{:else}
								<span
									class="flex h-16 w-11 items-center justify-center rounded bg-surface-alt text-[0.6rem] text-ink-muted"
									>{w.title.slice(0, 4)}</span
								>
							{/if}
						</a>
					{/each}
				</div>
			{/if}
		</section>

		<section
			use:reveal={{ delay: 80 }}
			class="rounded-md border border-border-case bg-surface/75 p-5 backdrop-blur-sm"
		>
			<h2
				class="flex items-center gap-2 font-mono-hack text-xs tracking-[0.2em] text-ink-muted uppercase"
			>
				<PenLine class="size-3.5 text-accent" /> 最近寫的
			</h2>
			<ul class="mt-4 space-y-3">
				{#each data.latest as post (post.path)}
					<li>
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- path comes from the server-built content index -->
						<a href={post.path} class="group block">
							<span class="text-sm text-ink transition group-hover:text-accent">{post.title}</span>
							<span class="block font-mono-hack text-[0.7rem] text-ink-muted">
								{post.type} · {post.date.toLocaleDateString('zh-TW')}
							</span>
						</a>
					</li>
				{:else}
					<li class="text-sm text-ink-muted">還沒有文章。</li>
				{/each}
			</ul>
		</section>
	</div>

	{#if data.projects.length > 0}
		<section
			use:reveal
			class="mt-5 rounded-md border border-border-case bg-surface/75 p-5 backdrop-blur-sm"
		>
			<h2
				class="flex items-center gap-2 font-mono-hack text-xs tracking-[0.2em] text-ink-muted uppercase"
			>
				<FolderGit2 class="size-3.5 text-accent" /> 手上的專案
			</h2>
			<ul class="mt-4 grid gap-3 sm:grid-cols-3">
				{#each data.projects as p (p.id)}
					<li>
						<a href={resolve('/portfolio/[id]', { id: p.id })} class="group block">
							<span class="text-sm font-medium text-ink transition group-hover:text-accent"
								>{p.name}</span
							>
							{#if p.description}
								<span class="mt-0.5 line-clamp-2 block text-xs text-ink-muted">{p.description}</span
								>
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<p class="mt-12 text-xs text-ink-muted">
		這是一個 <a href="https://nownownow.com/about" class="underline hover:text-accent">/now 頁面</a
		>，靈感來自 Derek Sivers。
	</p>
</div>
