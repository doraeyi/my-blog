<script lang="ts">
	import { enhance } from '$app/forms';
	import Send from '@lucide/svelte/icons/send';
	import FlaskConical from '@lucide/svelte/icons/flask-conical';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const active = $derived(data.subscribers.filter((s) => s.status === 'active'));
	const pending = $derived(data.subscribers.filter((s) => s.status === 'pending'));
	const gone = $derived(data.subscribers.filter((s) => s.status === 'unsubscribed'));

	let busy = $state('');
	const statusLabel = { active: '訂閱中', pending: '待確認', unsubscribed: '已取消' };
	const btn =
		'inline-flex shrink-0 items-center gap-1 rounded-md border border-border-case px-2.5 py-1 text-xs whitespace-nowrap text-ink-muted transition hover:border-accent hover:text-accent disabled:opacity-50';
</script>

<h1 class="text-2xl font-bold text-ink">電子報</h1>
<p class="mt-1 text-sm text-ink-muted">
	{active.length} 位訂閱中・{pending.length} 位待確認・{gone.length} 位已取消。每篇文章只會寄一次。
</p>

{#if !data.enabled}
	<p class="mt-4 rounded-lg border border-brass/60 bg-surface-alt p-3 text-sm text-ink">
		還沒設定寄信服務：在伺服器的 .env 加上 RESEND_API_KEY 和 MAIL_FROM
		之後重啟，訂閱框才會出現在網站上。
	</p>
{/if}
{#if form && 'message' in form && form.message}
	<p class="mt-4 rounded-lg border border-stamp-300 bg-stamp-50 px-3 py-2 text-sm text-stamp-600">
		{form.message}
	</p>
{:else if form && 'notice' in form && form.notice}
	<p
		class="mt-4 rounded-lg border border-emerald-600/40 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400"
	>
		{form.notice}
	</p>
{/if}

<section class="mt-8">
	<h2 class="text-lg font-semibold text-ink">寄出新文章</h2>
	<ul class="mt-3 divide-y divide-border-case rounded-xl border border-border-case bg-surface-alt">
		{#each data.issues as issue (issue.key)}
			<li class="flex flex-wrap items-center gap-3 p-3">
				<div class="min-w-0 flex-1">
					<p class="truncate text-sm text-ink">{issue.title}</p>
					<p class="text-xs text-ink-muted">
						{issue.kind}・{issue.date.toLocaleDateString('zh-TW')}
						{#if issue.sent}・<span class="text-emerald-600"
								>{issue.sent.sentAt.toLocaleString('zh-TW')} 寄給 {issue.sent.recipients} 人</span
							>{/if}
					</p>
				</div>
				<form
					method="post"
					action="?/test"
					use:enhance={() => {
						busy = `t-${issue.key}`;
						return async ({ update }) => {
							await update();
							busy = '';
						};
					}}
				>
					<input type="hidden" name="key" value={issue.key} />
					<button class={btn} disabled={busy === `t-${issue.key}`}
						><FlaskConical class="size-3.5" /> 寄給自己看</button
					>
				</form>
				{#if !issue.sent}
					<form
						method="post"
						action="?/send"
						use:enhance={({ cancel }) => {
							if (!confirm(`把「${issue.title}」寄給 ${active.length} 位訂閱者？寄出後不能收回。`))
								return cancel();
							busy = `s-${issue.key}`;
							return async ({ update }) => {
								await update();
								busy = '';
							};
						}}
					>
						<input type="hidden" name="key" value={issue.key} />
						<button
							class="inline-flex items-center gap-1 rounded-md bg-accent px-3 py-1 text-xs font-medium text-white hover:bg-accent-strong disabled:opacity-50"
							disabled={busy === `s-${issue.key}` || active.length === 0}
						>
							<Send class="size-3.5" />
							{busy === `s-${issue.key}` ? '寄送中…' : '寄出'}
						</button>
					</form>
				{/if}
			</li>
		{/each}
	</ul>
</section>

<section class="mt-10">
	<h2 class="text-lg font-semibold text-ink">訂閱者</h2>
	{#if data.subscribers.length === 0}
		<p class="mt-2 text-sm text-ink-muted">還沒有人訂閱。</p>
	{:else}
		<ul
			class="mt-3 divide-y divide-border-case rounded-xl border border-border-case bg-surface-alt text-sm"
		>
			{#each data.subscribers as s (s.id)}
				<li class="flex items-center gap-3 p-3">
					<span class="min-w-0 flex-1 truncate text-ink">{s.email}</span>
					<span
						class="text-xs {s.status === 'active'
							? 'text-emerald-600'
							: s.status === 'pending'
								? 'text-brass'
								: 'text-ink-muted'}">{statusLabel[s.status]}</span
					>
					<span class="hidden font-mono-hack text-xs text-ink-muted sm:inline"
						>{s.createdAt.toLocaleDateString('zh-TW')}</span
					>
					<form
						method="post"
						action="?/remove"
						use:enhance={({ cancel }) => {
							if (!confirm(`刪除 ${s.email}？`)) cancel();
						}}
					>
						<input type="hidden" name="id" value={s.id} />
						<button class="{btn} hover:border-stamp-500 hover:text-stamp-500" aria-label="刪除"
							><Trash2 class="size-3.5" /></button
						>
					</form>
				</li>
			{/each}
		</ul>
	{/if}
</section>
