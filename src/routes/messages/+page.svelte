<script lang="ts">
	import { resolve } from '$app/paths';
	import Seo from '$lib/components/Seo.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import CommentThread from '$lib/components/CommentThread.svelte';
	import PinString from '$lib/components/PinString.svelte';
	import { pinned } from '$lib/actions/pinned';
	import { reveal } from '$lib/actions/reveal';
	import { contactEmail } from '$lib/social-links';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const rules = [
		['用真實一點的暱稱', '不限本名，只是別叫「123」或「test」，不然我分不出誰是誰。'],
		['登入會自動帶頭像', '用 GitHub 或帳號登入後，頭像跟暱稱會自動填好。'],
		['我會看每一則', '廣告、spam 或惡意留言會被我隱藏，其他都會留著。'],
		['想說什麼都可以', '閒聊、技術問題、合作邀請，或單純路過留個記號，都歡迎。']
	];
</script>

<Seo title="證詞" description="這裡是留言板，想說什麼都可以。" />

<div class="mx-auto max-w-3xl px-6 pb-16">
	<PageHeader
		title="證詞"
		stamp="受理中"
		description="這裡是留言板。不一定要跟文章有關，路過留個記號也很好。"
	/>

	<section>
		<h2 class="section-title">幾個小規則</h2>
		<PinString class="rules">
			{#each rules as [title, body], i (title)}
				<div
					class="index-card rounded-sm px-5 pt-5 pb-5"
					use:pinned={{ delay: (i % 2) * 100, tilt: [-0.7, 0.9, 0.5, -0.6][i] }}
				>
					<p class="border-b-2 border-stamp-400/60 pb-1 font-display text-lg text-case-900">
						{title}
					</p>
					<p class="mt-2 text-sm leading-7 text-case-700">{body}</p>
				</div>
			{/each}
		</PinString>
	</section>

	<section class="mt-10" use:reveal={{ delay: 120 }}>
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

	<CommentThread comments={data.comments} message={form?.message} placeholder="想說點什麼？" />
</div>

<style>
	:global(.rules) {
		display: grid;
		gap: 2.2rem 1.5rem;
		margin-top: 2rem;
	}
	@media (min-width: 640px) {
		:global(.rules) {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>
