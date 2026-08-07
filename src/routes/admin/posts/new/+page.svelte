<script lang="ts">
	import { enhance } from '$app/forms';
	import MarkdownEditor from '$lib/components/MarkdownEditor.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<h1 class="text-2xl font-bold text-gray-900">新增文章</h1>

<form method="post" use:enhance class="mt-4 space-y-4">
	<div class="flex flex-wrap items-center gap-4">
		<label class="text-sm text-gray-700">
			類型
			<select name="kind" required class="ml-2 rounded-lg border border-gray-300 px-2 py-1.5">
				<option value="article">技術文章</option>
				<option value="mood">心情</option>
			</select>
		</label>
		<label class="flex items-center gap-1.5 text-sm text-gray-700">
			<input type="checkbox" name="published" />
			發布
		</label>
	</div>
	<input
		name="title"
		placeholder="標題"
		required
		class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
	/>
	<input
		name="slug"
		placeholder="網址代稱（英數與 -）"
		required
		class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
	/>
	<input
		name="excerpt"
		placeholder="摘要（選填）"
		class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
	/>
	<MarkdownEditor />
	<button
		type="submit"
		class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
	>
		建立
	</button>
</form>
{#if form?.message}
	<p class="mt-2 text-sm text-red-600">{form.message}</p>
{/if}
