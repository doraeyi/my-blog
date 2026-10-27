<script lang="ts">
	import { resolve } from '$app/paths';
	import Seo from '$lib/components/Seo.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Seo title="訂閱確認" noindex />

<div class="mx-auto max-w-2xl px-6 pb-20">
	{#if data.email}
		<PageHeader
			title="訂閱成功"
			stamp="已登記"
			description="之後有新文章會寄到 {data.email}。謝謝你願意收這些信。"
		/>
		<a href={resolve('/blog')} class="text-sm text-accent hover:underline">先去翻翻文章 →</a>
	{:else}
		<PageHeader
			title="連結失效了"
			stamp="作廢"
			description="這個確認連結找不到對應的訂閱，可能已經取消過了。可以重新訂閱一次。"
		/>
		<a href={resolve('/subscribe')} class="text-sm text-accent hover:underline">重新訂閱 →</a>
	{/if}
</div>
