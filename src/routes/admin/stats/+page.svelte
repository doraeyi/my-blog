<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type Point = PageData['series'][number];

	const maxViews = $derived(Math.max(4, ...data.series.map((d) => d.views)));
	let hover = $state<Point | null>(null);
	const focus = $derived(hover ?? data.series.at(-1) ?? null);

	const W = 600;
	const H = 160;
	const step = $derived(W / data.series.length);
	const y = (v: number) => H - (v / maxViews) * (H - 8);
	const visitorLine = $derived(
		data.series.map((d, i) => `${(i + 0.5) * step},${y(d.visitors)}`).join(' ')
	);

	function delta(now: number, before: number) {
		if (!before) return now ? '新' : '—';
		const pct = Math.round(((now - before) / before) * 100);
		return `${pct >= 0 ? '+' : ''}${pct}%`;
	}
	const kpis = $derived([
		{
			label: '瀏覽',
			value: data.totals.views,
			change: delta(data.totals.views, data.totals.prevViews)
		},
		{
			label: '訪客',
			value: data.totals.visitors,
			change: delta(data.totals.visitors, data.totals.prevVisitors)
		},
		{
			label: '每位訪客看幾頁',
			value: data.totals.visitors ? (data.totals.views / data.totals.visitors).toFixed(1) : '—',
			change: ''
		},
		{
			label: '從外部連進來',
			value: data.totals.views
				? `${Math.round((data.totals.referred / data.totals.views) * 100)}%`
				: '—',
			change: ''
		}
	]);

	const maxPage = $derived(Math.max(1, ...data.pages.map((p) => p.views)));
	const maxSource = $derived(Math.max(1, ...data.sources.map((s) => s.views)));
	const short = (day: string) => day.slice(5).replace('-', '/');
</script>

<div class="flex flex-wrap items-end justify-between gap-3">
	<div>
		<h1 class="text-2xl font-bold text-ink">流量</h1>
		<p class="mt-1 text-sm text-ink-muted">
			不含你自己和爬蟲。同一個人 30 分鐘內重看同一頁只算一次，不存任何個人資料。
		</p>
	</div>
	<nav class="flex rounded-lg border border-border-case p-0.5 text-sm">
		{#each data.ranges as r (r)}
			<!-- eslint-disable svelte/no-navigation-without-resolve -- resolved path plus a query string -->
			<a
				href={`${resolve('/admin/stats')}?days=${r}`}
				class="rounded-md px-3 py-1 {data.days === r
					? 'bg-accent text-white'
					: 'text-ink-muted hover:text-ink'}">{r} 天</a
			>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		{/each}
	</nav>
</div>

