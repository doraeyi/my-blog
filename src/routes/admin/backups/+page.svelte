<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import DatabaseBackup from '@lucide/svelte/icons/database-backup';
	import Download from '@lucide/svelte/icons/download';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let running = $state(false);

	const size = (n: number) =>
		n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(n / 1024)} KB`;
	const latest = $derived(data.backups[0] ?? null);
	const stale = $derived(!latest || Date.now() - latest.createdAt.getTime() > 36 * 60 * 60 * 1000);
</script>

<div class="flex flex-wrap items-end justify-between gap-3">
	<div>
		<h1 class="text-2xl font-bold text-ink">備份</h1>
		<p class="mt-1 text-sm text-ink-muted">
			每天凌晨 4 點後自動備份整個資料庫（留言、訂閱者、友鏈、流量…），保留最近 30 份。
		</p>
	</div>
	<form
		method="post"
		action="?/run"
		use:enhance={() => {
			running = true;
			return async ({ update }) => {
				await update();
				running = false;
			};
		}}
	>
		<button
			class="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-strong disabled:opacity-60"
			disabled={running}
		>
			<DatabaseBackup class="size-4" />
			{running ? '備份中…' : '立即備份'}
		</button>
	</form>
</div>

{#if form && 'message' in form && form.message}
	<p class="mt-4 rounded-lg border border-stamp-300 bg-stamp-50 px-3 py-2 text-sm text-stamp-600">
		{form.message}
	</p>
{:else if form && 'notice' in form && form.notice}
	<p
		class="mt-4 rounded-lg border border-emerald-600/40 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400"
	>
		{form.notice}
	</p>
{/if}

<div class="mt-6 grid gap-3 sm:grid-cols-2">
	<div class="rounded-xl border border-border-case bg-surface-alt p-4">
		<p class="text-xs text-ink-muted">最近一次</p>
		<p class="mt-1 text-lg {stale ? 'text-stamp-500' : 'text-ink'}">
			{latest ? latest.createdAt.toLocaleString('zh-TW') : '還沒有備份'}
		</p>
		{#if stale}<p class="text-xs text-stamp-500">超過一天半沒有新備份，檢查一下。</p>{/if}
	</div>
	<div class="rounded-xl border border-border-case bg-surface-alt p-4">
		<p class="text-xs text-ink-muted">異地備份</p>
		{#if data.offsite}
			<p class="mt-1 text-lg text-emerald-600">已啟用</p>
			<p class="text-xs text-ink-muted">每份也會上傳到外部儲存空間，VM 壞掉也救得回來。</p>
		{:else}
			<p class="mt-1 text-lg text-brass">未設定</p>
			<p class="text-xs text-ink-muted">
				目前只存在 VM 上。設定 BACKUP_S3_* 後會同時上傳到 R2 等外部空間。
			</p>
		{/if}
	</div>
</div>

<ul
	class="mt-6 divide-y divide-border-case rounded-xl border border-border-case bg-surface-alt text-sm"
>
	{#each data.backups as b (b.name)}
		<li class="flex items-center gap-3 p-3">
			<span class="min-w-0 flex-1 truncate font-mono-hack text-ink">{b.name}</span>
			<span class="font-mono-hack text-xs text-ink-muted">{size(b.size)}</span>
			<a
				href={resolve('/admin/backups/[name]', { name: b.name })}
				class="inline-flex items-center gap-1 rounded-md border border-border-case px-2.5 py-1 text-xs text-ink-muted hover:border-accent hover:text-accent"
				data-sveltekit-reload
				download
			>
				<Download class="size-3.5" /> 下載
			</a>
		</li>
	{:else}
		<li class="p-3 text-ink-muted">還沒有備份。按「立即備份」先做一份。</li>
	{/each}
</ul>
