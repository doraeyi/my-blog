<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import { enhance } from '$app/forms';
	import LogIn from '@lucide/svelte/icons/log-in';
	import Mail from '@lucide/svelte/icons/mail';
	import Lock from '@lucide/svelte/icons/lock';
	import User from '@lucide/svelte/icons/user';
	import BrandIcon from '$lib/components/icons/BrandIcon.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<Seo title="登入" noindex />

<div class="mx-auto max-w-md px-6 pt-28 pb-16">
	<div class="rounded-2xl border border-border-case bg-surface-alt p-8 shadow-sm">
		<div class="flex flex-col items-center gap-2 text-center">
			<span class="flex size-12 items-center justify-center rounded-full bg-surface">
				<LogIn class="size-5 text-ink-muted" />
			</span>
			<h1 class="text-xl font-bold text-ink">登入</h1>
			<p class="text-sm text-ink-muted">歡迎回來</p>
		</div>

		<form method="post" action="?/signInEmail" use:enhance class="mt-6 flex flex-col gap-4">
			<label class="block">
				<span class="mb-1 flex items-center gap-1.5 text-sm font-medium text-ink-muted">
					<Mail class="size-3.5" /> Email
				</span>
				<input
					type="email"
					name="email"
					class="w-full rounded-lg border border-border-case bg-surface px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:ring-2 focus:ring-accent focus:outline-none"
				/>
			</label>
			<label class="block">
				<span class="mb-1 flex items-center gap-1.5 text-sm font-medium text-ink-muted">
					<Lock class="size-3.5" /> Password
				</span>
				<input
					type="password"
					name="password"
					class="w-full rounded-lg border border-border-case bg-surface px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:ring-2 focus:ring-accent focus:outline-none"
				/>
			</label>
			<label class="block">
				<span class="mb-1 flex items-center gap-1.5 text-sm font-medium text-ink-muted">
					<User class="size-3.5" /> Name（註冊時使用）
				</span>
				<input
					name="name"
					class="w-full rounded-lg border border-border-case bg-surface px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:ring-2 focus:ring-accent focus:outline-none"
				/>
			</label>

			<div class="mt-1 flex gap-2">
				<button
					class="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-strong"
				>
					登入
				</button>
				<button
					formaction="?/signUpEmail"
					class="flex-1 rounded-lg border border-border-case px-4 py-2 text-sm font-medium text-ink-muted transition hover:bg-surface hover:text-ink"
				>
					註冊
				</button>
			</div>
		</form>

		{#if form?.message}
			<p class="mt-3 text-center text-sm text-stamp-500 dark:text-stamp-300">{form.message}</p>
		{/if}

		<div class="mt-6 flex items-center gap-3">
			<div class="h-px flex-1 bg-border-case"></div>
			<span class="text-xs text-ink-muted">或</span>
			<div class="h-px flex-1 bg-border-case"></div>
		</div>

		<form method="post" action="?/signInSocial" use:enhance class="mt-4">
			<input type="hidden" name="provider" value="github" />
			<input type="hidden" name="callbackURL" value="/" />
			<button
				class="flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-surface transition hover:opacity-90"
			>
				<BrandIcon name="github" class="size-4" />
				用 GitHub 登入
			</button>
		</form>
	</div>
</div>
