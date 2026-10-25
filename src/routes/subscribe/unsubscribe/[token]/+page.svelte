<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Seo from '$lib/components/Seo.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const done = $derived(form?.done || data.status === 'unsubscribed');
</script>

<Seo title="取消訂閱" noindex />

<div class="mx-auto max-w-2xl px-6 pb-20">
	{#if !data.email}
		<PageHeader title="找不到訂閱" stamp="作廢" description="這個連結沒有對應的訂閱。" />
	{:else if done}
		<PageHeader
			title="已取消訂閱"
			stamp="結案"
			description="{data.email} 不會再收到新文章的信了。想回來的話，隨時可以重新訂閱。"
		/>
		<a href={resolve('/subscribe')} class="text-sm text-accent hover:underline">重新訂閱 →</a>
	{:else}
		<PageHeader
			title="取消訂閱？"
			stamp="確認"
			description="按下去之後，{data.email} 就不會再收到新文章的信。"
		/>
		<form method="post" use:enhance>
			<button
				class="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-strong"
			>
				確定取消訂閱
			</button>
		</form>
	{/if}
</div>
