<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { tilt } from '$lib/actions/tilt';
	import { page } from '$app/state';
	import Seo from '$lib/components/Seo.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import CommentThread from '$lib/components/CommentThread.svelte';
	import { reveal } from '$lib/actions/reveal';
	import { SITE_NAME, SITE_DESCRIPTION } from '$lib/site';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Copy from '@lucide/svelte/icons/copy';
	import Check from '@lucide/svelte/icons/check';
	import Shuffle from '@lucide/svelte/icons/shuffle';
	import Rss from '@lucide/svelte/icons/rss';
	import Link2 from '@lucide/svelte/icons/link-2';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	type Friend = PageData['friends'][number];

	const active = $derived(data.friends.filter((f) => !f.lost));
	const lost = $derived(data.friends.filter((f) => f.lost));
	const groups = $derived([...new Set(active.map((f) => f.groupName))]);
	const mutual = $derived(data.friends.filter((f) => f.backlinkOk).length);

	let group = $state<string | null>(null);
	const shown = $derived(group ? active.filter((f) => f.groupName === group) : active);

	function host(url: string) {
		try {
			return new URL(url).hostname.replace(/^www\./, '');
		} catch {
			return '';
		}
	}
	const mmdd = (d: Date) =>
		`${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

	function signal(f: Friend): { tone: string; label: string } {
		if (!f.checkedAt || f.latencyMs == null) return { tone: 'bg-ink-muted/40', label: '尚未確認' };
		if (f.latencyMs > 2500) return { tone: 'bg-amber-500', label: `回應較慢 · ${f.latencyMs} ms` };
		return { tone: 'bg-emerald-500', label: `在線 · ${f.latencyMs} ms` };
	}

	// 隨機拜訪: a short "dialling…" beat on the button, then off to someone's site.
	let visiting = $state<string | null>(null);
	function randomVisit() {
		if (active.length === 0 || visiting) return;
		const f = active[Math.floor(Math.random() * active.length)];
		visiting = f.name;
		setTimeout(() => {
			window.open(f.url, '_blank', 'noopener');
			visiting = null;
		}, 700);
	}

	// ── 申請 ──
	let app = $state({
		name: '',
		url: '',
		avatar: '',
		description: '',
		email: '',
		feedUrl: '',
		backlinkUrl: '',
		joinCircle: true
	});
	let sending = $state(false);
	const applied = $derived(form && 'applied' in form ? form.applied : null);
	const applyError = $derived(form && 'applyError' in form ? form.applyError : '');
	const statusUrl = $derived(
		applied?.token ? `${page.url.origin}/friends/status/${applied.token}` : null
	);
	let avatarBroken = $state(false);

	const card = $derived([
		['名稱', SITE_NAME],
		['網址', page.url.origin],
		['頭像', `${page.url.origin}/icon-512.png`],
		['介紹', SITE_DESCRIPTION],
		['RSS', `${page.url.origin}/rss.xml`]
	]);

	let copied = $state('');
	async function copy(text: string, key: string) {
		await navigator.clipboard.writeText(text);
		copied = key;
		setTimeout(() => (copied = ''), 1600);
	}

	const requirements = [
		'站點能正常瀏覽，有原創內容（轉貼站、純廣告、SEO 農場就不交換了）。',
		'HTTPS、有自己的網域（免費子網域也可以）。',
		'先在你站上掛本站連結；填了友鏈頁，系統會自動確認，審核會快很多。',
		'掛上之後每 3 小時巡一次：連不上超過 3 天會先移到「失聯檔案」，恢復了就自動回來。'
	];

	const input =
		'mt-1 w-full rounded-lg border border-border-case bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/40 focus:outline-none';
</script>

<Seo title="線人名單" description="友鏈：在網海裡看見彼此。還有朋友們最近寫的文章。" />

{#snippet face(f: { name: string; avatar: string | null }, size = 'size-12')}
	<span
		class="flex {size} shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-case bg-surface font-display text-lg text-ink"
	>
		{#if f.avatar}
			<img
				src={f.avatar}
				alt=""
				loading="lazy"
				referrerpolicy="no-referrer"
				class="size-full object-cover"
				onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
			/>
		{:else}
			{f.name.charAt(0)}
		{/if}
	</span>
{/snippet}

{#snippet friendCard(f: Friend)}
	{@const s = signal(f)}
	<article
		use:tilt={{ max: 4 }}
		class="case-card group relative flex h-full flex-col rounded-2xl border border-border-case bg-surface-alt/70 p-4"
	>
		<div class="flex items-start gap-3">
			<span class="relative">
				{@render face(f)}
				<span
					class="absolute right-0 bottom-0 size-3 rounded-full border-2 border-surface-alt {s.tone}"
					title={s.label}
				></span>
			</span>
			<div class="min-w-0 flex-1">
				<h3 class="truncate font-medium text-ink group-hover:text-accent">
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external friend site -->
					<a href={f.url} target="_blank" rel="noopener" class="after:absolute after:inset-0"
						>{f.name}</a
					>
				</h3>
				<p class="mt-0.5 flex items-center gap-2 font-mono-hack text-[11px] text-ink-muted">
					<span class="truncate">{host(f.url)}</span>
					{#if f.backlinkOk}
						<span
							class="inline-flex shrink-0 items-center gap-0.5 rounded-sm border border-brass/60 px-1 text-brass"
							title="對方站上也掛著本站"
						>
							<Link2 class="size-3" />互鏈
						</span>
					{/if}
				</p>
			</div>
		</div>
		<p class="mt-3 mb-3 line-clamp-2 text-sm text-ink-muted">{f.description}</p>
		{#if f.latest}
			<!-- eslint-disable svelte/no-navigation-without-resolve -- external post -->
			<a
				href={f.latest.url}
				target="_blank"
				rel="noopener"
				class="relative z-10 mt-auto flex items-center gap-2 border-t border-dashed border-border-case pt-3 text-xs text-ink-muted hover:text-accent"
			>
				<span class="shrink-0 text-accent">最近</span>
				<span class="min-w-0 flex-1 truncate">{f.latest.title}</span>
				<time class="shrink-0 font-mono-hack" datetime={f.latest.publishedAt.toISOString()}
					>{mmdd(f.latest.publishedAt)}</time
				>
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		{/if}
	</article>
{/snippet}

<div class="mx-auto max-w-5xl px-6 pb-16">
	<PageHeader
		title="線人名單"
		stamp="機密"
		description="散落在網路各處的朋友。友鏈對我來說，是「我在這片網海裡看見了你，幫你掛個牌子」。"
	>
		<dl class="mt-5 flex flex-wrap gap-x-8 gap-y-2 font-mono-hack text-xs text-ink-muted">
			<div>
				<dt class="inline">線人</dt>
				<dd class="inline text-base text-ink">{active.length}</dd>
			</div>
			<div>
				<dt class="inline">互鏈</dt>
				<dd class="inline text-base text-ink">{mutual}</dd>
			</div>
			<div>
				<dt class="inline">朋友圈文章</dt>
				<dd class="inline text-base text-ink">{data.circlePosts}</dd>
			</div>
		</dl>
	</PageHeader>

	<div class="flex flex-wrap items-center gap-2" use:reveal={{ delay: 60 }}>
		<a
			href={resolve('/friends/circle')}
			class="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-sm text-white transition hover:bg-accent-strong"
		>
			看看朋友們最近寫了什麼 <ArrowRight class="size-4" />
		</a>
		<button
			type="button"
			onclick={randomVisit}
			disabled={active.length === 0}
			class="inline-flex items-center gap-1.5 rounded-full border border-border-case px-4 py-1.5 text-sm text-ink transition hover:border-accent hover:text-accent disabled:opacity-50"
		>
			<Shuffle class="size-4 {visiting ? 'animate-spin' : ''}" />
			{visiting ? `撥號給 ${visiting}…` : '隨機拜訪'}
		</button>
		<a
			href="#apply"
			class="inline-flex items-center gap-1.5 rounded-full border border-border-case px-4 py-1.5 text-sm text-ink-muted transition hover:border-accent hover:text-accent"
			>申請友鏈 ↓</a
		>
		<a
			href={resolve('/friends.opml')}
			class="ml-auto inline-flex items-center gap-1 text-xs text-ink-muted hover:text-accent"
			title="把所有朋友一次匯入你的 RSS 閱讀器"
		>
			<Rss class="size-3.5" /> OPML
		</a>
	</div>

	{#if groups.length > 1}
		<div class="mt-5 flex flex-wrap gap-1.5" role="group" aria-label="分組">
			{#each [null, ...groups] as g (g)}
				<button
					type="button"
					onclick={() => (group = g)}
					aria-pressed={group === g}
					class="rounded-full border px-3 py-1 text-xs transition {group === g
						? 'border-accent bg-accent/10 text-accent'
						: 'border-border-case text-ink-muted hover:text-ink'}"
				>
					{g ?? '全部'}
				</button>
			{/each}
		</div>
	{/if}

	<section class="mt-6" use:reveal={{ delay: 80 }}>
		<h2 class="sr-only">目前的朋友</h2>
		{#if shown.length === 0}
			<p
				class="rounded-2xl border border-dashed border-border-case py-10 text-center text-sm text-ink-muted"
			>
				── 還沒有人，這裡空著。歡迎成為第一個。 ──
			</p>
		{:else}
			<ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each shown as f (f.id)}
					<li class="min-w-0">{@render friendCard(f)}</li>
				{/each}
			</ul>
		{/if}
	</section>

	{#if lost.length}
		<section class="mt-12" use:reveal={{ delay: 80 }}>
			<h2 class="section-title">失聯檔案</h2>
			<p class="mt-1 text-sm text-ink-muted">這幾位最近連不上。恢復之後會自動回到名單。</p>
			<ul class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{#each lost as f (f.id)}
					<li
						class="relative flex items-center gap-3 rounded-2xl border border-dashed border-border-case p-3 opacity-70 grayscale"
					>
						{@render face(f, 'size-10')}
						<div class="min-w-0">
							<p class="truncate text-sm text-ink">{f.name}</p>
							<p class="truncate font-mono-hack text-[11px] text-ink-muted">{host(f.url)}</p>
						</div>
						<span class="date-stamp absolute top-2 right-3">失聯</span>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<!-- ───── 申請 ───── -->
	<section id="apply" class="mt-16 scroll-mt-24" use:reveal={{ delay: 80 }}>
		<h2 class="section-title">申請友鏈</h2>
		<ul class="mt-4 space-y-2 text-sm text-ink-muted">
			{#each requirements as r (r)}
				<li class="flex gap-2"><span class="text-accent">✦</span>{r}</li>
			{/each}
		</ul>

		<div class="mt-6 rounded-2xl border border-border-case bg-surface-alt/60 p-5">
			<div class="flex items-center justify-between">
				<p class="text-sm font-medium text-ink">本站資料（先掛上這個）</p>
				<button
					type="button"
					onclick={() => copy(card.map(([k, v]) => `${k}：${v}`).join('\n'), 'card')}
					class="flex items-center gap-1.5 rounded-full border border-border-case px-3 py-1 text-xs text-ink-muted transition hover:border-accent hover:text-accent"
				>
					{#if copied === 'card'}<Check class="size-3.5" /> 已複製{:else}<Copy class="size-3.5" />
						複製{/if}
				</button>
			</div>
			<dl class="mt-4 space-y-2 font-mono-hack text-sm">
				{#each card as [k, v] (k)}
					<div class="flex gap-3">
						<dt class="w-10 shrink-0 text-ink-muted">{k}</dt>
						<dd class="min-w-0 break-all text-ink">{v}</dd>
					</div>
				{/each}
			</dl>
		</div>

		{#if applied}
			<div class="mt-6 rounded-2xl border border-brass/60 bg-surface-alt p-6 text-center">
				<p class="font-display text-xl text-ink">收到了，{applied.name}！</p>
				<p class="mt-2 text-sm text-ink-muted">
					我會盡快看。審核結果會出現在下面這個專屬連結，存起來隨時回來看。
				</p>
				{#if statusUrl}
					<div
						class="mx-auto mt-4 flex max-w-lg items-center gap-2 rounded-lg border border-border-case bg-surface px-3 py-2"
					>
						<code class="min-w-0 flex-1 truncate text-left text-xs text-ink">{statusUrl}</code>
						<button
							type="button"
							onclick={() => copy(statusUrl, 'status')}
							class="shrink-0 text-xs text-accent"
						>
							{copied === 'status' ? '已複製' : '複製'}
						</button>
					</div>
				{/if}
			</div>
		{:else}
			<div class="mt-6 grid gap-6 lg:grid-cols-[1fr_18rem]">
				<form
					method="post"
					action="?/apply"
					use:enhance={() => {
						sending = true;
						return async ({ update }) => {
							await update({ reset: false });
							sending = false;
						};
					}}
					class="relative grid gap-4 sm:grid-cols-2"
				>
					<label class="text-sm text-ink"
						>網站名稱 *<input
							name="name"
							required
							maxlength="40"
							bind:value={app.name}
							class={input}
						/></label
					>
					<label class="text-sm text-ink"
						>網站網址 *<input
							name="url"
							required
							type="url"
							placeholder="https://"
							bind:value={app.url}
							class={input}
						/></label
					>
					<label class="text-sm text-ink"
						>頭像網址 *<input
							name="avatar"
							required
							type="url"
							placeholder="https://…/avatar.png"
							bind:value={app.avatar}
							oninput={() => (avatarBroken = false)}
							class={input}
						/></label
					>
					<label class="text-sm text-ink"
						>Email（不公開）*<input
							name="email"
							required
							type="email"
							bind:value={app.email}
							class={input}
						/></label
					>
					<label class="text-sm text-ink sm:col-span-2"
						>一句話介紹 *<input
							name="description"
							required
							maxlength="120"
							bind:value={app.description}
							class={input}
						/>
						<span class="mt-1 block text-right text-[11px] text-ink-muted"
							>{app.description.length}/120</span
						></label
					>
					<label class="text-sm text-ink"
						>RSS / Atom（選填，留空會自動找）<input
							name="feedUrl"
							type="url"
							bind:value={app.feedUrl}
							class={input}
						/></label
					>
					<label class="text-sm text-ink"
						>掛本站連結的頁面（選填）<input
							name="backlinkUrl"
							type="url"
							bind:value={app.backlinkUrl}
							class={input}
						/></label
					>
					<!-- Honeypot for bots; hidden from people and screen readers. -->
					<input
						name="nickname"
						tabindex="-1"
						autocomplete="off"
						aria-hidden="true"
						class="absolute -left-[9999px] h-0 w-0 opacity-0"
					/>
					<label class="flex items-center gap-2 text-sm text-ink sm:col-span-2">
						<input
							type="checkbox"
							name="joinCircle"
							bind:checked={app.joinCircle}
							class="accent-accent"
						/>
						加入朋友圈（在這裡顯示你的最新文章）
					</label>
					<div class="flex items-center justify-between gap-3 sm:col-span-2">
						<p class="text-sm text-stamp-500" role="alert">{applyError}</p>
						<button
							type="submit"
							disabled={sending}
							class="shrink-0 rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white transition hover:bg-accent-strong disabled:opacity-60"
						>
							{sending ? '送出中…' : '送出申請'}
						</button>
					</div>
				</form>

				<aside aria-label="卡片預覽">
					<p class="mb-2 font-mono-hack text-xs tracking-widest text-ink-muted">
						PREVIEW · 掛上去長這樣
					</p>
					<div class="rounded-2xl border border-border-case bg-surface-alt/70 p-4">
						<div class="flex items-start gap-3">
							<span
								class="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-case bg-surface font-display text-lg text-ink"
							>
								{#if app.avatar && !avatarBroken}
									<img
										src={app.avatar}
										alt=""
										referrerpolicy="no-referrer"
										class="size-full object-cover"
										onerror={() => (avatarBroken = true)}
									/>
								{:else}
									{app.name.charAt(0) || '?'}
								{/if}
							</span>
							<div class="min-w-0">
								<p class="truncate font-medium text-ink">{app.name || '你的網站'}</p>
								<p class="truncate font-mono-hack text-[11px] text-ink-muted">
									{host(app.url) || 'example.com'}
								</p>
							</div>
						</div>
						<p class="mt-3 line-clamp-2 text-sm text-ink-muted">
							{app.description || '一句話介紹會出現在這裡。'}
						</p>
					</div>
					{#if app.avatar && avatarBroken}
						<p class="mt-2 text-xs text-stamp-500">頭像讀不到，確認一下網址？</p>
					{/if}
				</aside>
			</div>
		{/if}
	</section>

	<div class="mx-auto max-w-3xl">
		<CommentThread
			comments={data.comments}
			message={form && 'message' in form ? form.message : undefined}
			title="想說點什麼"
			placeholder="打聲招呼，或問問友鏈的事…"
		/>
	</div>
</div>
