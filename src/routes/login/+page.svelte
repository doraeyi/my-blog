<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import LogIn from '@lucide/svelte/icons/log-in';
	import Mail from '@lucide/svelte/icons/mail';
	import Lock from '@lucide/svelte/icons/lock';
	import User from '@lucide/svelte/icons/user';
	import BrandIcon from '$lib/components/icons/BrandIcon.svelte';
	import { safeNext } from '$lib/login-next';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	// Back to where you were (the post you wanted to comment on) once you're in.
	const next = $derived(safeNext(page.url.searchParams.get('next')));
	const fromComment = $derived(next.endsWith('#comments'));

	// Signing in and signing up are two tabs of one form: the name only matters for a new account.
	let picked = $state<'in' | 'up' | null>(null);
	const mode = $derived(picked ?? (form && 'mode' in form ? form.mode : 'in'));
	let sending = $state(false);
</script>

<Seo title="登入" noindex />

<div class="mx-auto max-w-md px-6 pt-28 pb-16">
	<div class="rounded-2xl border border-border-case bg-surface-alt p-8 shadow-sm">
		<div class="flex flex-col items-center gap-2 text-center">
			<span class="flex size-12 items-center justify-center rounded-full bg-surface">
				<LogIn class="size-5 text-ink-muted" />
			</span>
			<h1 class="font-display text-2xl text-ink">{mode === 'in' ? '登入' : '建立帳號'}</h1>
			<p class="text-sm text-ink-muted">
				{fromComment ? '登入後會帶你回到剛剛那篇的留言區。' : '登入後就能留言、回覆和蓋章推薦。'}
			</p>
		</div>

		<!-- The quickest way in, so it comes first. -->
		<form method="post" action="?/signInSocial" use:enhance class="mt-6">
			<input type="hidden" name="provider" value="github" />
			<input type="hidden" name="callbackURL" value={next} />
			<button
				class="flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-surface transition hover:opacity-90"
			>
				<BrandIcon name="github" class="size-4" />
				用 GitHub 登入
			</button>
		</form>

		<div class="mt-6 flex items-center gap-3">
			<div class="h-px flex-1 bg-border-case"></div>
			<span class="text-xs text-ink-muted">或用 Email</span>
			<div class="h-px flex-1 bg-border-case"></div>
		</div>

		<div class="mt-4 grid grid-cols-2 rounded-lg border border-border-case p-1" role="tablist">
			{#each [['in', '登入'], ['up', '註冊']] as const as [key, label] (key)}
				<button
					type="button"
					role="tab"
					aria-selected={mode === key}
					onclick={() => (picked = key)}
					class="rounded-md py-1.5 text-sm transition {mode === key
						? 'bg-surface font-medium text-ink shadow-sm'
						: 'text-ink-muted hover:text-ink'}"
				>
					{label}
				</button>
			{/each}
		</div>

		<form
			method="post"
			action={mode === 'in' ? '?/signInEmail' : '?/signUpEmail'}
			use:enhance={() => {
				sending = true;
				return async ({ update }) => {
					await update({ reset: false });
					sending = false;
				};
			}}
			class="mt-4 flex flex-col gap-4"
		>
			<input type="hidden" name="next" value={next} />
			{#if mode === 'up'}
				<label class="block">
					<span class="mb-1 flex items-center gap-1.5 text-sm font-medium text-ink-muted">
						<User class="size-3.5" /> 暱稱
					</span>
					<input
						name="name"
						required
						autocomplete="nickname"
						placeholder="留言時會顯示這個名字"
						class="w-full rounded-lg border border-border-case bg-surface px-3 py-2 text-sm text-ink shadow-sm placeholder:text-ink-muted/60 focus:border-accent focus:ring-2 focus:ring-accent focus:outline-none"
					/>
				</label>
			{/if}
			<label class="block">
				<span class="mb-1 flex items-center gap-1.5 text-sm font-medium text-ink-muted">
					<Mail class="size-3.5" /> Email
				</span>
				<input
					type="email"
					name="email"
					required
					autocomplete="email"
					value={form && 'email' in form ? (form.email ?? '') : ''}
					class="w-full rounded-lg border border-border-case bg-surface px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:ring-2 focus:ring-accent focus:outline-none"
				/>
			</label>
			<label class="block">
				<span class="mb-1 flex items-center gap-1.5 text-sm font-medium text-ink-muted">
					<Lock class="size-3.5" /> 密碼
				</span>
				<input
					type="password"
					name="password"
					required
					minlength={mode === 'up' ? 8 : undefined}
					autocomplete={mode === 'in' ? 'current-password' : 'new-password'}
					placeholder={mode === 'up' ? '至少 8 個字元' : ''}
					class="w-full rounded-lg border border-border-case bg-surface px-3 py-2 text-sm text-ink shadow-sm placeholder:text-ink-muted/60 focus:border-accent focus:ring-2 focus:ring-accent focus:outline-none"
				/>
			</label>

			{#if form?.message && (!('mode' in form) || form.mode === mode)}
				<p class="text-sm text-stamp-500" role="alert">{form.message}</p>
			{/if}

			<button
				disabled={sending}
				class="mt-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-strong disabled:opacity-60"
			>
				{sending ? '處理中…' : mode === 'in' ? '登入' : '建立帳號'}
			</button>
		</form>
	</div>
</div>
