<script lang="ts">
	import { resolve } from '$app/paths';
	import Seo from '$lib/components/Seo.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import CommentThread from '$lib/components/CommentThread.svelte';
	import { reveal } from '$lib/actions/reveal';
	import { contactEmail } from '$lib/social-links';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const rules = [
		['暱稱用真實一點的', '不限本名，只是別叫「123」或「test」，不然我分不出誰是誰。'],
		['登入會自動帶頭像', '用 GitHub 或帳號登入後，頭像跟暱稱會自動填好。'],
		['廣告和惡意留言會被隱藏', '其他都會留著，我會看每一則。'],
		['閒聊、問問題、路過都歡迎', '技術問題、合作邀請，或單純路過留個記號都可以。']
	];
</script>

<Seo title="證詞" description="這裡是留言板，想說什麼都可以。" />

<div class="mx-auto max-w-3xl px-6 pb-16">
	<PageHeader
		title="證詞"
		stamp="受理中"
		description="這裡是留言板。不一定要跟文章有關，路過留個記號也很好。"
	/>

	<!-- The board is what the page is for: the few house rules ride along in
	     one short note above it instead of a wall of cards to scroll past. -->
	<ul class="rules-note" aria-label="留言前看一下">
		{#each rules as [title, body] (title)}
			<li title={body}>{title}</li>
		{/each}
	</ul>

	<CommentThread comments={data.comments} message={form?.message} placeholder="想說點什麼？" />

	<section class="mt-12" use:reveal={{ delay: 120 }}>
		<h2 class="section-title">想私下聊？</h2>
		<p class="mt-3 text-sm leading-relaxed text-ink-muted">
			不適合公開的事，直接寄信到
			<a href="mailto:{contactEmail}" class="text-accent underline-offset-4 hover:underline">
				{contactEmail}
			</a>
			。想交換友鏈的話，可以去
			<a href={resolve('/friends')} class="text-accent underline-offset-4 hover:underline"
				>線人名單</a
			>
			看看。
		</p>
	</section>
</div>

<style>
	.rules-note {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem 1.1rem;
		margin-top: 1.2rem;
		padding: 0.7rem 0.95rem;
		border-left: 3px solid var(--color-stamp-400, #c0392b);
		background: rgb(60 40 20 / 0.04);
		color: var(--color-case-700, #5a4632);
		font-size: 0.85rem;
	}
	.rules-note li::before {
		content: '✓ ';
		color: var(--color-accent, #8e1d12);
	}
</style>
