<script lang="ts">
	import { enhance } from '$app/forms';
	import LogIn from '@lucide/svelte/icons/log-in';
	import Mail from '@lucide/svelte/icons/mail';
	import Lock from '@lucide/svelte/icons/lock';
	import User from '@lucide/svelte/icons/user';
	import BrandIcon from '$lib/components/icons/BrandIcon.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="mx-auto max-w-md px-6 pt-28 pb-16">
	<div class="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
		<div class="flex flex-col items-center gap-2 text-center">
			<span class="flex size-12 items-center justify-center rounded-full bg-gray-100">
				<LogIn class="size-5 text-gray-700" />
			</span>
			<h1 class="text-xl font-bold text-gray-900">登入</h1>
			<p class="text-sm text-gray-500">歡迎回來</p>
		</div>

		<form method="post" action="?/signInEmail" use:enhance class="mt-6 flex flex-col gap-4">
			<label class="block">
				<span class="mb-1 flex items-center gap-1.5 text-sm font-medium text-gray-700">
					<Mail class="size-3.5" /> Email
				</span>
				<input
					type="email"
					name="email"
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				/>
			</label>
			<label class="block">
				<span class="mb-1 flex items-center gap-1.5 text-sm font-medium text-gray-700">
					<Lock class="size-3.5" /> Password
				</span>
				<input
					type="password"
					name="password"
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				/>
			</label>
			<label class="block">
				<span class="mb-1 flex items-center gap-1.5 text-sm font-medium text-gray-700">
					<User class="size-3.5" /> Name（註冊時使用）
				</span>
				<input
					name="name"
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				/>
			</label>

			<div class="mt-1 flex gap-2">
				<button
					class="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
				>
					登入
				</button>
				<button
					formaction="?/signUpEmail"
					class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
				>
					註冊
				</button>
			</div>
		</form>

		{#if form?.message}
			<p class="mt-3 text-center text-sm text-red-600">{form.message}</p>
		{/if}

		<div class="mt-6 flex items-center gap-3">
			<div class="h-px flex-1 bg-gray-200"></div>
			<span class="text-xs text-gray-400">或</span>
			<div class="h-px flex-1 bg-gray-200"></div>
		</div>

		<form method="post" action="?/signInSocial" use:enhance class="mt-4">
			<input type="hidden" name="provider" value="github" />
			<input type="hidden" name="callbackURL" value="/" />
			<button
				class="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
			>
				<BrandIcon name="github" class="size-4" />
				用 GitHub 登入
			</button>
		</form>
	</div>
</div>
