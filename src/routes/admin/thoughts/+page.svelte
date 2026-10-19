<script lang="ts">
	import { enhance } from '$app/forms';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Link from '@lucide/svelte/icons/link';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let formEl: HTMLFormElement | undefined = $state();
</script>

<h1 class="text-2xl font-bold text-ink">碎念</h1>
<p class="mt-1 text-sm text-ink-muted">想到什麼寫什麼，送出就直接公開在 /thinking。</p>

<form
	bind:this={formEl}
	method="post"
	action="?/create"
	use:enhance={() =>
		async ({ result, update }) => {
			await update();
			if (result.type === 'success') formEl?.reset();
		}}
	class="mt-6 space-y-3 rounded-xl border border-border-case bg-surface-alt p-4"
>
	<textarea
		name="body"
		required
		rows="3"
		placeholder="現在在想什麼？"
		class="w-full rounded-lg border border-border-case bg-surface p-3 text-sm text-ink focus:border-accent focus:ring-2 focus:ring-accent/40 focus:outline-none"
	></textarea>
	<label class="flex items-center gap-2">
		<Link class="size-4 shrink-0 text-ink-muted" />
		<input
			name="linkUrl"
			type="url"
			placeholder="附上連結（選填）"
			class="w-full rounded-lg border border-border-case bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:ring-2 focus:ring-accent/40 focus:outline-none"
		/>
	</label>
	<div class="flex items-center justify-between gap-3">
		{#if form?.message}
			<p class="text-sm text-red-600">{form.message}</p>
		{:else}
			<span></span>
		{/if}
		<button
			type="submit"
			class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-strong"
		>
			發佈
		</button>
	</div>
</form>

{#if data.thoughts.length === 0}
	<p class="mt-6 text-sm text-ink-muted">還沒有碎念。</p>
{/if}

<ul class="mt-6 space-y-3">
	{#each data.thoughts as t (t.id)}
		<li class="rounded-xl border border-border-case bg-surface-alt p-4">
			<p class="text-sm whitespace-pre-line text-ink">{t.body}</p>
			{#if t.linkUrl}
				<p class="mt-1 truncate text-xs text-ink-muted">{t.linkUrl}</p>
			{/if}
			<div class="mt-3 flex items-center justify-between text-xs text-ink-muted">
				<span>{t.createdAt.toLocaleString('zh-TW')}</span>
				<form method="post" action="?/delete" use:enhance>
					<input type="hidden" name="id" value={t.id} />
					<button
						type="submit"
						class="flex items-center gap-1 text-stamp-500 hover:text-stamp-600 dark:text-stamp-300"
					>
						<Trash2 class="size-3.5" /> 刪除
					</button>
				</form>
			</div>
		</li>
	{/each}
</ul>
