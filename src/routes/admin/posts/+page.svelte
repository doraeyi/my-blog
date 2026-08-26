<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Plus from '@lucide/svelte/icons/plus';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="flex items-center justify-between">
	<h1 class="text-2xl font-bold text-ink">文章管理</h1>
	<a
		href={resolve('/admin/posts/new')}
		class="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-strong"
	>
		<Plus class="size-4" />
		新增文章
	</a>
</div>

{#if data.posts.length === 0}
	<p class="mt-6 text-sm text-ink-muted">還沒有任何文章。</p>
{/if}

<ul class="mt-6 space-y-3">
	{#each data.posts as post (post.id)}
		<li
			class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-case bg-surface-alt p-4 shadow-sm"
		>
			<div>
				<div class="flex items-center gap-2">
					<span class="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-ink-muted">
						{post.kind === 'article' ? '技術文章' : '心情'}
					</span>
					<span
						class="rounded-full px-2 py-0.5 text-xs font-medium {post.published
							? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
							: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'}"
					>
						{post.published ? '已發布' : '草稿'}
					</span>
				</div>
				<p class="mt-1.5 font-medium text-ink">{post.title}</p>
				<p class="mt-0.5 text-xs text-ink-muted">/{post.slug}</p>
			</div>
			<div class="flex items-center gap-4">
				<a
					href={resolve('/admin/posts/[id]/edit', { id: post.id })}
					class="flex items-center gap-1 text-sm text-accent hover:text-accent-strong"
				>
					<Pencil class="size-3.5" /> 編輯
				</a>
				<form method="post" action="?/remove" use:enhance>
					<input type="hidden" name="id" value={post.id} />
					<button
						type="submit"
						class="flex items-center gap-1 text-sm text-stamp-500 hover:text-stamp-600 dark:text-stamp-300 dark:hover:text-stamp-200"
					>
						<Trash2 class="size-3.5" /> 移除
					</button>
				</form>
			</div>
		</li>
	{/each}
</ul>
