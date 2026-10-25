<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionResult, SubmitFunction } from '@sveltejs/kit';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Wand from '@lucide/svelte/icons/wand-sparkles';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	type Row = PageData['friends'][number];
	type AfterSubmit = {
		result: ActionResult;
		update: (options?: { reset?: boolean }) => Promise<void>;
	};

	const pending = $derived(data.friends.filter((f) => f.status === 'pending'));
	const listed = $derived(data.friends.filter((f) => f.status === 'approved'));
	const archived = $derived(
		data.friends.filter((f) => f.status === 'hidden' || f.status === 'rejected')
	);
	const groups = $derived([...new Set(listed.map((f) => f.groupName))]);

	let busy = $state('');
	/** Shows a spinner on whatever was clicked until the action returns. */
	const track =
		(key: string): SubmitFunction =>
		() => {
			busy = key;
			return async ({ update }) => {
				await update({ reset: false });
				busy = '';
			};
		};

	// The "add" form, filled in by 自動帶入.
	let draft = $state({ name: '', url: '', avatar: '', description: '', feedUrl: '' });
	// One form, two buttons: 自動帶入 posts to ?/discover and only fills the fields.
	const addForm: SubmitFunction = (event) =>
		event.action.search.includes('discover') ? discover() : created();
	const discover = () => {
		busy = 'discover';
		return async ({ result, update }: AfterSubmit) => {
			busy = '';
			if (result.type === 'success' && result.data?.discovered) {
				const d = result.data.discovered as Record<string, string | null>;
				draft = {
					url: d.url ?? draft.url,
					name: draft.name || (d.title ?? ''),
					description: draft.description || (d.description ?? '').slice(0, 120),
					avatar: draft.avatar || (d.icon ?? ''),
					feedUrl: draft.feedUrl || (d.feedUrl ?? '')
				};
			} else await update({ reset: false });
		};
	};
	const created = () => {
		busy = 'create';
		return async ({ result, update }: AfterSubmit) => {
			await update();
			busy = '';
			if (result.type === 'success')
				draft = { name: '', url: '', avatar: '', description: '', feedUrl: '' };
		};
	};

	const ago = (d: Date | null) => {
		if (!d) return '從未';
		const m = Math.round((Date.now() - d.getTime()) / 60000);
		if (m < 1) return '剛剛';
		if (m < 60) return `${m} 分鐘前`;
		if (m < 1440) return `${Math.round(m / 60)} 小時前`;
		return `${Math.round(m / 1440)} 天前`;
	};

	function health(f: Row): { tone: 'ok' | 'slow' | 'down' | 'none'; text: string } {
		if (!f.checkedAt) return { tone: 'none', text: '尚未檢查' };
		if (f.lost) return { tone: 'down', text: `失聯（最後正常 ${ago(f.lastOkAt)}）` };
		if (!f.httpStatus || f.httpStatus >= 400)
			return { tone: 'down', text: f.httpStatus ? `HTTP ${f.httpStatus}` : '連不上' };
		if ((f.latencyMs ?? 0) > 2500) return { tone: 'slow', text: `${f.latencyMs} ms，偏慢` };
		return { tone: 'ok', text: `${f.latencyMs} ms` };
	}

	const toneClass = {
		ok: 'bg-emerald-500',
		slow: 'bg-amber-500',
		down: 'bg-stamp-500',
		none: 'bg-ink-muted/40'
	};

	const input =
		'w-full rounded-lg border border-border-case bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:ring-2 focus:ring-accent/40 focus:outline-none';
	const smallBtn =
		'inline-flex shrink-0 items-center gap-1 rounded-md border border-border-case px-2.5 whitespace-nowrap py-1 text-xs text-ink-muted transition hover:border-accent hover:text-accent disabled:opacity-50';
</script>

