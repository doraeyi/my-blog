<script lang="ts">
	import Sun from '@lucide/svelte/icons/sun';
	import MoonStar from '@lucide/svelte/icons/moon-star';
	import { theme } from '$lib/theme.svelte';
</script>

<button
	type="button"
	aria-label={theme.current === 'dark' ? '切換為亮色模式' : '切換為暗色模式'}
	onclick={() => theme.toggle()}
	class="flex size-10 items-center justify-center rounded-full border border-border-case bg-surface/80 text-ink shadow-sm backdrop-blur-md transition hover:bg-surface-alt"
>
	{#if theme.current === 'dark'}
		<Sun class="size-4" />
	{:else}
		<MoonStar class="size-4" />
	{/if}
</button>
