<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Plus from '@lucide/svelte/icons/plus';
	import Upload from '@lucide/svelte/icons/upload';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Eye from '@lucide/svelte/icons/eye';
	import Star from '@lucide/svelte/icons/star';
	import Film from '@lucide/svelte/icons/film';
	import CirclePlay from '@lucide/svelte/icons/circle-play';
	import CircleCheckBig from '@lucide/svelte/icons/circle-check-big';
	import Check from '@lucide/svelte/icons/check';
	import XIcon from '@lucide/svelte/icons/x';
	import Clapperboard from '@lucide/svelte/icons/clapperboard';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let watching = $derived(data.items.find((item) => item.status === 'watching'));
	let watched = $derived(data.items.filter((item) => item.status !== 'watching'));
</script>

<div class="flex flex-wrap items-end justify-between gap-3">
	<div>
		<h1 class="flex items-center gap-2 text-2xl font-bold text-ink">
			<Clapperboard class="size-6 text-accent" />
			追劇紀錄管理
		</h1>
		<p class="mt-1 text-sm text-ink-muted">共 {data.items.length} 部作品</p>
	</div>
</div>

<div class="mt-6 grid gap-4 sm:grid-cols-2">
	<form
		method="post"
		action="?/addByTitle"
		use:enhance
		class="flex flex-col gap-3 rounded-2xl border border-border-case bg-surface-alt p-4 shadow-sm"
	>
		<p class="flex items-center gap-1.5 text-sm font-semibold text-ink">
			<Sparkles class="size-4 text-accent" />
			單筆新增
		</p>
		<p class="-mt-1.5 text-xs text-ink-muted">輸入片名，自動比對 TMDB 抓海報、簡介與演員名單</p>
		<div class="flex gap-2">
			<input
				name="title"
				placeholder="片名"
				class="flex-1 rounded-lg border border-border-case bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:ring-2 focus:ring-accent focus:outline-none"
				required
			/>
			<select
				name="type"
				class="rounded-lg border border-border-case bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:ring-2 focus:ring-accent focus:outline-none"
			>
				<option value="movie">電影</option>
				<option value="tv">影集</option>
			</select>
			<button
				type="submit"
				class="flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-strong"
			>
				<Plus class="size-4" />
				新增
			</button>
		</div>
	</form>

	<form
		method="post"
		action="?/importCsv"
		use:enhance
		enctype="multipart/form-data"
		class="flex flex-col gap-3 rounded-2xl border border-border-case bg-surface-alt p-4 shadow-sm"
	>
		<p class="flex items-center gap-1.5 text-sm font-semibold text-ink">
			<Upload class="size-4 text-accent" />
			CSV 匯入
		</p>
		<p class="-mt-1.5 text-xs text-ink-muted">欄位為 title,type（movie / tv），會標記為已看完</p>
		<div class="flex gap-2">
			<input
				type="file"
				name="file"
				accept=".csv"
				required
				class="flex-1 rounded-lg border border-border-case bg-surface px-3 py-1.5 text-sm text-ink file:mr-2 file:rounded-md file:border-0 file:bg-surface-alt file:px-2 file:py-1 file:text-xs file:font-medium file:text-ink"
			/>
			<button
				type="submit"
				class="flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-strong"
			>
				<Upload class="size-4" />
				匯入
			</button>
		</div>
	</form>
</div>

