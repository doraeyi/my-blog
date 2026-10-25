<script lang="ts">
	import { resolve } from '$app/paths';
	import Seo from '$lib/components/Seo.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const a = $derived(data.application);

	const verdict = $derived(
		{
			pending: { stamp: '審核中', text: '已經收到，還在排隊。下面是系統先幫你做的檢查。' },
			approved: { stamp: '已通過', text: '歡迎加入！你已經出現在線人名單上了。' },
			hidden: { stamp: '暫停', text: '你的連結暫時收起來了，可能是網站連不上一陣子。' },
			rejected: { stamp: '未通過', text: '這次沒有通過，謝謝你的申請。' }
		}[a.status]
	);

	const checks = $derived([
		{
			label: '網站連得上',
			ok: a.httpStatus == null ? null : a.httpStatus > 0 && a.httpStatus < 400,
			hint: a.httpStatus ? `HTTP ${a.httpStatus}` : '連不上'
		},
		{
			label: '站上有本站連結',
			ok: a.backlinkOk,
			hint: '在你的友鏈頁加上 blog.doraeyi.com，下一輪巡邏會自動更新'
		},
		...(a.feedOk || a.feedError
			? [{ label: '讀得到 RSS', ok: a.feedOk, hint: a.feedError ?? '' }]
			: [])
	]);
</script>

<Seo title="友鏈申請進度" noindex />

<div class="mx-auto max-w-2xl px-6 pb-16">
	<PageHeader title="申請進度" stamp={verdict.stamp} description={verdict.text} />

	<div class="rounded-2xl border border-border-case bg-surface-alt/70 p-5">
		<div class="flex items-center gap-3">
			<span
				class="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-case bg-surface font-display text-lg text-ink"
			>
				{#if a.avatar}
					<img src={a.avatar} alt="" referrerpolicy="no-referrer" class="size-full object-cover" />
				{:else}{a.name.charAt(0)}{/if}
			</span>
			<div class="min-w-0">
				<p class="truncate font-medium text-ink">{a.name}</p>
				<p class="truncate font-mono-hack text-xs text-ink-muted">{a.url}</p>
			</div>
		</div>
		<p class="mt-3 text-sm text-ink-muted">{a.description}</p>
		<p class="mt-3 font-mono-hack text-[11px] text-ink-muted">
			申請於 {a.createdAt.toLocaleString('zh-TW')}
		</p>
	</div>

	{#if a.status === 'rejected' && a.reviewNote}
		<p
			class="mt-4 rounded-xl border border-stamp-300/60 bg-stamp-50/60 p-4 text-sm text-stamp-700 dark:bg-transparent dark:text-stamp-300"
		>
			理由：{a.reviewNote}
		</p>
	{/if}

	{#if a.status !== 'rejected'}
		<h2 class="mt-10 section-title">自動檢查</h2>
		{#if !a.checkedAt}
			<p class="mt-2 text-sm text-ink-muted">還在檢查，過幾分鐘再重新整理看看。</p>
		{:else}
			<ul class="mt-3 space-y-2">
				{#each checks as c (c.label)}
					<li class="flex items-start gap-3 text-sm">
						<span
							class="mt-0.5 font-mono-hack {c.ok
								? 'text-emerald-600'
								: c.ok === false
									? 'text-stamp-500'
									: 'text-ink-muted'}">{c.ok ? '✓' : c.ok === false ? '✗' : '–'}</span
						>
						<span>
							<span class="text-ink">{c.label}</span>
							{#if !c.ok && c.hint}<span class="block text-xs text-ink-muted">{c.hint}</span>{/if}
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}

	<a href={resolve('/friends')} class="mt-10 inline-block text-sm text-accent hover:underline"
		>← 回線人名單</a
	>
</div>
