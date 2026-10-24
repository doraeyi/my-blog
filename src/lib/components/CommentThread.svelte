<!--
	The comment thread used everywhere (posts, projects, watch log, guestbook…).
	Top-level comments newest first; replies hang under the comment they belong
	to, oldest first, one level deep. Each comment can be answered inline, and
	its author gets an in-site notification. Every comment has an anchor
	(#comment-<id>) so notifications can link straight to it.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { reveal } from '$lib/actions/reveal';
	import { timeAgo } from '$lib/format';
	import Send from '@lucide/svelte/icons/send';
	import Reply from '@lucide/svelte/icons/reply';
	import MessagesSquare from '@lucide/svelte/icons/messages-square';
	import type { SubmitFunction } from '@sveltejs/kit';

	interface Comment {
		id: string;
		body: string;
		createdAt: Date;
		parentId?: string | null;
		author: { name: string; image: string | null };
	}

	let {
		comments,
		message,
		title = '證詞',
		placeholder = '留下你的想法…'
	}: {
		comments: Comment[];
		/** Error text from the action's `fail()`, if any. */
		message?: string;
		title?: string;
		placeholder?: string;
	} = $props();

	const user = $derived(page.data.user as { name: string; image?: string | null } | undefined);

	const threads = $derived.by(() => {
		const tops = comments.filter((c) => !c.parentId).sort((a, b) => +b.createdAt - +a.createdAt);
		const replies = (id: string) =>
			comments.filter((c) => c.parentId === id).sort((a, b) => +a.createdAt - +b.createdAt);
		return tops.map((c) => ({ comment: c, replies: replies(c.id) }));
	});

	/** The comment whose inline reply box is open. */
	let replyingTo = $state<{ id: string; name: string } | null>(null);
	let sending = $state(false);

	function submitWith(after?: () => void): SubmitFunction {
		return () => {
			sending = true;
			return async ({ result, update, formElement }) => {
				await update({ reset: false });
				if (result.type === 'success') {
					formElement.reset();
					after?.();
				}
				sending = false;
			};
		};
	}
</script>

{#snippet avatar(a: { name: string; image?: string | null }, size = 'size-9')}
	<span
		class="flex {size} shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-case bg-surface-alt text-sm font-semibold text-ink"
	>
		{#if a.image}
			<img src={a.image} alt="" class="size-full object-cover" />
		{:else}
			{a.name.charAt(0)}
		{/if}
	</span>
{/snippet}

{#snippet bubble(c: Comment)}
	<div
		class="bubble min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-border-case/70 bg-surface-alt/50 px-4 py-3"
	>
		<p class="flex items-baseline gap-2 text-sm">
			<span class="font-medium text-ink">{c.author.name}</span>
			<time class="text-xs text-ink-muted" datetime={c.createdAt.toISOString()}>
				{timeAgo(c.createdAt)}
			</time>
		</p>
		<p class="mt-1 text-sm leading-relaxed whitespace-pre-line text-ink/85">{c.body}</p>
		{#if user}
			<button
				type="button"
				class="mt-2 inline-flex items-center gap-1 text-xs text-ink-muted transition hover:text-accent"
				onclick={() =>
					(replyingTo = replyingTo?.id === c.id ? null : { id: c.id, name: c.author.name })}
				aria-expanded={replyingTo?.id === c.id}
			>
				<Reply class="size-3.5" />
				回覆
			</button>
		{/if}
	</div>
{/snippet}

{#snippet replyForm(target: { id: string; name: string })}
	<form
		method="post"
		action="?/comment"
		use:enhance={submitWith(() => (replyingTo = null))}
		class="mt-3 rounded-2xl border border-border-case bg-surface-alt/60 p-3 focus-within:border-accent/60"
	>
		<input type="hidden" name="replyTo" value={target.id} />
		<!-- svelte-ignore a11y_autofocus -->
		<textarea
			name="body"
			required
			maxlength="2000"
			rows="2"
			autofocus
			placeholder="回覆 {target.name}…"
			class="w-full resize-y border-0 bg-transparent p-1 text-sm text-ink placeholder:text-ink-muted/70 focus:ring-0 focus:outline-none"
		></textarea>
		<div class="mt-1 flex justify-end gap-2">
			<button
				type="button"
				class="rounded-full px-3 py-1 text-sm text-ink-muted hover:text-ink"
				onclick={() => (replyingTo = null)}
			>
				取消
			</button>
			<button
				type="submit"
				disabled={sending}
				class="flex items-center gap-1.5 rounded-full bg-accent px-4 py-1 text-sm font-medium text-white transition hover:bg-accent-strong disabled:opacity-60"
			>
				<Send class="size-3.5" />
				{sending ? '送出中…' : '回覆'}
			</button>
		</div>
	</form>
{/snippet}

<section id="comments" class="mt-16">
	<h2 class="flex items-center gap-2 section-title">
		<MessagesSquare class="size-5 text-accent" />
		{title}
		<span class="font-mono-hack text-sm font-normal text-ink-muted">{comments.length}</span>
	</h2>

	{#if user}
		<form
			method="post"
			action="?/comment"
			use:enhance={submitWith()}
			class="mt-5 rounded-2xl border border-border-case bg-surface-alt/60 p-3 focus-within:border-accent/60"
		>
			<div class="flex items-start gap-3">
				{@render avatar(user)}
				<textarea
					name="body"
					required
					maxlength="2000"
					rows="3"
					{placeholder}
					class="w-full resize-y border-0 bg-transparent p-1 text-sm text-ink placeholder:text-ink-muted/70 focus:ring-0 focus:outline-none"
				></textarea>
			</div>
			<div class="mt-2 flex items-center justify-between gap-3 pl-12">
				<p class="text-xs text-ink-muted">以 {user.name} 的身分留言</p>
				<button
					type="submit"
					disabled={sending}
					class="flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-white transition hover:bg-accent-strong disabled:opacity-60"
				>
					<Send class="size-3.5" />
					{sending ? '送出中…' : '送出'}
				</button>
			</div>
		</form>
	{:else}
		<div
			class="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-border-case p-4"
		>
			<p class="text-sm text-ink-muted">登入後就能留言和回覆，頭像跟暱稱會自動帶入。</p>
			<a
				href={resolve('/login')}
				class="rounded-full border border-border-case bg-surface px-4 py-1.5 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
			>
				登入留言
			</a>
		</div>
	{/if}

	{#if message}
		<p class="mt-2 text-sm text-accent">{message}</p>
	{/if}

	{#if comments.length === 0}
		<p class="mt-8 text-center text-sm text-ink-muted">還沒有留言，成為第一個吧 ✦</p>
	{:else}
		<ul class="mt-6 space-y-5">
			{#each threads as { comment, replies }, i (comment.id)}
				<li use:reveal={{ delay: Math.min(i, 6) * 50, y: 8 }}>
					<div id="comment-{comment.id}" class="comment-anchor flex gap-3">
						{@render avatar(comment.author)}
						<div class="min-w-0 flex-1">
							{@render bubble(comment)}
							{#if replyingTo?.id === comment.id}
								{@render replyForm(replyingTo)}
							{/if}
						</div>
					</div>

					{#if replies.length}
						<ul class="mt-3 ml-6 space-y-3 border-l-2 border-dashed border-border-case pl-5">
							{#each replies as r (r.id)}
								<li id="comment-{r.id}" class="comment-anchor flex gap-3">
									{@render avatar(r.author, 'size-7')}
									<div class="min-w-0 flex-1">
										{@render bubble(r)}
										{#if replyingTo?.id === r.id}
											{@render replyForm(replyingTo)}
										{/if}
									</div>
								</li>
							{/each}
						</ul>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	/* Landing on a comment from a notification: room for the fixed tools, and a brief red ring. */
	.comment-anchor {
		scroll-margin-top: 6rem;
	}
	.comment-anchor:target > div > :global(.bubble),
	.comment-anchor:target > :global(.bubble) {
		animation: found 1.8s ease-out;
	}
	@keyframes found {
		from {
			box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 70%, transparent);
		}
		to {
			box-shadow: 0 0 0 3px transparent;
		}
	}
</style>
