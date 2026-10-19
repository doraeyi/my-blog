<script lang="ts">
	import { enhance } from '$app/forms';
	import MarkdownEditor from '$lib/components/MarkdownEditor.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<h1 class="text-2xl font-bold text-ink">新增文章</h1>

<form method="post" use:enhance class="mt-4 space-y-4">
	<div class="flex flex-wrap items-center gap-4">
		<label class="text-sm text-ink-muted">
			類型
			<select
				name="kind"
				required
				class="ml-2 rounded-lg border border-border-case bg-surface px-2 py-1.5 text-ink"
			>
				<option value="article">技術文章</option>
				<option value="mood">心情</option>
			</select>
		</label>
		<label class="flex items-center gap-1.5 text-sm text-ink-muted">
			<input type="checkbox" name="published" />
			發布
		</label>
	</div>
	<input
		name="title"
		placeholder="標題"
		required
		class="w-full rounded-lg border border-border-case bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:ring-2 focus:ring-accent focus:outline-none"
	/>
	<input
		name="slug"
		placeholder="網址代稱（英數與 -）"
		required
		class="w-full rounded-lg border border-border-case bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:ring-2 focus:ring-accent focus:outline-none"
	/>
	<input
		name="excerpt"
		placeholder="摘要（選填）"
		class="w-full rounded-lg border border-border-case bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:ring-2 focus:ring-accent focus:outline-none"
	/>
	<div class="grid gap-4 sm:grid-cols-2">
		<input
			name="tags"
			placeholder="標籤，用逗號分隔（選填）"
			class="w-full rounded-lg border border-border-case bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:ring-2 focus:ring-accent focus:outline-none"
		/>
		<input
			name="series"
			placeholder="系列名稱（選填，同名的文章會串成一個系列）"
			class="w-full rounded-lg border border-border-case bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:ring-2 focus:ring-accent focus:outline-none"
		/>
	</div>
	<MarkdownEditor />
	<button
		type="submit"
		class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-strong"
	>
		建立
	</button>
</form>
{#if form?.message}
	<p class="mt-2 text-sm text-stamp-500 dark:text-stamp-300">{form.message}</p>
{/if}
