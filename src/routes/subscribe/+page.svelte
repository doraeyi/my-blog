<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import SubscribeBox from '$lib/components/SubscribeBox.svelte';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Seo title="訂閱" description="有新文章時寄信通知你。一個月頂多幾封，隨時一鍵取消。" />

<div class="mx-auto max-w-2xl px-6 pb-20">
	<PageHeader
		title="訂閱新檔案"
		stamp="寄送"
		description="有新文章時寄一封信給你：標題、摘要和連結，沒有廣告也不會轉給別人。"
	/>
	{#if data.enabled}
		<SubscribeBox />
	{:else}
		<p class="rounded-md border border-dashed border-border-case p-6 text-sm text-ink-muted">
			電子報還在準備中。在那之前可以先用
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- static feed -->
			<a href="/rss.xml" class="text-accent hover:underline">RSS</a> 訂閱。
		</p>
	{/if}
	<ul class="mt-8 space-y-2 text-sm text-ink-muted">
		<li class="flex gap-2">
			<span class="text-accent">✦</span>送出後會先寄一封確認信，按下連結才算訂閱。
		</li>
		<li class="flex gap-2">
			<span class="text-accent">✦</span>每封信底下都有取消訂閱連結，按一下就好。
		</li>
		<li class="flex gap-2">
			<span class="text-accent">✦</span>比較喜歡用閱讀器？也有
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- static feed -->
			<a href="/rss.xml" class="text-accent hover:underline">RSS</a>，或看看
			<a href={resolve('/friends/circle')} class="text-accent hover:underline">朋友圈</a>。
		</li>
	</ul>
</div>