{#if form?.message}
	<p
		class="mt-3 rounded-lg border border-stamp-200 bg-stamp-50 px-3 py-2 text-sm text-stamp-600 dark:border-stamp-700 dark:bg-stamp-700/10 dark:text-stamp-300"
	>
		{form.message}
	</p>
{/if}

{#if form && 'results' in form && form.results}
	<ul
		class="mt-3 space-y-1 rounded-xl border border-border-case bg-surface-alt p-3 text-sm shadow-sm"
	>
		{#each form.results as result (result.title)}
			<li
				class="flex items-center gap-1.5 {result.ok
					? 'text-ink'
					: 'text-stamp-500 dark:text-stamp-300'}"
			>
				{#if result.ok}
					<Check class="size-3.5 shrink-0 text-green-600 dark:text-green-400" />
				{:else}
					<XIcon class="size-3.5 shrink-0" />
				{/if}
				{result.title}
				{#if result.error}<span class="text-ink-muted">— {result.error}</span>{/if}
			</li>
		{/each}
	</ul>
{/if}

{#if watching}
	<section class="mt-8">
		<h2
			class="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-ink-muted uppercase"
		>
			<CirclePlay class="size-3.5 text-accent" />
			正在觀看
		</h2>
		<div
			class="mt-3 flex flex-wrap gap-4 rounded-2xl border border-accent/30 bg-accent/5 p-4 shadow-sm sm:flex-nowrap"
		>
			{#if watching.posterUrl}
				<img
					src={watching.posterUrl}
					alt={watching.title}
					class="h-40 w-28 shrink-0 rounded-lg object-cover shadow-md"
				/>
			{/if}
			<div class="min-w-0 flex-1">
				<div class="flex flex-wrap items-center gap-2">
					<a
						href={resolve('/watch/[id]', { id: watching.id })}
						class="font-display text-lg font-semibold text-ink hover:underline"
					>
						{watching.title}
					</a>
					<span class="rounded-full border border-border-case px-2 py-0.5 text-xs text-ink-muted">
						{watching.mediaType === 'movie' ? '電影' : '影集'}
					</span>
					{#if watching.voteAverage}
						<span class="flex items-center gap-1 text-xs text-ink-muted">
							<Star class="size-3 text-yellow-500" />
							{watching.voteAverage.toFixed(1)}
						</span>
					{/if}
				</div>

				{#if watching.mediaType === 'tv'}
					<form
						method="post"
						action="?/updateProgress"
						use:enhance
						class="mt-2 flex items-center gap-1.5"
					>
						<input type="hidden" name="id" value={watching.id} />
						<span class="text-xs text-ink-muted">S</span>
						<input
							type="number"
							name="currentSeason"
							min="0"
							value={watching.currentSeason ?? ''}
							class="w-12 rounded-md border border-border-case bg-surface px-1.5 py-1 text-xs text-ink"
						/>
						<span class="text-xs text-ink-muted">E</span>
						<input
							type="number"
							name="currentEpisode"
							min="0"
							value={watching.currentEpisode ?? ''}
							class="w-12 rounded-md border border-border-case bg-surface px-1.5 py-1 text-xs text-ink"
						/>
						<button
							type="submit"
							class="rounded-md bg-surface px-2 py-1 text-xs font-medium text-accent hover:bg-surface-alt"
						>
							存
						</button>
						{#if watching.totalSeasons}
							<span class="text-xs text-ink-muted">共 {watching.totalSeasons} 季</span>
						{/if}
					</form>
				{/if}

				<div class="mt-3 flex items-center gap-1">
					<a
						href={resolve('/watch/[id]', { id: watching.id })}
						title="預覽"
						class="rounded-full p-1.5 text-ink-muted transition hover:bg-surface hover:text-ink"
					>
						<Eye class="size-4" />
					</a>
					<form method="post" action="?/sync" use:enhance>
						<input type="hidden" name="id" value={watching.id} />
						<button
							type="submit"
							title="同步"
							class="rounded-full p-1.5 text-ink-muted transition hover:bg-surface hover:text-accent"
						>
							<RefreshCw class="size-4" />
						</button>
					</form>
					<form method="post" action="?/setStatus" use:enhance>
						<input type="hidden" name="id" value={watching.id} />
						<input type="hidden" name="status" value="watched" />
						<button
							type="submit"
							title="標記為已看完"
							class="rounded-full p-1.5 text-ink-muted transition hover:bg-surface hover:text-accent"
						>
							<CircleCheckBig class="size-4" />
						</button>
					</form>
					<form method="post" action="?/remove" use:enhance>
						<input type="hidden" name="id" value={watching.id} />
						<button
							type="submit"
							title="移除"
							class="rounded-full p-1.5 text-ink-muted transition hover:bg-stamp-50 hover:text-stamp-500 dark:hover:bg-stamp-700/20"
						>
							<Trash2 class="size-4" />
						</button>
					</form>
				</div>
			</div>
		</div>
	</section>
{/if}

<section class="mt-8">
	<h2
		class="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-ink-muted uppercase"
	>
		<Film class="size-3.5" />
		片庫（{watched.length}）
	</h2>

	{#if data.items.length === 0}
		<p class="mt-3 text-sm text-ink-muted">還沒有任何紀錄。</p>
	{/if}

	<ul class="mt-3 grid gap-4 sm:grid-cols-2">
		{#each watched as item (item.id)}
			<li
				class="flex gap-3 rounded-2xl border border-border-case bg-surface-alt p-3 shadow-sm transition hover:shadow-md"
			>
				{#if item.posterUrl}
					<img
						src={item.posterUrl}
						alt={item.title}
						class="h-28 w-20 shrink-0 rounded-lg object-cover shadow-sm"
					/>
				{:else}
					<div
						class="flex h-28 w-20 shrink-0 items-center justify-center rounded-lg bg-surface text-ink-muted"
					>
						<Film class="size-5" />
					</div>
				{/if}

				<div class="min-w-0 flex-1">
					<a
						href={resolve('/watch/[id]', { id: item.id })}
						class="line-clamp-1 font-medium text-ink hover:underline"
					>
						{item.title}
					</a>
					<div class="mt-1 flex flex-wrap items-center gap-1.5">
						<span
							class="rounded-full border border-border-case px-1.5 py-0.5 text-[11px] text-ink-muted"
						>
							{item.mediaType === 'movie' ? '電影' : '影集'}
						</span>
						<span
							class="rounded-full bg-green-100 px-1.5 py-0.5 text-[11px] font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300"
						>
							已看完
						</span>
						{#if item.voteAverage}
							<span class="flex items-center gap-0.5 text-[11px] text-ink-muted">
								<Star class="size-3 text-yellow-500" />
								{item.voteAverage.toFixed(1)}
							</span>
						{/if}
					</div>

					{#if item.mediaType === 'tv'}
						<form
							method="post"
							action="?/updateProgress"
							use:enhance
							class="mt-2 flex items-center gap-1"
						>
							<input type="hidden" name="id" value={item.id} />
							<span class="text-[11px] text-ink-muted">S</span>
							<input
								type="number"
								name="currentSeason"
								min="0"
								value={item.currentSeason ?? ''}
								class="w-10 rounded-md border border-border-case bg-surface px-1 py-0.5 text-[11px] text-ink"
							/>
							<span class="text-[11px] text-ink-muted">E</span>
							<input
								type="number"
								name="currentEpisode"
								min="0"
								value={item.currentEpisode ?? ''}
								class="w-10 rounded-md border border-border-case bg-surface px-1 py-0.5 text-[11px] text-ink"
							/>
							<button
								type="submit"
								class="rounded-md bg-surface px-1.5 py-0.5 text-[11px] font-medium text-accent hover:bg-surface-alt"
							>
								存
							</button>
						</form>
					{/if}

					<div class="mt-2 flex items-center gap-0.5">
						<a
							href={resolve('/watch/[id]', { id: item.id })}
							title="預覽"
							class="rounded-full p-1.5 text-ink-muted transition hover:bg-surface hover:text-ink"
						>
							<Eye class="size-3.5" />
						</a>
						<form method="post" action="?/sync" use:enhance>
							<input type="hidden" name="id" value={item.id} />
							<button
								type="submit"
								title="同步"
								class="rounded-full p-1.5 text-ink-muted transition hover:bg-surface hover:text-accent"
							>
								<RefreshCw class="size-3.5" />
							</button>
						</form>
						<form method="post" action="?/setStatus" use:enhance>
							<input type="hidden" name="id" value={item.id} />
							<input type="hidden" name="status" value="watching" />
							<button
								type="submit"
								title="標記為觀看中"
								class="rounded-full p-1.5 text-ink-muted transition hover:bg-surface hover:text-accent"
							>
								<CirclePlay class="size-3.5" />
							</button>
						</form>
						<form method="post" action="?/remove" use:enhance>
							<input type="hidden" name="id" value={item.id} />
							<button
								type="submit"
								title="移除"
								class="rounded-full p-1.5 text-ink-muted transition hover:bg-stamp-50 hover:text-stamp-500 dark:hover:bg-stamp-700/20"
							>
								<Trash2 class="size-3.5" />
							</button>
						</form>
					</div>
				</div>
			</li>
		{/each}
	</ul>
</section>
