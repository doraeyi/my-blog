<script lang="ts">
	import { resolve } from '$app/paths';
	import Seo from '$lib/components/Seo.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { reveal } from '$lib/actions/reveal';
	import { wordCountLabel, formatDate } from '$lib/format';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type Day = PageData['days'][number];

	// Columns of 7 (Sun → Sat), oldest week on the left.
	const weeks = $derived.by(() => {
		const out: Day[][] = [];
		for (let i = 0; i < data.days.length; i += 7) out.push(data.days.slice(i, i + 7));
		return out;
	});
	// A month label over the first column that starts in that month.
	// Skipped when the next month's label would start within 3 columns (they'd overlap).
	const monthLabels = $derived.by(() => {
		const starts = weeks.map((w, i) => {
			const m = Number(w[0].date.slice(5, 7));
			return i === 0 || m !== Number(weeks[i - 1][0].date.slice(5, 7)) ? m : null;
		});
		return starts.map((m, i) => {
			if (m === null) return '';
			const next = starts.findIndex((n, j) => j > i && n !== null);
			return next !== -1 && next - i < 3 ? '' : `${m}月`;
		});
	});

	const level = (d: Day) => (d.posts >= 2 ? 3 : d.posts === 1 ? 2 : d.thoughts ? 1 : 0);
	const describe = (d: Day) => {
		const parts = [];
		if (d.posts) parts.push(`${d.posts} 份檔案`);
		if (d.thoughts) parts.push(`${d.thoughts} 則碎念`);
		return `${d.date} · ${parts.join('、') || '沒有紀錄'}`;
	};

	let hovered = $state<Day | null>(null);
	const lastActive = $derived([...data.days].reverse().find((d) => d.posts || d.thoughts) ?? null);
	const shown = $derived(hovered ?? lastActive);

	const maxMonth = $derived(Math.max(1, ...data.months.map((m) => m.count)));
	const maxTag = $derived(Math.max(1, ...data.tags.map((t) => t.count)));

	const figures = $derived([
		{ label: '歸檔案件', value: String(data.totals.files), unit: '份' },
		{ label: '總字數', value: wordCountLabel(data.totals.words).replace(/ ?字$/, ''), unit: '字' },
		{ label: '讀完全部', value: String(data.totals.minutes), unit: '分鐘' },
		{ label: '被翻閱', value: data.totals.views.toLocaleString(), unit: '次' },
		{ label: '碎念', value: String(data.totals.thoughts), unit: '則' },
		{ label: '連續更新', value: String(data.streak.current), unit: '週' }
	]);

	// Scroll the heatmap to "now" on narrow screens.
	function toEnd(node: HTMLElement) {
		node.scrollLeft = node.scrollWidth;
	}
</script>

<Seo
	title="案件統計"
	description="寫了多少、什麼時候寫、都在寫什麼：這個部落格的所有紀錄攤開來看。"
/>

