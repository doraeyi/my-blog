<script lang="ts">
	import { enhance } from '$app/forms';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<h1 class="text-2xl font-bold text-ink">留言審核</h1>

{#if data.comments.length === 0}
	<p class="mt-6 text-sm text-ink-muted">還沒有留言。</p>
{/if}

<ul class="mt-6 space-y-3">
	{#each data.comments as comment (comment.id)}
		<li
			class="rounded-xl border border-border-case bg-surface-alt p-4 shadow-sm {comment.status ===
			'hidden'
				? 'opacity-50'
				: ''}"
		>
			<div class="flex items-center justify-between">
				<span class="font-medium text-ink">{comment.author.name}</span>
				<span class="flex items-center gap-2 text-xs text-ink-muted">
					<span class="rounded-full bg-surface px-2 py-0.5">{comment.postSlug}</span>
					<span class="rounded-full bg-surface px-2 py-0.5">{comment.status}</span>
				</span>
			</div>
			<p class="mt-2 text-sm text-ink-muted">{comment.body}</p>
			<div class="mt-3 flex gap-4">
				<form
					method="post"
					action={comment.status === 'visible' ? '?/hide' : '?/unhide'}
					use:enhance
				>
					<input type="hidden" name="id" value={comment.id} />
					<button
						type="submit"
						class="flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
					>
						{#if comment.status === 'visible'}
							<EyeOff class="size-3.5" /> 隱藏
						{:else}
							<Eye class="size-3.5" /> 取消隱藏
						{/if}
					</button>
				</form>
				<form method="post" action="?/delete" use:enhance>
					<input type="hidden" name="id" value={comment.id} />
					<button
						type="submit"
						class="flex items-center gap-1 text-sm text-stamp-500 hover:text-stamp-600 dark:text-stamp-300 dark:hover:text-stamp-200"
					>
						<Trash2 class="size-3.5" /> 刪除
					</button>
				</form>
			</div>
		</li>
	{/each}
</ul>