<section class="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
	{#each kpis as k (k.label)}
		<div class="rounded-xl border border-border-case bg-surface-alt p-4">
			<p class="text-xs text-ink-muted">{k.label}</p>
			<p class="mt-1 flex items-baseline gap-2">
				<span class="font-display text-3xl text-ink">{k.value}</span>
				{#if k.change}
					<span
						class="font-mono-hack text-xs {k.change.startsWith('-')
							? 'text-stamp-500'
							: 'text-emerald-600'}">{k.change}</span
					>
				{/if}
			</p>
		</div>
	{/each}
</section>

<section class="mt-6 rounded-xl border border-border-case bg-surface-alt p-4">
	<div class="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
		<span class="flex items-center gap-3">
			<span class="flex items-center gap-1"
				><span class="size-2.5 rounded-sm bg-accent/70"></span>瀏覽</span
			>
			<span class="flex items-center gap-1"><span class="h-0.5 w-3 bg-brass"></span>訪客</span>
		</span>
		{#if focus}
			<span class="font-mono-hack">
				{focus.day} · 瀏覽 <b class="text-ink">{focus.views}</b> · 訪客
				<b class="text-ink">{focus.visitors}</b>
			</span>
		{/if}
	</div>
	<svg
		viewBox="0 0 {W} {H + 18}"
		class="mt-3 w-full"
		role="img"
		aria-label="每日瀏覽與訪客"
		onmouseleave={() => (hover = null)}
	>
		{#each [0.25, 0.5, 0.75, 1] as g (g)}
			<line
				x1="0"
				x2={W}
				y1={y(maxViews * g)}
				y2={y(maxViews * g)}
				class="stroke-border-case"
				stroke-dasharray="2 4"
			/>
		{/each}
		{#each data.series as d, i (d.day)}
			<rect
				x={i * step + step * 0.15}
				width={step * 0.7}
				y={y(d.views)}
				height={H - y(d.views)}
				rx="1.5"
				class="fill-accent {hover === d ? 'opacity-100' : 'opacity-60'}"
			/>
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<rect
				x={i * step}
				width={step}
				y="0"
				height={H}
				fill="transparent"
				onmouseenter={() => (hover = d)}
			/>
			{#if data.series.length <= 31 ? i % Math.ceil(data.series.length / 8) === 0 : i % 15 === 0}
				<text
					x={(i + 0.5) * step}
					y={H + 14}
					text-anchor="middle"
					class="fill-ink-muted font-mono-hack text-[9px]">{short(d.day)}</text
				>
			{/if}
		{/each}
		<polyline
			points={visitorLine}
			fill="none"
			class="stroke-brass"
			stroke-width="2"
			stroke-linejoin="round"
		/>
	</svg>
</section>

<div class="mt-6 grid gap-6 md:grid-cols-2">
	<section class="rounded-xl border border-border-case bg-surface-alt p-4">
		<h2 class="font-semibold text-ink">熱門頁面</h2>
		{#if data.pages.length === 0}<p class="mt-3 text-sm text-ink-muted">
				這段時間還沒有資料。
			</p>{/if}
		<ol class="mt-3 space-y-1.5">
			{#each data.pages as p (p.path)}
				<li class="relative overflow-hidden rounded-md px-2 py-1.5 text-sm">
					<span
						class="absolute inset-y-0 left-0 bg-accent/10"
						style="width: {(p.views / maxPage) * 100}%"
					></span>
					<span class="relative flex items-center justify-between gap-3">
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- recorded site paths -->
						<a href={p.path} class="min-w-0 truncate text-ink hover:text-accent"
							>{p.title ?? p.path}</a
						>
						<span class="shrink-0 font-mono-hack text-xs text-ink-muted">{p.views}</span>
					</span>
				</li>
			{/each}
		</ol>
	</section>

	<section class="rounded-xl border border-border-case bg-surface-alt p-4">
		<h2 class="font-semibold text-ink">從哪裡來</h2>
		{#if data.sources.length === 0}
			<p class="mt-3 text-sm text-ink-muted">還沒有從外部連進來的紀錄（直接打網址的不算）。</p>
		{/if}
		<ol class="mt-3 space-y-1.5">
			{#each data.sources as s (s.source)}
				<li class="relative overflow-hidden rounded-md px-2 py-1.5 text-sm">
					<span
						class="absolute inset-y-0 left-0 bg-brass/15"
						style="width: {(s.views / maxSource) * 100}%"
					></span>
					<span class="relative flex items-center justify-between gap-3">
						<span class="min-w-0 truncate text-ink">
							{s.source}
							{#if s.friend}
								<span class="ml-1 rounded-sm border border-brass/60 px-1 text-[10px] text-brass"
									>友站 · {s.friend}</span
								>
							{/if}
						</span>
						<span class="shrink-0 font-mono-hack text-xs text-ink-muted">{s.views}</span>
					</span>
				</li>
			{/each}
		</ol>
	</section>
</div>

{#if data.allTime.length}
	<section class="mt-6 rounded-xl border border-border-case bg-surface-alt p-4">
		<h2 class="font-semibold text-ink">文章總閱讀（開站至今）</h2>
		<ol class="mt-3 divide-y divide-border-case text-sm">
			{#each data.allTime as e, i (e.path)}
				<li class="flex items-center gap-3 py-2">
					<span class="w-5 font-mono-hack text-xs text-ink-muted">{i + 1}</span>
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- paths come from the content index -->
					<a href={e.path} class="min-w-0 flex-1 truncate text-ink hover:text-accent">{e.title}</a>
					<span class="font-mono-hack text-xs text-ink-muted">{e.views}</span>
				</li>
			{/each}
		</ol>
	</section>
{/if}
