<script lang="ts">
	import { enhance } from '$app/forms';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import Eye from '@lucide/svelte/icons/eye';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Send from '@lucide/svelte/icons/send';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let busy = $state('');
	const track = (key: string) => () => {
		busy = key;
		return async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => {
			await update({ reset: false });
			busy = '';
		};
	};

	const statusLabel = { pending: '驗證中', verified: '已顯示', hidden: '已隱藏', invalid: '無效' };
	const statusTone = {
		pending: 'text-brass',
		verified: 'text-emerald-600',
		hidden: 'text-ink-muted',
		invalid: 'text-stamp-500'
	};
	const btn =
		'inline-flex shrink-0 items-center gap-1 rounded-md border border-border-case px-2 py-1 text-xs whitespace-nowrap text-ink-muted transition hover:border-accent hover:text-accent disabled:opacity-50';
</script>

<h1 class="text-2xl font-bold text-ink">被引用</h1>
<p class="mt-1 text-sm text-ink-muted">
	別的網站（Webmention）或朋友的文章連到你的文章時會出現在這裡，驗證過的會顯示在文章底下。
</p>

{#if form && 'message' in form && form.message}
	<p class="mt-4 rounded-lg border border-stamp-300 bg-stamp-50 px-3 py-2 text-sm text-stamp-600">
		{form.message}
	</p>
{/if}

<section class="mt-8">
	<h2 class="text-lg font-semibold text-ink">
		收到的 <span class="text-ink-muted">{data.mentions.length}</span>
	</h2>
	{#if data.mentions.length === 0}
		<p class="mt-2 text-sm text-ink-muted">還沒有人提到你的文章。</p>
	{/if}
	<ul class="mt-3 space-y-2">
		{#each data.mentions as m (m.id)}
			<li class="rounded-xl border border-border-case bg-surface-alt p-3 text-sm">
				<div class="flex flex-wrap items-center gap-2">
					<span class="text-xs {statusTone[m.status]}">{statusLabel[m.status]}</span>
					<span class="font-medium text-ink">{m.authorName ?? new URL(m.source).hostname}</span>
					<span class="text-ink-muted">→ {m.targetTitle}</span>
					{#if m.friendId}<span
							class="rounded-sm border border-brass/60 px-1 text-[10px] text-brass">友站</span
						>{/if}
					<span class="ml-auto flex gap-1.5">
						<form method="post" action="?/verify" use:enhance={track(`v-${m.id}`)}>
							<input type="hidden" name="id" value={m.id} />
							<button class={btn} title="重新驗證" disabled={busy === `v-${m.id}`}
								><RefreshCw class="size-3.5 {busy === `v-${m.id}` ? 'animate-spin' : ''}" /></button
							>
						</form>
						<form method="post" action={m.status === 'hidden' ? '?/show' : '?/hide'} use:enhance>
							<input type="hidden" name="id" value={m.id} />
							<button class={btn} title={m.status === 'hidden' ? '顯示' : '隱藏'}>
								{#if m.status === 'hidden'}<Eye class="size-3.5" />{:else}<EyeOff
										class="size-3.5"
									/>{/if}
							</button>
						</form>
						<form
							method="post"
							action="?/remove"
							use:enhance={({ cancel }) => {
								if (!confirm('刪除這筆引用？')) cancel();
							}}
						>
							<input type="hidden" name="id" value={m.id} />
							<button class="{btn} hover:border-stamp-500 hover:text-stamp-500" title="刪除"
								><Trash2 class="size-3.5" /></button
							>
						</form>
					</span>
				</div>
				{#if m.excerpt}<p class="mt-1.5 line-clamp-2 text-xs text-ink-muted">…{m.excerpt}…</p>{/if}
				<p class="mt-1 truncate font-mono-hack text-[11px] text-ink-muted">{m.source}</p>
			</li>
		{/each}
	</ul>
</section>

<section class="mt-10">
	<h2 class="text-lg font-semibold text-ink">通知被你連到的網站</h2>
	<p class="mt-1 text-sm text-ink-muted">
		找出文章裡的外部連結，對方網站支援 Webmention 的話，就告訴他「這篇提到你了」。
	</p>
	<ul class="mt-3 divide-y divide-border-case rounded-xl border border-border-case bg-surface-alt">
		{#each data.posts as p (p.path)}
			<li class="p-3">
				<div class="flex items-center gap-3">
					<span class="min-w-0 flex-1 truncate text-sm text-ink">{p.title}</span>
					<form method="post" action="?/send" use:enhance={track(`s-${p.path}`)}>
						<input type="hidden" name="path" value={p.path} />
						<button class={btn} disabled={busy === `s-${p.path}`}>
							<Send class="size-3.5" />
							{busy === `s-${p.path}` ? '通知中…' : '通知'}
						</button>
					</form>
				</div>
				{#if form && 'results' in form && form.path === p.path}
					{#if form.results.length === 0}
						<p class="mt-2 text-xs text-ink-muted">這篇沒有外部連結。</p>
					{:else}
						<ul class="mt-2 space-y-0.5 text-xs">
							{#each form.results as r (r.target)}
								<li class="flex gap-2">
									<span
										class="w-20 shrink-0 {r.result === '已通知'
											? 'text-emerald-600'
											: 'text-ink-muted'}">{r.result}</span
									>
									<span class="truncate text-ink-muted">{r.target}</span>
								</li>
							{/each}
						</ul>
					{/if}
				{/if}
			</li>
		{/each}
	</ul>
</section>
