<script lang="ts">
	import { enhance } from '$app/forms';
	import MarkdownEditor from '$lib/components/MarkdownEditor.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<h1 class="text-2xl font-bold text-gray-900">編輯文章</h1>

<form method="post" use:enhance class="mt-4 space-y-4">
	<div class="flex flex-wrap items-center gap-4">
		<span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
			{data.post.kind === 'article' ? '技術文章' : '心情'}
		</span>
		<label class="flex items-center gap-1.5 text-sm text-gray-700">
			<input type="checkbox" name="published" checked={data.post.published} />
			發布
		</label>
	</div>
	<input
		name="title"
		placeholder="標題"
		required
		value={data.post.title}
		class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
	/>
	<input
		name="slug"
		placeholder="網址代稱（英數與 -）"
		required
		value={data.post.slug}
		class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
	/>
	<input
		name="excerpt"
		placeholder="摘要（選填）"
		value={data.post.excerpt ?? ''}
		class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
	/>
	<MarkdownEditor initialValue={data.post.body} />
	<button
		type="submit"
		class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
	>
		儲存
	</button>
</form>
{#if form?.message}
	<p class="mt-2 text-sm text-red-600">{form.message}</p>
{/if}
