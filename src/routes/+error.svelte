<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import Lock from '@lucide/svelte/icons/lock';
	import LogIn from '@lucide/svelte/icons/log-in';
</script>

<Seo title={`${page.status} 錯誤`} noindex />

<div class="mx-auto max-w-4xl px-6 pt-28 pb-16">
	<div class="index-card flex flex-col items-center gap-3 rounded-sm p-10 text-center">
		<span
			class="flex size-12 items-center justify-center rounded-full border-2 border-stamp-500 text-stamp-500"
		>
			<Lock class="size-5" />
		</span>
		<p class="font-display text-lg text-case-900">{page.error?.message}</p>
		{#if page.status === 401}
			<a
				href={resolve('/login')}
				class="mt-1 inline-flex items-center gap-1.5 rounded-full bg-stamp-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-stamp-600"
			>
				<LogIn class="size-4" />
				前往登入
			</a>
		{/if}
	</div>
</div>
