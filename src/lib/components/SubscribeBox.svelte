<!--
	"Get new files by mail": an email field that posts to /subscribe from
	anywhere on the site. Double opt-in, so the success state asks the reader to
	go check their inbox.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import MailCheck from '@lucide/svelte/icons/mail-check';

	let { compact = false }: { compact?: boolean } = $props();

	let phase = $state<'idle' | 'sending' | 'done'>('idle');
	let error = $state('');
</script>

{#if page.data.mailEnabled}
	<div
		class="rounded-md border border-border-case bg-surface/70 backdrop-blur-sm {compact
			? 'p-4'
			: 'p-6'}"
	>
		{#if phase === 'done'}
			<p class="flex items-center gap-2 font-display text-lg text-ink">
				<MailCheck class="size-5 text-accent" /> 確認信寄出了
			</p>
			<p class="mt-1 text-sm text-ink-muted">
				去信箱按一下確認連結就完成了（沒看到的話翻一下垃圾郵件）。
			</p>
		{:else}
			<p class="font-mono-hack text-xs tracking-[0.25em] text-ink-muted uppercase">
				Dispatch // 新檔案寄給你
			</p>
			{#if !compact}
				<p class="mt-2 text-sm text-ink-muted">
					有新文章時寄一封信通知你，一個月頂多幾封，隨時一鍵取消。
				</p>
			{/if}
			<form
				method="post"
				action={resolve('/subscribe')}
				class="relative mt-3 flex gap-2"
				use:enhance={() => {
					phase = 'sending';
					error = '';
					return async ({ result }) => {
						if (result.type === 'success') phase = 'done';
						else {
							phase = 'idle';
							error =
								result.type === 'failure'
									? String(result.data?.error ?? '訂閱失敗')
									: '訂閱失敗，稍後再試';
						}
					};
				}}
			>
				<label class="sr-only" for="subscribe-email-{compact ? 'c' : 'f'}">Email</label>
				<input
					id="subscribe-email-{compact ? 'c' : 'f'}"
					name="email"
					type="email"
					required
					autocomplete="email"
					placeholder="you@example.com"
					class="min-w-0 flex-1 rounded-full border border-border-case bg-surface px-4 py-2 text-sm text-ink placeholder:text-ink-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/40 focus:outline-none"
				/>
				<input
					name="nickname"
					tabindex="-1"
					autocomplete="off"
					aria-hidden="true"
					class="absolute -left-[9999px] h-0 w-0 opacity-0"
				/>
				<button
					type="submit"
					disabled={phase === 'sending'}
					class="shrink-0 rounded-full bg-accent px-5 py-2 text-sm font-medium text-white transition hover:bg-accent-strong disabled:opacity-60"
				>
					{phase === 'sending' ? '寄送中…' : '訂閱'}
				</button>
			</form>
			{#if error}<p class="mt-2 text-sm text-stamp-500" role="alert">{error}</p>{/if}
		{/if}
	</div>
{/if}
