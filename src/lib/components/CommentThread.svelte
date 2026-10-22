<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { reveal } from '$lib/actions/reveal';
	import { timeAgo } from '$lib/format';
	import Send from '@lucide/svelte/icons/send';
	import MessagesSquare from '@lucide/svelte/icons/messages-square';

	let {
		comments,
		message,
		title = '證詞',
		placeholder = '留下你的想法…'
	}: {
		comments: {
			id: string;
			body: string;
			createdAt: Date;
			author: { name: string; image: string | null };
		}[];
		/** Error text from the action's `fail()`, if any. */
		message?: string;
		title?: string;
		placeholder?: string;
	} = $props();

	let formEl: HTMLFormElement | undefined = $state();
	let sending = $state(false);
	const user = $derived(page.data.user as { name: string; image?: string | null } | undefined);
</script>

<section id="comments" class="mt-16">
	<h2 class="flex items-center gap-2 section-title">
		<MessagesSquare class="size-5 text-accent" />
		{title}
		<span class="font-mono-hack text-sm font-normal text-ink-muted">{comments.length}</span>
	</h2>

	{#if user}
		<form
			bind:this={formEl}
			method="post"
			action="?/comment"
			use:enhance={() => {
				sending = true;
				return async ({ result, update }) => {
					await update({ reset: false });
					if (result.type === 'success') formEl?.reset();
					sending = false;
				};
			}}
			class="mt-5 rounded-2xl border border-border-case bg-surface-alt/60 p-3 focus-within:border-accent/60"
		>
			<div class="flex items-start gap-3">
				<span
					class="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-case bg-surface text-sm font-semibold text-ink"
				>
					{#if user.image}
						<img src={user.image} alt="" class="size-full object-cover" />
					{:else}
						{user.name.charAt(0)}
					{/if}
				</span>
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
			<p class="text-sm text-ink-muted">登入後就能留言，頭像跟暱稱會自動帶入。</p>
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
		<ul class="mt-6 space-y-4">
			{#each comments as comment, i (comment.id)}
				<li use:reveal={{ delay: Math.min(i, 6) * 50, y: 8 }} class="flex gap-3">
					<span
						class="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-case bg-surface-alt text-sm font-semibold text-ink"
					>
						{#if comment.author.image}
							<img src={comment.author.image} alt="" class="size-full object-cover" />
						{:else}
							{comment.author.name.charAt(0)}
						{/if}
					</span>
					<div
						class="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-border-case/70 bg-surface-alt/50 px-4 py-3"
					>
						<p class="flex items-baseline gap-2 text-sm">
							<span class="font-medium text-ink">{comment.author.name}</span>
							<time class="text-xs text-ink-muted" datetime={comment.createdAt.toISOString()}>
								{timeAgo(comment.createdAt)}
							</time>
						</p>
						<p class="mt-1 text-sm leading-relaxed whitespace-pre-line text-ink/85">
							{comment.body}
						</p>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>
