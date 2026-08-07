<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="mx-auto max-w-3xl px-6 pt-28 pb-16">
	<article class="min-w-0">
		<h1 class="font-display text-3xl font-bold text-ink">{data.post.title}</h1>
		<p class="mt-2 font-display text-xs tracking-widest text-accent uppercase">
			{data.post.createdAt.toLocaleDateString('zh-TW')}
		</p>

		<section class="prose prose-sm mt-8 max-w-none sm:prose-base dark:prose-invert">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -- bodyHtml is rendered via renderMarkdown() + rehype-sanitize, admin-authored content, never raw user input -->
			{@html data.bodyHtml}
		</section>

		<section id="comments" class="mt-8">
			<h2 class="text-lg font-semibold text-ink">留言（{data.comments.length}）</h2>

			<ul class="mt-4 space-y-3">
				{#each data.comments as comment (comment.id)}
					<li class="rounded-xl border border-border-case bg-surface-alt p-4">
						<span class="font-medium text-ink">{comment.author.name}</span>
						<p class="mt-1 text-sm text-ink-muted">{comment.body}</p>
					</li>
				{/each}
			</ul>

			<form method="post" action="?/comment" use:enhance class="mt-4 space-y-2">
				<textarea
					name="body"
					required
					rows="3"
					placeholder="留下你的想法..."
					class="w-full rounded-lg border border-border-case bg-surface p-3 text-sm text-ink focus:border-accent focus:ring-2 focus:ring-accent/40 focus:outline-none"
				></textarea>
				<button
					type="submit"
					class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-strong"
				>
					送出留言
				</button>
			</form>
			{#if form?.message}
				<p class="mt-2 text-sm text-red-600">{form.message}</p>
			{/if}
		</section>
	</article>
</div>
