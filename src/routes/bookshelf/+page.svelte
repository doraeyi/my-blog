<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { reveal } from '$lib/actions/reveal';
	import { books, bookStatusLabel, type BookStatus } from '$lib/collections';
	import Search from '@lucide/svelte/icons/search';
	import Library from '@lucide/svelte/icons/library';
	import Star from '@lucide/svelte/icons/star';

	const rated = books.filter((b) => b.rating);
	const stats = [
		{ label: '藏書', value: books.length },
		{ label: '已讀', value: books.filter((b) => b.status === 'read').length },
		{ label: '閱讀中', value: books.filter((b) => b.status === 'reading').length },
		{
			label: '平均評分',
			value: rated.length
				? `${(rated.reduce((s, b) => s + b.rating!, 0) / rated.length).toFixed(1)}★`
				: '—'
		}
	];

	let filter = $state<'all' | BookStatus>('all');
	let query = $state('');

	const shown = $derived(
		books.filter(
			(b) =>
				(filter === 'all' || b.status === filter) &&
				(!query.trim() ||
					`${b.title} ${b.author}`.toLowerCase().includes(query.trim().toLowerCase()))
		)
	);

	// Cover-less books get a stable spine colour derived from the title.
	const spines = ['#8a6d45', '#b3362b', '#4a3925', '#6b5336', '#2c4a52', '#5b4a6b', '#3f5a3a'];
	function spineColor(title: string) {
		let h = 0;
		for (const c of title) h = (h * 31 + c.charCodeAt(0)) >>> 0;
		return spines[h % spines.length];
	}

	const statusStyle: Record<BookStatus, string> = {
		read: 'bg-emerald-500/90',
		reading: 'bg-amber-500/90',
		want: 'bg-case-500/90'
	};
</script>

<Seo title="參考卷宗" description="讀過、正在讀、想讀的書。" />

<div class="mx-auto max-w-5xl px-6 pb-16">
	<PageHeader title="參考卷宗" stamp="館藏" description="讀過的、正在讀的、還在清單上的。">
		<p class="font-mono-hack text-sm text-ink-muted">
			館藏清點：{#each stats as st, i (st.label)}{i ? ' · ' : ''}{st.label}
				<span class="text-ink">{st.value}</span>{/each}
		</p>
	</PageHeader>

	{#if books.length === 0}
		<div
			class="mx-auto flex max-w-md flex-col items-center rounded-3xl border border-dashed border-border-case px-6 py-16 text-center"
			use:reveal
		>
			<span
				class="flex size-12 items-center justify-center rounded-2xl bg-surface-alt text-ink-muted"
			>
				<Library class="size-6" />
			</span>
			<p class="mt-4 font-medium text-ink">書櫃還空著</p>
			<p class="mt-1 text-sm text-ink-muted">書還在搬，下次來就會有了。</p>
		</div>
	{:else}
		<div class="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center" use:reveal>
			<label
				class="flex flex-1 items-center gap-2 rounded-full border border-border-case bg-surface/70 px-4 py-2 focus-within:border-accent"
			>
				<Search class="size-4 text-ink-muted" />
				<input
					bind:value={query}
					type="search"
					placeholder="搜尋書名或作者…"
					class="w-full border-0 bg-transparent p-0 text-sm text-ink focus:ring-0"
				/>
			</label>
			<div class="flex gap-1.5">
				{#each ['all', 'read', 'reading', 'want'] as const as key (key)}
					<button
						type="button"
						onclick={() => (filter = key)}
						class="rounded-full border px-3.5 py-1.5 text-sm transition {filter === key
							? 'border-accent bg-accent/10 text-ink'
							: 'border-border-case text-ink-muted hover:text-ink'}"
					>
						{key === 'all' ? '全部' : bookStatusLabel[key]}
					</button>
				{/each}
			</div>
		</div>

		{#if shown.length === 0}
			<p class="py-12 text-center text-sm text-ink-muted">找不到符合的書。</p>
		{:else}
			<ul class="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
				{#each shown as book, i (book.title)}
					<li use:reveal={{ delay: Math.min(i, 10) * 40, y: 10 }} class="group">
						<div
							class="relative aspect-[2/3] overflow-hidden rounded-lg shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)] transition duration-300 group-hover:-translate-y-1.5 group-hover:rotate-[-1deg] group-hover:shadow-[0_18px_40px_-14px_rgba(0,0,0,0.5)]"
						>
							{#if book.cover}
								<img
									src={book.cover}
									alt="《{book.title}》封面"
									class="size-full object-cover"
									loading="lazy"
								/>
							{:else}
								<div
									class="flex size-full flex-col justify-between p-3 text-cream-100"
									style="background: linear-gradient(160deg, {spineColor(book.title)}, #120d0a)"
								>
									<span class="font-display text-sm leading-snug font-bold">{book.title}</span>
									<span class="text-[0.7rem] opacity-70">{book.author}</span>
								</div>
							{/if}
							<span
								aria-hidden="true"
								class="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-black/30 to-transparent"
							></span>
							<span
								class="absolute top-2 left-2 rounded-full px-2 py-0.5 text-[0.65rem] font-medium text-white {statusStyle[
									book.status
								]}"
							>
								{bookStatusLabel[book.status]}
							</span>
						</div>
						<p class="mt-3 line-clamp-2 text-sm font-medium text-ink">{book.title}</p>
						<p class="mt-0.5 truncate text-xs text-ink-muted">{book.author}</p>
						{#if book.rating}
							<p class="mt-1 flex gap-0.5" aria-label="{book.rating} 顆星">
								{#each [1, 2, 3, 4, 5] as n (n)}
									<Star
										class="size-3 {n <= book.rating
											? 'fill-amber-400 text-amber-400'
											: 'text-border-case'}"
									/>
								{/each}
							</p>
						{/if}
						{#if book.note}
							<p class="mt-1.5 line-clamp-3 text-xs text-ink-muted italic">{book.note}</p>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>
