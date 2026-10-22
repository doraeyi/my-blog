<script lang="ts">
	import { tilt } from '$lib/actions/tilt';
	import { page } from '$app/state';
	import Seo from '$lib/components/Seo.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import CommentThread from '$lib/components/CommentThread.svelte';
	import { reveal } from '$lib/actions/reveal';
	import { friends } from '$lib/friends';
	import { contactEmail } from '$lib/social-links';
	import { SITE_NAME, SITE_DESCRIPTION } from '$lib/site';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import Copy from '@lucide/svelte/icons/copy';
	import Check from '@lucide/svelte/icons/check';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const card = $derived([
		['站點名稱', SITE_NAME],
		['站點地址', page.url.origin],
		['站點描述', SITE_DESCRIPTION]
	]);

	let copied = $state(false);
	async function copyCard() {
		await navigator.clipboard.writeText(card.map(([k, v]) => `${k}：${v}`).join('\n'));
		copied = true;
		setTimeout(() => (copied = false), 1600);
	}

	const requirements = [
		'站點能正常瀏覽，沒有過期或掛掉。',
		'有原創內容（轉貼站、純廣告、SEO 農場就不交換了）。',
		'HTTPS、有自己的網域（免費子網域也可以）。',
		'如果你願意先在你站上掛我的連結，我會更快回覆。'
	];
</script>

<Seo title="線人名單" description="友鏈：在網海裡看見彼此，幫你掛個牌子。" />

<div class="mx-auto max-w-3xl px-6 pb-16">
	<PageHeader
		title="線人名單"
		stamp="機密"
		description="友鏈對我來說，是「我在這片網海裡看見了你，幫你掛個牌子」。"
	/>

	<section use:reveal={{ delay: 80 }}>
		<h2 class="section-title">目前的朋友</h2>
		{#if friends.length === 0}
			<p
				class="mt-4 rounded-2xl border border-dashed border-border-case py-10 text-center text-sm text-ink-muted"
			>
				── 還沒有人，這裡空著。歡迎成為第一個。 ──
			</p>
		{:else}
			<ul class="mt-4 grid gap-3 sm:grid-cols-2">
				{#each friends as friend (friend.url)}
					<li>
						<!-- eslint-disable svelte/no-navigation-without-resolve -- external friend site -->
						<a
							href={friend.url}
							target="_blank"
							rel="noopener"
							use:tilt
							class="case-card group flex items-center gap-3 rounded-2xl border border-border-case bg-surface-alt/60 p-4"
						>
							<span
								class="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-case bg-surface font-semibold text-ink"
							>
								{#if friend.avatar}
									<img src={friend.avatar} alt="" class="size-full object-cover" />
								{:else}
									{friend.name.charAt(0)}
								{/if}
							</span>
							<span class="min-w-0 flex-1">
								<span class="block truncate font-medium text-ink group-hover:text-accent">
									{friend.name}
								</span>
								<span class="mt-0.5 line-clamp-2 block text-xs text-ink-muted">
									{friend.description}
								</span>
							</span>
							<ArrowUpRight class="size-4 shrink-0 text-ink-muted" />
						</a>
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="mt-12" use:reveal={{ delay: 120 }}>
		<h2 class="section-title">想交換友鏈？</h2>
		<ul class="mt-4 space-y-2 text-sm text-ink-muted">
			{#each requirements as r (r)}
				<li class="flex gap-2"><span class="text-accent">✦</span>{r}</li>
			{/each}
		</ul>

		<div class="mt-6 rounded-2xl border border-border-case bg-surface-alt/60 p-5">
			<div class="flex items-center justify-between">
				<p class="text-sm font-medium text-ink">本站的訊息卡</p>
				<button
					type="button"
					onclick={copyCard}
					class="flex items-center gap-1.5 rounded-full border border-border-case px-3 py-1 text-xs text-ink-muted transition hover:border-accent hover:text-accent"
				>
					{#if copied}
						<Check class="size-3.5" /> 已複製
					{:else}
						<Copy class="size-3.5" /> 複製
					{/if}
				</button>
			</div>
			<dl class="mt-4 space-y-2 font-mono-hack text-sm">
				{#each card as [k, v] (k)}
					<div class="flex gap-3">
						<dt class="shrink-0 text-ink-muted">{k}</dt>
						<dd class="min-w-0 break-all text-ink">{v}</dd>
					</div>
				{/each}
			</dl>
		</div>

		<p class="mt-4 text-sm text-ink-muted">
			直接在下面留言，或寄信到
			<a href="mailto:{contactEmail}" class="text-accent underline-offset-4 hover:underline">
				{contactEmail}
			</a>
			，附上你的站點資訊就好。
		</p>
	</section>

	<CommentThread
		comments={data.comments}
		message={form?.message}
		title="來交個朋友"
		placeholder="站名、網址、一句話介紹…"
	/>
</div>