<div class="mx-auto max-w-5xl px-6 pb-20">
	<PageHeader
		title="案件統計"
		stamp="統計"
		description="寫了多少、什麼時候寫、都在寫什麼。每一格是一天，紅得越深代表那天寫得越多。"
	/>

	<!-- ── Heatmap ── -->
	<section
		use:reveal
		class="rounded-md border border-border-case bg-surface/70 p-5 backdrop-blur-sm"
	>
		<div class="flex flex-wrap items-baseline justify-between gap-2">
			<h2 class="font-mono-hack text-xs tracking-[0.3em] text-ink-muted uppercase">
				Activity Log // 出勤紀錄
			</h2>
			<p class="font-mono-hack text-xs text-ink-muted">
				一年內 {data.days.filter((d) => d.posts || d.thoughts).length} 天有紀錄 · 最長連續 {data
					.streak.longest} 週
			</p>
		</div>

		<div class="mt-4 overflow-x-auto pb-2" use:toEnd>
			<!--
				Squares are too small to be tap targets, so they're plain marks: hovering
				shows the day in the line below (and a tooltip); the line is the readable
				version for everyone else.
			-->
			<div
				class="inline-grid gap-[3px]"
				style="grid-template-columns: repeat({weeks.length}, 12px)"
				role="img"
				aria-label="一年內每天的寫作紀錄"
				onpointerover={(e) => {
					const date = (e.target as HTMLElement).dataset.date;
					hovered = date ? (data.days.find((d) => d.date === date) ?? null) : null;
				}}
				onpointerleave={() => (hovered = null)}
			>
				{#each monthLabels as label, i (i)}
					<span class="h-4 font-mono-hack text-[10px] whitespace-nowrap text-ink-muted"
						>{label}</span
					>
				{/each}
				{#each weeks as week, wi (week[0].date)}
					<div class="grid gap-[3px]" style="grid-column: {wi + 1}; grid-row: 2">
						{#each week as day (day.date)}
							<span
								class="heat size-3 rounded-[2px]"
								data-level={level(day)}
								data-date={day.date}
								title={describe(day)}
							></span>
						{/each}
					</div>
				{/each}
			</div>
		</div>

		<div class="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-muted">
			<p class="min-h-5 min-w-0 truncate" aria-live="polite">
				{#if shown}
					<span class="font-mono-hack">{describe(shown)}</span>
					{#if shown.titles.length}<span class="text-ink"> — {shown.titles.join('、')}</span>{/if}
				{/if}
			</p>
			<span class="flex shrink-0 items-center gap-1 font-mono-hack">
				少
				{#each [0, 1, 2, 3] as l (l)}<span class="heat size-3 rounded-[2px]" data-level={l}
					></span>{/each}
				多
			</span>
		</div>
	</section>

	<!-- ── Figures ── -->
	<section class="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
		{#each figures as f, i (f.label)}
			<div
				use:reveal={{ delay: i * 60 }}
				class="rounded-md border border-border-case bg-surface/70 px-4 py-4 backdrop-blur-sm"
			>
				<p class="font-mono-hack text-[11px] tracking-widest text-ink-muted">{f.label}</p>
				<p class="mt-1 font-display text-3xl text-ink">
					{f.value}<span class="ml-1 text-sm text-ink-muted">{f.unit}</span>
				</p>
			</div>
		{/each}
	</section>

	<div class="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
		<!-- ── Months ── -->
		<section
			use:reveal
			class="rounded-md border border-border-case bg-surface/70 p-5 backdrop-blur-sm"
		>
			<h2 class="font-mono-hack text-xs tracking-[0.3em] text-ink-muted uppercase">
				Monthly // 每月歸檔
			</h2>
			<ol class="mt-5 flex h-40 items-end gap-1.5">
				{#each data.months as m (m.label)}
					<li class="flex h-full flex-1 flex-col items-center justify-end gap-1">
						<span class="font-mono-hack text-[10px] text-ink-muted">{m.count || ''}</span>
						<span
							class="w-full max-w-7 rounded-t-sm bg-accent/80 transition-[height] duration-700"
							style="height: {(m.count / maxMonth) * 100}%; min-height: {m.count ? 4 : 1}px"
						></span>
						<span class="font-mono-hack text-[10px] text-ink-muted">{m.label}</span>
					</li>
				{/each}
			</ol>
			<ul class="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-muted">
				{#each data.byKind as k (k.kind)}
					<li>{k.label} <span class="font-mono-hack text-ink">{k.count}</span></li>
				{/each}
			</ul>
		</section>

		<!-- ── Tags ── -->
		<section
			use:reveal={{ delay: 80 }}
			class="rounded-md border border-border-case bg-surface/70 p-5 backdrop-blur-sm"
		>
			<h2 class="font-mono-hack text-xs tracking-[0.3em] text-ink-muted uppercase">
				Leads // 最常追的線索
			</h2>
			<ul class="mt-5 flex flex-wrap gap-2">
				{#each data.tags as t (t.tag)}
					<li>
						<a
							href={resolve('/tags/[tag]', { tag: t.tag })}
							class="inline-flex items-baseline gap-1 rounded-full border border-border-case px-3 py-1 text-ink transition hover:border-accent hover:text-accent"
							style="font-size: {0.75 + (t.count / maxTag) * 0.45}rem"
						>
							#{t.tag}<span class="font-mono-hack text-[10px] text-ink-muted">{t.count}</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	</div>

	<!-- ── Records ── -->
	<section class="mt-10">
		<h2 class="font-mono-hack text-xs tracking-[0.3em] text-ink-muted uppercase">
			Records // 紀錄保持
		</h2>
		<div class="mt-4 grid gap-4 sm:grid-cols-3">
			{#each [{ label: '最長的一份', r: data.records.longest, unit: (n: number) => wordCountLabel(n) }, { label: '最多人翻閱', r: data.records.mostRead, unit: (n: number) => `${n.toLocaleString()} 次` }, { label: '最新歸檔', r: data.records.latest, unit: () => '' }] as item, i (item.label)}
				{#if item.r}
					<!-- eslint-disable svelte/no-navigation-without-resolve -- paths come from the content index -->
					<a
						href={item.r.path}
						use:reveal={{ delay: i * 90 }}
						class="index-card group block rounded-sm px-5 pt-4 pb-5 transition hover:-translate-y-1"
						style="transform: rotate({i === 1 ? 0.6 : -0.5}deg)"
					>
						<p
							class="flex items-center justify-between font-mono-hack text-[11px] tracking-widest text-case-700"
						>
							{item.label}
							{#if 'value' in item.r}<span class="date-stamp">{item.unit(item.r.value)}</span>{/if}
						</p>
						<p
							class="mt-2 line-clamp-2 font-display text-lg text-case-900 group-hover:text-stamp-600"
						>
							{item.r.title}
						</p>
						<p class="mt-1 font-mono-hack text-xs text-case-700">{formatDate(item.r.date)}</p>
					</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				{/if}
			{/each}
		</div>
		{#if data.totals.since}
			<p class="mt-8 text-center font-mono-hack text-xs text-ink-muted">
				第一份檔案歸檔於 {formatDate(data.totals.since)} · 共 {data.totals.activeDays} 個有紀錄的日子
			</p>
		{/if}
	</section>
</div>

<style>
	.heat {
		background: color-mix(in srgb, var(--color-ink) 8%, transparent);
		transition: transform 0.15s;
	}
	.heat[data-level='1'] {
		background: color-mix(in srgb, var(--color-brass) 55%, transparent);
	}
	.heat[data-level='2'] {
		background: color-mix(in srgb, var(--color-stamp-500) 70%, transparent);
	}
	.heat[data-level='3'] {
		background: var(--color-stamp-600);
	}
	span[data-date].heat:hover {
		transform: scale(1.5);
		outline: 1px solid var(--color-ink);
	}
</style>
