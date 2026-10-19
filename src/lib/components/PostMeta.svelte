<script lang="ts">
	import { resolve } from '$app/paths';
	import Clock from '@lucide/svelte/icons/clock';
	import Eye from '@lucide/svelte/icons/eye';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';

	let {
		date,
		minutes,
		views,
		tags = []
	}: { date: string; minutes?: number; views: number; tags?: string[] } = $props();
</script>

<div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono-hack text-xs text-ink-muted">
	<span class="inline-flex items-center gap-1.5 tracking-widest text-accent">
		<CalendarDays class="size-3.5" />
		{date}
	</span>
	{#if minutes}
		<span class="inline-flex items-center gap-1.5"
			><Clock class="size-3.5" /> {minutes} 分鐘閱讀</span
		>
	{/if}
	<span class="inline-flex items-center gap-1.5"><Eye class="size-3.5" /> {views} 次瀏覽</span>
	{#each tags as tag (tag)}
		<a
			href={resolve('/tags/[tag]', { tag })}
			class="rounded-full border border-border-case px-2 py-0.5 transition hover:border-accent hover:text-accent"
			>#{tag}</a
		>
	{/each}
</div>
