<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Plus from '@lucide/svelte/icons/plus';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Eye from '@lucide/svelte/icons/eye';
	import Clock from '@lucide/svelte/icons/clock';
	import FileText from '@lucide/svelte/icons/file-text';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const sections = [
		{ key: 'problem', label: '案件背景／卡在哪', hint: '要解決什麼問題、遇到什麼限制' },
		{ key: 'investigation', label: '調查過程', hint: '試過什麼、怎麼找到原因' },
		{ key: 'solution', label: '解法', hint: '最後怎麼做、關鍵技術決定' },
		{ key: 'result', label: '成果', hint: '數字、截圖、上線後的回饋' }
	] as const;
</script>

<h1 class="text-2xl font-bold text-ink">作品集管理</h1>

<form
	method="post"
	action="?/add"
	use:enhance
	class="mt-4 flex gap-2 rounded-xl border border-border-case bg-surface-alt p-3 shadow-sm"
>
	<input
		name="repo"
		placeholder="owner/repo 或 https://github.com/owner/repo"
		class="flex-1 rounded-lg border border-border-case bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:ring-2 focus:ring-accent focus:outline-none"
		required
	/>
	<button
		type="submit"
		class="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-strong"
	>
		<Plus class="size-4" />
		新增
	</button>
</form>
{#if form?.message}
	<p class="mt-2 text-sm text-stamp-500 dark:text-stamp-300">{form.message}</p>
{/if}

{#if data.projects.length === 0}
	<p class="mt-6 text-sm text-ink-muted">還沒有追蹤任何 repo。</p>
{/if}

<ul class="mt-6 space-y-3">
	{#each data.projects as project (project.id)}
		<li
			class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-case bg-surface-alt p-4 shadow-sm"
		>
			<div>
				<a
					href="https://github.com/{project.githubOwner}/{project.githubRepo}"
					target="_blank"
					rel="noreferrer"
					class="font-medium text-ink hover:underline"
				>
					{project.githubOwner}/{project.githubRepo}
				</a>
				<p class="mt-0.5 flex items-center gap-1 text-xs text-ink-muted">
					<Clock class="size-3" />
					{project.lastSyncedAt
						? `上次同步：${project.lastSyncedAt.toLocaleString('zh-TW')}`
						: '尚未同步'}
				</p>
			</div>
			<div class="flex items-center gap-4">
				<a
					href={resolve('/portfolio/[id]', { id: project.id })}
					class="flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
				>
					<Eye class="size-3.5" /> 預覽
				</a>
				<form method="post" action="?/sync" use:enhance>
					<input type="hidden" name="id" value={project.id} />
					<button
						type="submit"
						class="flex items-center gap-1 text-sm text-accent hover:text-accent-strong"
					>
						<RefreshCw class="size-3.5" /> 同步
					</button>
				</form>
				<form method="post" action="?/remove" use:enhance>
					<input type="hidden" name="id" value={project.id} />
					<button
						type="submit"
						class="flex items-center gap-1 text-sm text-stamp-500 hover:text-stamp-600 dark:text-stamp-300 dark:hover:text-stamp-200"
					>
						<Trash2 class="size-3.5" /> 移除
					</button>
				</form>
			</div>
			<details class="w-full rounded-lg border border-dashed border-border-case bg-surface p-3">
				<summary class="flex cursor-pointer items-center gap-1.5 text-sm text-ink-muted">
					<FileText class="size-3.5" />
					結案報告 {project.caseReport ? '（已撰寫）' : '（尚未撰寫）'}
				</summary>
				<form method="post" action="?/saveReport" use:enhance class="mt-3 space-y-3">
					<input type="hidden" name="id" value={project.id} />
					<label class="block text-sm text-ink">
						一句話簡介
						<input
							name="brief"
							value={project.caseReport?.brief ?? ''}
							placeholder="這個專案是什麼、為誰做的"
							class="mt-1 w-full rounded-lg border border-border-case bg-surface px-3 py-2 text-sm"
						/>
					</label>
					<label class="block text-sm text-ink">
						我的角色
						<input
							name="role"
							value={project.caseReport?.role ?? ''}
							placeholder="例如：個人專案、前端負責人"
							class="mt-1 w-full rounded-lg border border-border-case bg-surface px-3 py-2 text-sm"
						/>
					</label>
					{#each sections as s (s.key)}
						<label class="block text-sm text-ink">
							{s.label} <span class="text-xs text-ink-muted">— {s.hint}（支援 Markdown）</span>
							<textarea
								name={s.key}
								rows="4"
								class="mt-1 w-full rounded-lg border border-border-case bg-surface px-3 py-2 font-mono-hack text-sm"
								>{project.caseReport?.[s.key] ?? ''}</textarea
							>
						</label>
					{/each}
					<div class="flex items-center gap-3">
						<button
							type="submit"
							class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-strong"
						>
							儲存報告
						</button>
						{#if form && 'savedId' in form && form.savedId === project.id}
							<span class="text-sm text-ink-muted">已儲存</span>
						{/if}
						<span class="text-xs text-ink-muted">全部清空再儲存＝移除報告</span>
					</div>
				</form>
			</details>
		</li>
	{/each}
</ul>
