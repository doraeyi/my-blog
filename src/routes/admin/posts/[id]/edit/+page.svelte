<script lang="ts">
	import { enhance } from '$app/forms';
	import MarkdownEditor from '$lib/components/MarkdownEditor.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<h1 class="text-2xl font-bold text-ink">編輯文章</h1>

<form method="post" use:enhance class="mt-4 space-y-4">
	<div class="flex flex-wrap items-center gap-4">
		<span class="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-ink-muted">
			{data.post.kind === 'article' ? '技術文章' : '心情'}
		</span>
		<label class="flex items-center gap-1.5 text-sm text-ink-muted">
			<input type="checkbox" name="published" checked={data.post.published} />
			發布
		</label>
	</div>
	<input
		name="title"
		placeholder="標題"
		required
		value={data.post.title}
		class="w-full rounded-lg border border-border-case bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:ring-2 focus:ring-accent focus:outline-none"
	/>
	<input
		name="slug"
		placeholder="網址代稱（英數與 -）"
		required
		value={data.post.slug}
		class="w-full rounded-lg border border-border-case bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:ring-2 focus:ring-accent focus:outline-none"
	/>
	<input
		name="excerpt"
		placeholder="摘要（選填）"
		value={data.post.excerpt ?? ''}
		class="w-full rounded-lg border border-border-case bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:ring-2 focus:ring-accent focus:outline-none"
	/>
	<div class="grid gap-4 sm:grid-cols-2">
		<input
			name="tags"
			placeholder="標籤，用逗號分隔（選填）"
			value={data.post.tags.join(', ')}
			class="w-full rounded-lg border border-border-case bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:ring-2 focus:ring-accent focus:outline-none"
		/>
		<input
			name="series"
			placeholder="系列名稱（選填，同名的文章會串成一個系列）"
			value={data.post.series ?? ''}
			class="w-full rounded-lg border border-border-case bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:ring-2 focus:ring-accent focus:outline-none"
		/>
	</div>
	<MarkdownEditor initialValue={data.post.body} />
	<button
		type="submit"
		class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-strong"
	>
		儲存
	</button>
</form>
{#if form?.message}
	<p class="mt-2 text-sm text-stamp-500 dark:text-stamp-300">{form.message}</p>
{/if}
