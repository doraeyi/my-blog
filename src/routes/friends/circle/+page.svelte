<script lang="ts">
	import { resolve } from '$app/paths';
	import Seo from '$lib/components/Seo.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { reveal } from '$lib/actions/reveal';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Rss from '@lucide/svelte/icons/rss';
	import Dices from '@lucide/svelte/icons/dices';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const byId = $derived(new Map(data.members.map((m) => [m.id, m])));
	let who = $state<string | null>(null);
	const posts = $derived(who ? data.posts.filter((p) => p.friendId === who) : data.posts);

	// Grouped by month, newest first (the list already arrives sorted).
	const months = $derived.by(() => {
		const out: { label: string; items: typeof posts }[] = [];
		for (const p of posts) {
			const label = `${p.publishedAt.getFullYear()} 年 ${p.publishedAt.getMonth() + 1} 月`;
			const last = out.at(-1);
			if (last?.label === label) last.items.push(p);
			else out.push({ label, items: [p] });
		}
		return out;
	});

	const mmdd = (d: Date) =>
		`${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	const isNew = (d: Date) => Date.now() - d.getTime() < 3 * 24 * 60 * 60 * 1000;

	function luckyRead() {
		if (posts.length === 0) return;
		window.open(posts[Math.floor(Math.random() * posts.length)].url, '_blank', 'noopener');
	}
</script>

<Seo title="朋友圈" description="朋友們最近寫的文章，每 3 小時自動從他們的 RSS 更新。" />

<div class="mx-auto max-w-3xl px-6 pb-16">
	<PageHeader
		title="朋友圈"
		stamp="情報"
		description="{data.members.length} 位朋友最近寫的 {data.posts
			.length} 篇文章，每 3 小時自動更新。"
	>
		<div class="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
			<a
				href={resolve('/friends')}
				class="inline-flex items-center gap-1 text-accent hover:underline"
			>
				<ArrowLeft class="size-4" /> 線人名單
			</a>
			<button
				type="button"
				onclick={luckyRead}
				class="inline-flex items-center gap-1 text-ink-muted hover:text-accent"
			>
				<Dices class="size-4" /> 手氣不錯，隨便讀一篇
			</button>
			<a
				href={resolve('/friends/circle/rss.xml')}
				class="inline-flex items-center gap-1 text-ink-muted hover:text-accent"
			>
				<Rss class="size-4" /> 訂閱朋友圈
			</a>
		</div>
	</PageHeader>

	{#if data.members.length > 0}
		<div
			class="flex flex-wrap gap-1.5"
			role="group"
			aria-label="篩選朋友"
			use:reveal={{ delay: 60 }}
		>
			{#each [null, ...data.members.map((m) => m.id)] as id (id)}
				{@const m = id ? byId.get(id) : null}
				<button
					type="button"
					onclick={() => (who = id)}
					aria-pressed={who === id}
					class="inline-flex items-center gap-1.5 rounded-full border py-1 pr-3 text-xs transition {m
						? 'pl-1'
						: 'pl-3'} {who === id
						? 'border-accent bg-accent/10 text-accent'
						: 'border-border-case text-ink-muted hover:text-ink'}"
				>
					{#if m?.avatar}
						<img
							src={m.avatar}
							alt=""
							referrerpolicy="no-referrer"
							class="size-5 rounded-full object-cover"
						/>
					{/if}
					{m?.name ?? '全部'}
					<span class="font-mono-hack opacity-70">{m?.count ?? data.posts.length}</span>
				</button>
			{/each}
		</div>
		{#if data.updatedAt}
			<p class="mt-3 font-mono-hack text-[11px] text-ink-muted">
				最後更新：{data.updatedAt.toLocaleString('zh-TW', { hour12: false })}
			</p>
		{/if}
	{/if}

	{#if posts.length === 0}
		<p
			class="mt-8 rounded-2xl border border-dashed border-border-case py-10 text-center text-sm text-ink-muted"
		>
			── 朋友們還沒有新文章，或還在抓。 ──
		</p>
	{/if}

	{#each months as month (month.label)}
		<section class="mt-10" use:reveal={{ delay: 60 }}>
			<h2 class="font-mono-hack text-xs tracking-widest text-ink-muted">{month.label}</h2>
			<ol class="mt-3 border-l border-border-case">
				{#each month.items as p (p.id)}
					{@const m = byId.get(p.friendId)}
					<li class="group relative py-3 pl-6">
						<span
							class="absolute top-[1.35rem] -left-[3.5px] size-1.5 rounded-full bg-border-case transition group-hover:scale-150 group-hover:bg-accent"
						></span>
						<div class="flex gap-3">
							<time
								class="w-11 shrink-0 pt-0.5 font-mono-hack text-xs text-ink-muted"
								datetime={p.publishedAt.toISOString()}>{mmdd(p.publishedAt)}</time
							>
							<div class="min-w-0">
								<h3 class="font-medium text-ink group-hover:text-accent">
									<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external post -->
									<a href={p.url} target="_blank" rel="noopener">{p.title}</a>
									{#if isNew(p.publishedAt)}
										<span class="date-stamp ml-1 align-middle text-[10px]">NEW</span>
									{/if}
								</h3>
								{#if p.summary}
									<p class="mt-1 line-clamp-2 text-sm text-ink-muted">{p.summary}</p>
								{/if}
								{#if m}
									<button
										type="button"
										onclick={() => (who = m.id)}
										class="mt-1.5 inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-accent"
									>
										{#if m.avatar}
											<img
												src={m.avatar}
												alt=""
												referrerpolicy="no-referrer"
												class="size-4 rounded-full object-cover"
											/>
										{/if}
										{m.name}
									</button>
								{/if}
							</div>
						</div>
					</li>
				{/each}
			</ol>
		</section>
	{/each}
</div>