{#snippet avatar(f: Row)}
	<span
		class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-case bg-surface text-sm font-semibold text-ink"
	>
		{#if f.avatar}
			<img src={f.avatar} alt="" class="size-full object-cover" loading="lazy" />
		{:else}
			{f.name.charAt(0)}
		{/if}
	</span>
{/snippet}

{#snippet status(f: Row)}
	{@const h = health(f)}
	<ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
		<li class="flex items-center gap-1.5">
			<span class="size-2 rounded-full {toneClass[h.tone]}"></span>{h.text}
		</li>
		<li>
			互鏈：{f.backlinkOk === true
				? '✓ 有掛本站'
				: f.backlinkOk === false
					? '✗ 沒找到本站連結'
					: '—'}
		</li>
		{#if f.joinCircle}
			<li title={f.feedUrl ?? ''}>
				朋友圈：{f.feedError ? `⚠ ${f.feedError}` : `${f.postCount} 篇`}
			</li>
		{/if}
		<li>檢查：{ago(f.checkedAt)}</li>
	</ul>
{/snippet}

{#snippet fields(f?: Row)}
	<div class="grid gap-3 sm:grid-cols-2">
		<label class="text-xs text-ink-muted"
			>網站名稱 *<input
				name="name"
				required
				maxlength="40"
				value={f?.name ?? ''}
				class={input}
			/></label
		>
		<label class="text-xs text-ink-muted"
			>網址 *<input name="url" required value={f?.url ?? ''} class={input} /></label
		>
		<label class="text-xs text-ink-muted"
			>頭像網址<input name="avatar" value={f?.avatar ?? ''} class={input} /></label
		>
		<label class="text-xs text-ink-muted"
			>Email（不公開）<input
				name="email"
				type="email"
				value={f?.email ?? ''}
				class={input}
			/></label
		>
		<label class="text-xs text-ink-muted sm:col-span-2"
			>一句話介紹 *<input
				name="description"
				required
				maxlength="120"
				value={f?.description ?? ''}
				class={input}
			/></label
		>
		<label class="text-xs text-ink-muted"
			>RSS / Atom（留空自動找）<input
				name="feedUrl"
				value={f?.feedUrl ?? ''}
				class={input}
			/></label
		>
		<label class="text-xs text-ink-muted"
			>對方的友鏈頁<input name="backlinkUrl" value={f?.backlinkUrl ?? ''} class={input} /></label
		>
		<label class="text-xs text-ink-muted"
			>分組<input
				name="groupName"
				list="friend-groups"
				value={f?.groupName ?? '朋友'}
				class={input}
			/></label
		>
		<label class="text-xs text-ink-muted"
			>排序（小的在前）<input
				name="sortOrder"
				type="number"
				value={f?.sortOrder ?? 0}
				class={input}
			/></label
		>
		<label class="text-xs text-ink-muted sm:col-span-2"
			>私人備註<input name="adminNote" value={f?.adminNote ?? ''} class={input} /></label
		>
		<label class="flex items-center gap-2 text-sm text-ink sm:col-span-2">
			<input
				type="checkbox"
				name="joinCircle"
				checked={f?.joinCircle ?? true}
				class="accent-accent"
			/>
			加入朋友圈（抓他的最新文章）
		</label>
	</div>
{/snippet}

<datalist id="friend-groups">
	{#each groups as g (g)}<option value={g}></option>{/each}
</datalist>

<div class="flex flex-wrap items-end justify-between gap-3">
	<div>
		<h1 class="text-2xl font-bold text-ink">友鏈</h1>
		<p class="mt-1 text-sm text-ink-muted">
			{listed.length} 位朋友・{pending.length} 筆待審。每 3 小時自動檢查網站、互鏈和 RSS。
		</p>
	</div>
	<form method="post" action="?/checkAll" use:enhance={track('all')}>
		<button type="submit" class={smallBtn} disabled={busy === 'all'}>
			<RefreshCw class="size-3.5 {busy === 'all' ? 'animate-spin' : ''}" />
			{busy === 'all' ? '檢查中…' : '全部重新檢查'}
		</button>
	</form>
</div>

{#if form?.message}
	<p class="mt-4 rounded-lg border border-stamp-300 bg-stamp-50 px-3 py-2 text-sm text-stamp-600">
		{form.message}
	</p>
{/if}

<!-- ───── 待審核 ───── -->
<section class="mt-8">
	<h2 class="text-lg font-semibold text-ink">
		待審核 <span class="text-ink-muted">{pending.length}</span>
	</h2>
	{#if pending.length === 0}
		<p class="mt-2 text-sm text-ink-muted">沒有待審的申請。</p>
	{/if}
	<ul class="mt-3 space-y-3">
		{#each pending as f (f.id)}
			<li class="rounded-xl border border-brass/60 bg-surface-alt p-4">
				<div class="flex gap-3">
					{@render avatar(f)}
					<div class="min-w-0 flex-1">
						<!-- eslint-disable svelte/no-navigation-without-resolve -- external friend site -->
						<a
							href={f.url}
							target="_blank"
							rel="noopener"
							class="flex items-center gap-1 font-medium text-ink hover:text-accent"
							>{f.name}<ExternalLink class="size-3.5" /></a
						>
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
						<p class="truncate text-xs text-ink-muted">{f.url}・{f.email}</p>
						<p class="mt-1 text-sm text-ink">{f.description}</p>
						{#if f.backlinkUrl}<p class="mt-1 truncate text-xs text-ink-muted">
								友鏈頁：{f.backlinkUrl}
							</p>{/if}
						{@render status(f)}
						<p class="mt-1 text-xs text-ink-muted">申請於 {f.createdAt.toLocaleString('zh-TW')}</p>
					</div>
				</div>
				<div class="mt-3 flex flex-wrap items-center gap-2">
					<form method="post" action="?/approve" use:enhance={track(`ok-${f.id}`)}>
						<input type="hidden" name="id" value={f.id} />
						<button
							class="inline-flex items-center gap-1 rounded-md bg-accent px-3 py-1 text-xs font-medium text-white hover:bg-accent-strong"
						>
							<Check class="size-3.5" /> 核准
						</button>
					</form>
					<form method="post" action="?/check" use:enhance={track(`ck-${f.id}`)}>
						<input type="hidden" name="id" value={f.id} />
						<button class={smallBtn} disabled={busy === `ck-${f.id}`}>
							<RefreshCw class="size-3.5 {busy === `ck-${f.id}` ? 'animate-spin' : ''}" /> 重新檢查
						</button>
					</form>
					<form
						method="post"
						action="?/reject"
						use:enhance={track(`no-${f.id}`)}
						class="flex flex-1 items-center gap-2"
					>
						<input type="hidden" name="id" value={f.id} />
						<input
							name="reviewNote"
							placeholder="退件理由（申請人會看到，選填）"
							class="{input} py-1 text-xs"
						/>
						<button class={smallBtn}><X class="size-3.5" /> 退件</button>
					</form>
				</div>
			</li>
		{/each}
	</ul>
</section>

<!-- ───── 名單 ───── -->
<section class="mt-10">
	<h2 class="text-lg font-semibold text-ink">
		名單 <span class="text-ink-muted">{listed.length}</span>
	</h2>
	<ul class="mt-3 space-y-3">
		{#each listed as f (f.id)}
			<li class="rounded-xl border border-border-case bg-surface-alt p-4">
				<div class="flex gap-3">
					{@render avatar(f)}
					<div class="min-w-0 flex-1">
						<p class="flex flex-wrap items-center gap-2">
							<span class="font-medium text-ink">{f.name}</span>
							<span class="rounded bg-surface px-1.5 py-0.5 text-[11px] text-ink-muted"
								>{f.groupName}</span
							>
							{#if f.adminNote}<span class="text-xs text-ink-muted">📝 {f.adminNote}</span>{/if}
						</p>
						<p class="truncate text-xs text-ink-muted">{f.url}</p>
						{@render status(f)}
					</div>
					<div class="flex shrink-0 items-start gap-1.5">
						<form method="post" action="?/check" use:enhance={track(`ck-${f.id}`)}>
							<input type="hidden" name="id" value={f.id} />
							<button class={smallBtn} disabled={busy === `ck-${f.id}`} title="重新檢查">
								<RefreshCw class="size-3.5 {busy === `ck-${f.id}` ? 'animate-spin' : ''}" />
							</button>
						</form>
						<form method="post" action="?/hide" use:enhance={track(`hd-${f.id}`)}>
							<input type="hidden" name="id" value={f.id} />
							<button class={smallBtn} title="先藏起來"><EyeOff class="size-3.5" /></button>
						</form>
					</div>
				</div>
				<details class="mt-3">
					<summary class="cursor-pointer text-xs text-ink-muted hover:text-accent">編輯</summary>
					<form method="post" action="?/update" use:enhance={track(`up-${f.id}`)} class="mt-3">
						<input type="hidden" name="id" value={f.id} />
						{@render fields(f)}
						<div class="mt-3 flex justify-end">
							<button
								class="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-strong"
							>
								{busy === `up-${f.id}` ? '儲存中…' : '儲存'}
							</button>
						</div>
					</form>
				</details>
			</li>
		{/each}
	</ul>
</section>

<!-- ───── 新增 ───── -->
<section class="mt-10 rounded-xl border border-border-case bg-surface-alt p-4">
	<h2 class="text-lg font-semibold text-ink">直接新增</h2>
	<p class="mt-1 text-xs text-ink-muted">貼上網址按「自動帶入」，會抓站名、介紹、頭像和 RSS。</p>
	<form method="post" action="?/create" use:enhance={addForm} class="mt-4 space-y-3">
		<div class="flex gap-2">
			<input name="url" required placeholder="https://…" bind:value={draft.url} class={input} />
			<button
				formaction="?/discover"
				formnovalidate
				class="{smallBtn} shrink-0"
				disabled={busy === 'discover'}
			>
				<Wand class="size-3.5" />{busy === 'discover' ? '讀取中…' : '自動帶入'}
			</button>
		</div>
		<div class="grid gap-3 sm:grid-cols-2">
			<label class="text-xs text-ink-muted"
				>網站名稱 *<input
					name="name"
					required
					maxlength="40"
					bind:value={draft.name}
					class={input}
				/></label
			>
			<label class="text-xs text-ink-muted"
				>頭像網址<input name="avatar" bind:value={draft.avatar} class={input} /></label
			>
			<label class="text-xs text-ink-muted sm:col-span-2"
				>一句話介紹 *<input
					name="description"
					required
					maxlength="120"
					bind:value={draft.description}
					class={input}
				/></label
			>
			<label class="text-xs text-ink-muted"
				>RSS / Atom<input name="feedUrl" bind:value={draft.feedUrl} class={input} /></label
			>
			<label class="text-xs text-ink-muted"
				>對方的友鏈頁<input name="backlinkUrl" class={input} /></label
			>
			<label class="text-xs text-ink-muted"
				>分組<input name="groupName" list="friend-groups" value="朋友" class={input} /></label
			>
			<label class="flex items-center gap-2 self-end pb-2 text-sm text-ink">
				<input type="checkbox" name="joinCircle" checked class="accent-accent" /> 加入朋友圈
			</label>
		</div>
		<div class="flex justify-end">
			<button
				class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-strong"
			>
				{busy === 'create' ? '新增中…' : '新增'}
			</button>
		</div>
	</form>
</section>

<!-- ───── 封存 ───── -->
{#if archived.length}
	<section class="mt-10">
		<h2 class="text-lg font-semibold text-ink">
			隱藏與退件 <span class="text-ink-muted">{archived.length}</span>
		</h2>
		<ul
			class="mt-3 divide-y divide-border-case rounded-xl border border-border-case bg-surface-alt"
		>
			{#each archived as f (f.id)}
				<li class="flex items-center gap-3 p-3">
					{@render avatar(f)}
					<div class="min-w-0 flex-1">
						<p class="text-sm text-ink">
							{f.name}
							<span class="ml-1 text-xs text-ink-muted"
								>{f.status === 'hidden' ? '隱藏中' : '已退件'}</span
							>
						</p>
						<p class="truncate text-xs text-ink-muted">
							{f.url}{f.reviewNote ? `・理由：${f.reviewNote}` : ''}
						</p>
					</div>
					<form method="post" action="?/approve" use:enhance={track(`ok-${f.id}`)}>
						<input type="hidden" name="id" value={f.id} />
						<button class={smallBtn}><Check class="size-3.5" /> 上架</button>
					</form>
					<form
						method="post"
						action="?/remove"
						use:enhance={({ cancel }) => {
							if (!confirm(`刪除「${f.name}」？朋友圈裡他的文章也會一起刪掉。`)) cancel();
						}}
					>
						<input type="hidden" name="id" value={f.id} />
						<button class="{smallBtn} hover:border-stamp-500 hover:text-stamp-500"
							><Trash2 class="size-3.5" /></button
						>
					</form>
				</li>
			{/each}
		</ul>
	</section>
{/if}
