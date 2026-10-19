<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Seo from '$lib/components/Seo.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Heart from '@lucide/svelte/icons/heart';
	import MessageCircle from '@lucide/svelte/icons/message-circle';
	import Share2 from '@lucide/svelte/icons/share-2';
	import Eye from '@lucide/svelte/icons/eye';
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let query = $state('');
	let showAllTags = $state(false);
	let copiedPath = $state<string | null>(null);

	const sorts = [
		{ key: 'new', label: '最新' },
		{ key: 'old', label: '最舊' },
		{ key: 'hot', label: '最常被翻閱' }
	] as const;

	/** Current URL with some params swapped — keeps filters composable. */
	function withParams(changes: Record<string, string | null>) {
		// Scratch copy for building an href, never stored in state.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const params = new URLSearchParams(page.url.searchParams);
		for (const [k, v] of Object.entries(changes)) {
			if (v === null) params.delete(k);
			else params.set(k, v);
		}
		const qs = params.toString();
		return `${resolve('/blog')}${qs ? `?${qs}` : ''}`;
	}

	const filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return data.list;
		return data.list.filter((e) =>
			`${e.title} ${e.excerpt} ${e.tags.join(' ')}`.toLowerCase().includes(q)
		);
	});

	// Guide cards between months (one guide for the whole list when sorted by reads).
	const groups = $derived.by(() => {
		const out: { label: string; items: typeof filtered }[] = [];
		for (const e of filtered) {
			const label =
				data.sort === 'hot'
					? '依翻閱次數'
					: `${e.date.getFullYear()} · ${String(e.date.getMonth() + 1).padStart(2, '0')}`;
			const last = out.at(-1);
			if (last?.label === label) last.items.push(e);
			else out.push({ label, items: [e] });
		}
		return out;
	});

	const visibleTags = $derived(showAllTags ? data.tags : data.tags.slice(0, 10));

	const stampDate = (d: Date) =>
		`${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;

	async function share(path: string, title: string) {
		const url = page.url.origin + path;
		if (navigator.share) {
			try {
				await navigator.share({ title, url });
				return;
			} catch {
				// user dismissed the sheet — fall through to copying
			}
		}
		await navigator.clipboard.writeText(url);
		copiedPath = path;
		setTimeout(() => (copiedPath = null), 1600);
	}

	const pageTitle = $derived(
		data.tag ? `#${data.tag}` : (data.categories.find((c) => c.key === data.cat)?.label ?? '手記')
	);
</script>

<Seo
	title={data.cat || data.tag ? `${pageTitle} · 手記` : '手記'}
	description="記錄技術探索、開發心得與生活碎片。"
/>

