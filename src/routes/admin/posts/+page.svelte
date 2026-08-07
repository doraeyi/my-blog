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
	<h1 class="text-2xl font-bold text-gray-900">文章管理</h1>
	<a
		href={resolve('/admin/posts/new')}
		class="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
	>
		<Plus class="size-4" />
		新增文章
	</a>
</div>

{#if data.posts.length === 0}
	<p class="mt-6 text-sm text-gray-500">還沒有任何文章。</p>
{/if}

<ul class="mt-6 space-y-3">
	{#each data.posts as post (post.id)}
		<li
			class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
		>
			<div>
				<div class="flex items-center gap-2">
					<span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
						{post.kind === 'article' ? '技術文章' : '心情'}
					</span>
					<span
						class="rounded-full px-2 py-0.5 text-xs font-medium {post.published
							? 'bg-green-100 text-green-700'
							: 'bg-yellow-100 text-yellow-700'}"
					>
						{post.published ? '已發布' : '草稿'}
					</span>
				</div>
				<p class="mt-1.5 font-medium text-gray-900">{post.title}</p>
				<p class="mt-0.5 text-xs text-gray-500">/{post.slug}</p>
			</div>
			<div class="flex items-center gap-4">
				<a
					href={resolve('/admin/posts/[id]/edit', { id: post.id })}
					class="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
				>
					<Pencil class="size-3.5" /> 編輯
				</a>
				<form method="post" action="?/remove" use:enhance>
					<input type="hidden" name="id" value={post.id} />
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
