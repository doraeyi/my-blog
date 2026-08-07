<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Plus from '@lucide/svelte/icons/plus';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Eye from '@lucide/svelte/icons/eye';
	import Clock from '@lucide/svelte/icons/clock';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<h1 class="text-2xl font-bold text-gray-900">作品集管理</h1>

<form
	method="post"
	action="?/add"
	use:enhance
	class="mt-4 flex gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
>
	<input
		name="repo"
		placeholder="owner/repo 或 https://github.com/owner/repo"
		class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
		required
	/>
	<button
		type="submit"
		class="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
	>
		<Plus class="size-4" />
		新增
	</button>
</form>
{#if form?.message}
	<p class="mt-2 text-sm text-red-600">{form.message}</p>
{/if}

{#if data.projects.length === 0}
	<p class="mt-6 text-sm text-gray-500">還沒有追蹤任何 repo。</p>
{/if}

<ul class="mt-6 space-y-3">
	{#each data.projects as project (project.id)}
		<li
			class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
		>
			<div>
				<a
					href="https://github.com/{project.githubOwner}/{project.githubRepo}"
					target="_blank"
					rel="noreferrer"
					class="font-medium text-gray-900 hover:underline"
				>
					{project.githubOwner}/{project.githubRepo}
				</a>
				<p class="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
					<Clock class="size-3" />
					{project.lastSyncedAt
						? `上次同步：${project.lastSyncedAt.toLocaleString('zh-TW')}`
						: '尚未同步'}
				</p>
			</div>
			<div class="flex items-center gap-4">
				<a
					href={resolve('/portfolio/[id]', { id: project.id })}
					class="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
				>
					<Eye class="size-3.5" /> 預覽
				</a>
				<form method="post" action="?/sync" use:enhance>
					<input type="hidden" name="id" value={project.id} />
					<button
						type="submit"
						class="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
					>
						<RefreshCw class="size-3.5" /> 同步
					</button>
				</form>
				<form method="post" action="?/remove" use:enhance>
					<input type="hidden" name="id" value={project.id} />
					<button
						type="submit"
						class="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
					>
						<Trash2 class="size-3.5" /> 移除
					</button>
				</form>
			</div>
		</li>
	{/each}
</ul>