<div class="mx-auto max-w-4xl px-6 pb-16">
	<PageHeader
		title="手記"
		stamp="調查中"
		description="技術探索、開發心得與生活碎片，全部歸在這個抽屜裡。每一張卡片都是當下最真實的想法。"
	>
		<!-- Inquiry form: typed fields, not app chrome -->
		<div class="space-y-4 font-mono-hack text-sm text-ink-muted">
			<label class="flex items-baseline gap-3">
				<span class="shrink-0 tracking-widest">查詢：</span>
				<input
					bind:value={query}
					type="search"
					placeholder="標題、內容或線索…"
					class="w-full border-0 border-b border-dashed border-border-case bg-transparent px-0 py-1 font-sans text-base text-ink placeholder:text-ink-muted/60 focus:border-accent focus:ring-0"
				/>
			</label>
			<p class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
				<span class="tracking-widest">排序：</span>
				{#each sorts as s, i (s.key)}
					{#if i > 0}<span aria-hidden="true">/</span>{/if}
					<!-- eslint-disable svelte/no-navigation-without-resolve -- withParams() builds on resolve('/blog') -->
					<a
						href={withParams({ sort: s.key === 'new' ? null : s.key })}
						data-sveltekit-noscroll
						class="underline-offset-4 {data.sort === s.key
							? 'text-ink underline decoration-accent decoration-2'
							: 'hover:text-ink'}"
					>
						{s.label}
					</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				{/each}
				<span class="ml-auto text-xs">
					共 {data.totals.posts} 件 · 線索 {data.totals.tags} 條 · 翻閱 {data.totals.views} 次
				</span>
			</p>
			{#if data.tags.length}
				<p class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
					<span class="tracking-widest">線索：</span>
					{#each visibleTags as t (t.name)}
						<!-- eslint-disable svelte/no-navigation-without-resolve -- withParams() builds on resolve('/blog') -->
						<a
							href={withParams({ tag: data.tag === t.name ? null : t.name })}
							class="clue {data.tag === t.name ? 'is-on' : ''}"
						>
							#{t.name}<sup class="ml-0.5 text-[0.6rem] opacity-60">{t.count}</sup>
						</a>
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
					{/each}
					{#if data.tags.length > 10}
						<button
							type="button"
							class="text-xs underline underline-offset-4 hover:text-ink"
							onclick={() => (showAllTags = !showAllTags)}
						>
							{showAllTags ? '收起' : `其餘 ${data.tags.length - 10} 條`}
						</button>
					{/if}
				</p>
			{/if}
		</div>
	</PageHeader>

	<!-- Category guide tabs standing up out of the drawer -->
	<div class="flex items-end gap-1 overflow-x-auto px-2" role="tablist" aria-label="分類">
		{#each data.categories as c (c.label)}
			<!-- eslint-disable svelte/no-navigation-without-resolve -- withParams() builds on resolve('/blog') -->
			<a
				href={withParams({ cat: c.key })}
				role="tab"
				aria-selected={data.cat === c.key}
				class="guide-tab shrink-0"
				class:is-on={data.cat === c.key}
			>
				{c.label}
				<span class="ml-1 font-mono-hack text-[0.65rem] opacity-70">{c.count}</span>
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		{/each}
	</div>

	<div class="drawer rounded-b-lg px-3 pt-5 pb-8 sm:px-6">
		{#if data.tag}
			<!-- eslint-disable svelte/no-navigation-without-resolve -- withParams() builds on resolve('/blog') -->
			<a
				href={withParams({ tag: null })}
				class="mb-4 inline-flex items-center gap-1.5 font-mono-hack text-xs text-ink-muted hover:text-ink"
			>
				只看線索 #{data.tag}
				<X class="size-3" />
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		{/if}

		{#if filtered.length === 0}
			<p class="py-16 text-center font-mono-hack text-sm text-ink-muted">
				{query ? `查無「${query}」相關卷宗。` : '這個抽屜還是空的。'}
			</p>
		{/if}

		{#each groups as group (group.label)}
			<div class="guide-card mt-6 first:mt-0">
				<span class="guide-label">{group.label}</span>
			</div>
			<ol class="stack">
				{#each group.items as entry (entry.path)}
					{@const n = filtered.indexOf(entry)}
					<li class="slot" style="--n: {Math.min(n, 8)}">
						<article class="index-card catalog-card rounded-sm px-5 pt-4 pb-7 sm:px-7">
							<div
								class="flex items-start justify-between gap-4 border-b-2 border-stamp-400/60 pb-2"
							>
								<h2 class="font-display text-lg leading-snug text-case-900 sm:text-xl">
									<!-- eslint-disable svelte/no-navigation-without-resolve -- entry.path is a full app path -->
									<a href={entry.path} class="after:absolute after:inset-0">{entry.title}</a>
									<!-- eslint-enable svelte/no-navigation-without-resolve -->
								</h2>
								<span class="date-stamp shrink-0">{stampDate(entry.date)}</span>
							</div>
							<p class="mt-2 font-mono-hack text-[0.7rem] tracking-widest text-case-600">
								{entry.kindLabel}
								{#if entry.tags.length}
									·
									{#each entry.tags as t, i (t)}{i ? ' ' : ''}#{t}{/each}
								{/if}
							</p>
							{#if entry.excerpt}
								<p class="mt-2 line-clamp-2 text-sm leading-7 text-case-800">{entry.excerpt}</p>
							{/if}
							<div
								class="relative z-10 mt-3 flex items-center gap-4 font-mono-hack text-xs text-case-600"
							>
								<span class="flex items-center gap-1" title="按讚"
									><Heart class="size-3.5" />{entry.likes}</span
								>
								<!-- eslint-disable svelte/no-navigation-without-resolve -- entry.path is a full app path -->
								<a
									href="{entry.path}#comments"
									class="flex items-center gap-1 hover:text-stamp-600"
								>
									<MessageCircle class="size-3.5" />{entry.comments ? entry.comments : '證詞'}
								</a>
								<!-- eslint-enable svelte/no-navigation-without-resolve -->
								<button
									type="button"
									onclick={() => share(entry.path, entry.title)}
									class="flex items-center gap-1 hover:text-stamp-600"
								>
									{#if copiedPath === entry.path}
										<Check class="size-3.5" /> 已複製
									{:else}
										<Share2 class="size-3.5" /> 轉交
									{/if}
								</button>
								<span class="ml-auto flex items-center gap-1" title="翻閱次數">
									<Eye class="size-3.5" />{entry.views}
								</span>
							</div>
							<span aria-hidden="true" class="punch"></span>
						</article>
					</li>
				{/each}
			</ol>
		{/each}
	</div>
</div>

<style>
	/* Drawer interior: cards sit down inside it. */
	.drawer {
		background: var(--color-surface-alt);
		box-shadow:
			inset 0 14px 18px -12px rgba(0, 0, 0, 0.35),
			inset 0 -1px 0 rgba(255, 255, 255, 0.05);
		border: 1px solid var(--color-border-case);
		border-top: 0;
	}

	.guide-tab {
		position: relative;
		top: 1px;
		padding: 0.45rem 0.9rem 0.35rem;
		border: 1px solid var(--color-border-case);
		border-bottom: 0;
		border-radius: 6px 6px 0 0;
		background: color-mix(in srgb, #d4ad6e 55%, var(--color-surface-alt));
		color: #2c2118;
		font-family: var(--font-display);
		font-size: 0.9rem;
		transform: translateY(6px);
		transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.guide-tab:hover {
		transform: translateY(2px);
	}
	.guide-tab.is-on {
		background: #d4ad6e;
		transform: translateY(0);
	}

	.clue {
		transition: color 0.15s ease;
	}
	.clue:hover {
		color: var(--color-ink);
	}
	.clue.is-on {
		color: var(--color-accent);
		text-decoration: line-through;
		text-decoration-color: color-mix(in srgb, var(--color-accent) 60%, transparent);
	}

	/* Month divider: a taller guide card whose tab carries the month. */
	.guide-card {
		position: relative;
		height: 0.9rem;
		margin-bottom: -0.2rem;
		border-radius: 3px 3px 0 0;
		background: #c9a465;
		box-shadow: 0 -1px 0 rgba(255, 255, 255, 0.25) inset;
	}
	.guide-label {
		position: absolute;
		bottom: 100%;
		left: 1.25rem;
		padding: 0.2rem 0.75rem;
		border-radius: 5px 5px 0 0;
		background: #c9a465;
		color: #2c2118;
		font-family: var(--font-mono-hack);
		font-size: 0.75rem;
		letter-spacing: 0.15em;
	}
	.guide-card:nth-of-type(even) .guide-label {
		left: auto;
		right: 1.25rem;
	}

	/* Cards stand in the drawer, overlapping; hover pulls one up and out. */
	.stack {
		padding-top: 0.25rem;
	}
	.slot + .slot {
		margin-top: -0.6rem;
	}
	.catalog-card {
		transition:
			transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
			box-shadow 0.35s ease;
		animation: file-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
		animation-delay: calc(var(--n) * 70ms + 200ms);
	}
	.catalog-card:hover {
		z-index: 2;
		transform: translateY(-14px) rotate(-0.4deg);
		box-shadow:
			0 1px 0 rgba(255, 255, 255, 0.6) inset,
			0 30px 40px -22px rgba(20, 12, 6, 0.65);
	}
	@keyframes file-in {
		from {
			opacity: 0;
			transform: translateY(28px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.catalog-card,
		.guide-tab {
			animation: none;
			transition: none;
		}
		.catalog-card:hover {
			transform: none;
		}
	}
</style>
