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
	import PinString from '$lib/components/PinString.svelte';
	import { pinned } from '$lib/actions/pinned';
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

	<!-- Categories: a red thread under the open one -->
	<nav class="cats" aria-label="分類">
		{#each data.categories as c (c.label)}
			<!-- eslint-disable svelte/no-navigation-without-resolve -- withParams() builds on resolve('/blog') -->
			<a
				href={withParams({ cat: c.key })}
				class="cat"
				class:is-on={data.cat === c.key}
				aria-current={data.cat === c.key ? 'page' : undefined}
				data-sveltekit-noscroll
			>
				{c.label}<span class="cat-count">{c.count}</span>
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		{/each}
	</nav>

	{#if data.tag}
		<!-- eslint-disable svelte/no-navigation-without-resolve -- withParams() builds on resolve('/blog') -->
		<a
			href={withParams({ tag: null })}
			class="mt-5 inline-flex items-center gap-1.5 font-mono-hack text-xs text-ink-muted hover:text-ink"
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
		{@const [year, month] = group.label.split(' · ')}
		<section class="month">
			<h2 class="month-head" aria-label={group.label}>
				{#if month}
					<span class="month-no font-display">{month}</span>
					<span class="month-year font-mono-hack">{year}</span>
				{:else}
					<span class="month-year font-mono-hack">{group.label}</span>
				{/if}
				<span class="month-rule" aria-hidden="true"></span>
				<span class="month-count font-mono-hack">{group.items.length} 件</span>
			</h2>
			<PinString class="files">
				{#each group.items as entry, k (entry.path)}
					{@const n = filtered.indexOf(entry)}
					<article
						class="file kind-{entry.kind}"
						use:pinned={{ delay: (k % 4) * 90, tilt: [-0.8, 0.6, 0.3, -0.5][n % 4] }}
					>
						<p class="file-meta font-mono-hack">
							<span class="file-kind">{entry.kindLabel}</span>
							<time datetime={entry.date.toISOString()}>{stampDate(entry.date)}</time>
						</p>
						<h3 class="file-title font-display">
							<!-- eslint-disable svelte/no-navigation-without-resolve -- entry.path is a full app path -->
							<a href={entry.path} class="after:absolute after:inset-0"
								><span class="ink-line">{entry.title}</span></a
							>
							<!-- eslint-enable svelte/no-navigation-without-resolve -->
						</h3>
						{#if entry.excerpt}
							<p class="file-excerpt">{entry.excerpt}</p>
						{/if}
						{#if entry.tags.length}
							<p class="file-tags font-mono-hack">
								{#each entry.tags as t (t)}<span>#{t}</span>{/each}
							</p>
						{/if}
						<div class="file-foot font-mono-hack">
							<span class="flex items-center gap-1" title="按讚"
								><Heart class="size-3.5" />{entry.likes}</span
							>
							<!-- eslint-disable svelte/no-navigation-without-resolve -- entry.path is a full app path -->
							<a href="{entry.path}#comments" class="foot-btn">
								<MessageCircle class="size-3.5" />{entry.comments ? entry.comments : '證詞'}
							</a>
							<!-- eslint-enable svelte/no-navigation-without-resolve -->
							<button type="button" onclick={() => share(entry.path, entry.title)} class="foot-btn">
								{#if copiedPath === entry.path}
									<Check class="size-3.5" /> 已複製
								{:else}
									<Share2 class="size-3.5" /> 轉交
								{/if}
							</button>
							<span class="views ml-auto flex items-center gap-1" title="翻閱次數">
								<Eye class="size-3.5" />{entry.views}
							</span>
							<span class="file-go" aria-hidden="true">翻開 →</span>
						</div>
					</article>
				{/each}
			</PinString>
		</section>
	{/each}
</div>

<style>
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

	/* ── Categories ── */
	.cats {
		display: flex;
		gap: 0.25rem;
		margin-top: 0.5rem;
		overflow-x: auto;
		border-bottom: 1px solid var(--color-border-case);
		scrollbar-width: none;
	}
	.cat {
		position: relative;
		flex: none;
		padding: 0.6rem 0.9rem;
		color: var(--color-ink-muted);
		font-size: 0.95rem;
		transition: color 0.2s;
	}
	.cat:hover,
	.cat.is-on {
		color: var(--color-ink);
	}
	.cat-count {
		margin-left: 0.35rem;
		font-family: var(--font-mono-hack);
		font-size: 0.68rem;
		opacity: 0.6;
	}
	.cat::after {
		content: '';
		position: absolute;
		right: 0.6rem;
		bottom: -1px;
		left: 0.6rem;
		height: 2px;
		border-radius: 2px;
		background: var(--color-accent);
		transform: scaleX(0);
		transform-origin: left;
		transition: transform 0.45s cubic-bezier(0.34, 1.4, 0.64, 1);
	}
	.cat:hover::after {
		transform: scaleX(0.35);
	}
	.cat.is-on::after {
		transform: scaleX(1);
	}

	/* ── A month: its number, then its files ── */
	.month {
		margin-top: 3.5rem;
	}
	.month-head {
		display: flex;
		align-items: baseline;
		gap: 0.8rem;
		margin-bottom: 2.2rem;
	}
	.month-no {
		color: var(--color-ink);
		font-size: 3.4rem;
		line-height: 0.8;
	}
	.month-year,
	.month-count {
		color: var(--color-ink-muted);
		font-size: 0.75rem;
		letter-spacing: 0.16em;
	}
	.month-rule {
		flex: 1;
		height: 1px;
		background: linear-gradient(90deg, var(--color-border-case), transparent);
	}

	/* ── Files: two up, pinned, strung together ── */
	.month :global(.files) {
		display: grid;
		gap: 2.6rem 2rem;
	}
	@media (min-width: 720px) {
		.month :global(.files) {
			grid-template-columns: 1fr 1fr;
		}
	}
	.file {
		display: flex;
		flex-direction: column;
		padding: 1.4rem 1.4rem 1rem;
		border: 1px solid rgb(60 40 20 / 0.1);
		border-radius: 4px;
		background: linear-gradient(180deg, rgb(255 255 255 / 0.6), transparent 40%), #fffcf5;
		box-shadow:
			0 1px 2px rgb(40 25 10 / 0.08),
			0 12px 26px -14px rgb(40 25 10 / 0.35);
		--k: var(--color-accent);
	}
	.file:hover {
		box-shadow:
			0 1px 2px rgb(40 25 10 / 0.08),
			0 26px 44px -18px rgb(40 25 10 / 0.45),
			0 0 0 1px color-mix(in srgb, var(--k) 30%, transparent);
	}
	.kind-blog {
		--k: #2b4c9b;
	}
	.kind-mood {
		--k: #5b3a8a;
	}
	.file-meta {
		display: flex;
		justify-content: space-between;
		color: var(--color-ink-muted);
		font-size: 0.7rem;
		letter-spacing: 0.1em;
	}
	.file-kind {
		color: var(--k);
	}
	.file-kind::before {
		content: '';
		display: inline-block;
		width: 12px;
		height: 3px;
		margin-right: 0.45rem;
		border-radius: 2px;
		background: var(--k);
		vertical-align: middle;
	}
	.file-title {
		margin-top: 0.7rem;
		color: var(--color-ink);
		font-size: 1.45rem;
		line-height: 1.3;
	}
	.file-excerpt {
		display: -webkit-box;
		margin-top: 0.6rem;
		overflow: hidden;
		color: var(--color-case-800);
		font-size: 0.9rem;
		line-height: 1.75;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		line-clamp: 3;
	}
	.file-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.2rem 0.7rem;
		margin-top: 0.7rem;
		color: var(--color-ink-muted);
		font-size: 0.7rem;
	}
	.file-foot {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-top: auto;
		padding-top: 1rem;
		border-top: 1px dashed var(--color-border-case);
		color: var(--color-ink-muted);
		font-size: 0.72rem;
	}
	.foot-btn {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		transition: color 0.2s;
	}
	.foot-btn:hover {
		color: var(--color-accent);
	}
	/* "翻開 →" slides in where the view count was. */
	.file-go {
		position: absolute;
		right: 0;
		bottom: 0;
		color: var(--k);
		letter-spacing: 0.1em;
		opacity: 0;
		transform: translateX(-8px);
		transition:
			opacity 0.25s,
			transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
		pointer-events: none;
	}
	.views {
		transition: opacity 0.2s;
	}
	.file:hover .file-go {
		opacity: 1;
		transform: none;
	}
	.file:hover .views {
		opacity: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.cat::after,
		.file-go {
			transition: none;
		}
	}
</style>
