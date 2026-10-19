<script lang="ts">
	import { mermaidDiagrams } from '$lib/actions/mermaid';

	let { name = 'body', initialValue = '' }: { name?: string; initialValue?: string } = $props();

	// Intentional one-time seed: the page remounts this component on navigation
	// (new/edit are different routes), so initialValue never changes in place.
	// svelte-ignore state_referenced_locally
	let body = $state(initialValue);
	let html = $state('');
	let previewError = $state('');
	let debounceHandle: ReturnType<typeof setTimeout> | undefined;

	function schedulePreview(markdown: string) {
		clearTimeout(debounceHandle);
		debounceHandle = setTimeout(async () => {
			try {
				const res = await fetch('/admin/posts/preview', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ markdown })
				});
				if (!res.ok) throw new Error();
				({ html } = await res.json());
				previewError = '';
			} catch {
				previewError = '預覽失敗';
			}
		}, 400);
	}

	$effect(() => {
		schedulePreview(body);
	});
</script>

<div class="grid gap-4 md:grid-cols-2">
	<textarea
		{name}
		bind:value={body}
		required
		rows="20"
		class="w-full rounded-lg border border-border-case bg-surface p-3 font-mono text-sm text-ink focus:border-accent focus:ring-2 focus:ring-accent focus:outline-none"
		placeholder="以 Markdown 撰寫內容..."></textarea>
	<div
		class="prose prose-sm max-w-none rounded-lg border border-border-case bg-surface-alt p-3 sm:prose-base dark:prose-invert"
		use:mermaidDiagrams={html}
	>
		{#if previewError}
			<p class="text-sm text-stamp-500 dark:text-stamp-300">{previewError}</p>
		{:else}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -- html is server-rendered via renderMarkdown()+rehype-sanitize at /admin/posts/preview, admin-authored content -->
			{@html html}
		{/if}
	</div>
</div>
