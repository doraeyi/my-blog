<script lang="ts">
	interface DailyCount {
		date: string;
		count: number;
	}

	let { data }: { data: DailyCount[] } = $props();

	const WEEKS = 53;

	function levelFor(count: number): 0 | 1 | 2 | 3 | 4 {
		if (count <= 0) return 0;
		if (count === 1) return 1;
		if (count <= 3) return 2;
		if (count <= 6) return 3;
		return 4;
	}

	// These Dates are local loop counters inside a pure function (never stored in $state),
	// so plain Date is correct here — SvelteDate is for reactive state, not scratch math.
	function buildWeeks(countByDate: Map<string, number>) {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const end = new Date();
		end.setHours(0, 0, 0, 0);
		end.setDate(end.getDate() + (6 - end.getDay()));
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const start = new Date(end);
		start.setDate(start.getDate() - 7 * WEEKS + 1);

		const weeks: { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[][] = [];
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const cursor = new Date(start);
		for (let w = 0; w < WEEKS; w++) {
			const week: { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[] = [];
			for (let d = 0; d < 7; d++) {
				const iso = cursor.toISOString().slice(0, 10);
				const count = countByDate.get(iso) ?? 0;
				week.push({ date: iso, count, level: levelFor(count) });
				cursor.setDate(cursor.getDate() + 1);
			}
			weeks.push(week);
		}
		return weeks;
	}

	const monthNames = [
		'1月',
		'2月',
		'3月',
		'4月',
		'5月',
		'6月',
		'7月',
		'8月',
		'9月',
		'10月',
		'11月',
		'12月'
	];

	const legendLevels = [0, 1, 2, 3, 4] as const;
	// Sun..Sat — only Mon/Wed/Fri get a label, matching GitHub's own heatmap.
	const dayLabels = ['', '一', '', '三', '', '五', ''];

	const countByDate = $derived(new Map(data.map((d) => [d.date, d.count])));
	const weeks = $derived(buildWeeks(countByDate));

	// Label the first week-column of each new month.
	const monthLabels = $derived(
		weeks.map((week, i) => {
			if (i === 0) return monthNames[new Date(week[0].date).getMonth()];
			const prevMonth = new Date(weeks[i - 1][0].date).getMonth();
			const thisMonth = new Date(week[0].date).getMonth();
			return thisMonth !== prevMonth ? monthNames[thisMonth] : '';
		})
	);
</script>

<div class="viz-root flex flex-col items-center">
	<div class="flex w-full justify-center overflow-x-auto pb-2">
		<div class="inline-flex flex-col gap-1">
			<div class="flex gap-[4px] pl-[19px] text-[10px] text-ink-muted">
				{#each monthLabels as label, i (i)}
					<span class="w-[15px]">{label}</span>
				{/each}
			</div>
			<div class="flex gap-[4px]">
				<div class="grid grid-rows-7 gap-[4px] text-[10px] text-ink-muted">
					{#each dayLabels as label, i (i)}
						<span class="flex h-[15px] w-[15px] items-center justify-end">{label}</span>
					{/each}
				</div>
				<div class="grid grid-flow-col gap-[4px]">
					{#each weeks as week, wi (wi)}
						<div class="grid grid-rows-7 gap-[4px]">
							{#each week as day (day.date)}
								<button
									type="button"
									class="cell size-[15px] rounded-sm level-{day.level}"
									aria-label="{day.date}：{day.count} 次 commit"
									title="{day.date}：{day.count} 次 commit"
								></button>
							{/each}
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<div class="mt-1 flex items-center gap-1 self-end text-xs text-ink-muted">
		<span>少</span>
		{#each legendLevels as level (level)}
			<span class="size-[13px] rounded-sm level-{level}"></span>
		{/each}
		<span>多</span>
	</div>
</div>

<style>
	.viz-root {
		--level-0: #ebedf0;
		--level-1: #9be9a8;
		--level-2: #40c463;
		--level-3: #30a14e;
		--level-4: #216e39;
	}

	:global([data-theme='dark']) .viz-root {
		--level-0: #161b22;
		--level-1: #0e4429;
		--level-2: #006d32;
		--level-3: #26a641;
		--level-4: #39d353;
	}

	@media (prefers-color-scheme: dark) {
		:global(:root:not([data-theme])) .viz-root {
			--level-0: #161b22;
			--level-1: #0e4429;
			--level-2: #006d32;
			--level-3: #26a641;
			--level-4: #39d353;
		}
	}

	.level-0 {
		background: var(--level-0);
	}
	.level-1 {
		background: var(--level-1);
	}
	.level-2 {
		background: var(--level-2);
	}
	.level-3 {
		background: var(--level-3);
	}
	.level-4 {
		background: var(--level-4);
	}

	.cell {
		padding: 0;
		border: none;
		cursor: default;
	}

	.cell:hover,
	.cell:focus-visible {
		outline: 2px solid var(--color-ink-muted);
		outline-offset: 1px;
	}
</style>
