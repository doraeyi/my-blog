<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import Lock from '@lucide/svelte/icons/lock';
	import LogIn from '@lucide/svelte/icons/log-in';
</script>

<div class="mx-auto max-w-4xl px-6 pt-28 pb-16">
	<div
		class="flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-10 text-center"
	>
		<span class="flex size-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
			<Lock class="size-5" />
		</span>
		<p class="text-gray-600">{page.error?.message}</p>
		{#if page.status === 401}
			<a
				href={resolve('/login')}
				class="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
			>
				<LogIn class="size-4" />
				前往登入
			</a>
		{/if}
	</div>
</div>
