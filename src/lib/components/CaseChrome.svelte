<!--
	The site's frame, as things on the detective's desk rather than a website's
	navigation bar:
	- top left (every page but the board): a paper-clipped slip back to the
	  board, the folder tabs saying which file this is, and a 目錄 slip that
	  opens the cabinet index;
	- top right: a magnifying glass (search), the desk lamp's pull chain
	  (light / dark), a luggage tag for the English profile, and a clip-on ID
	  badge (account, notifications);
	- phones: a pocket notebook in the corner that opens the same index.
	The slips and props sit on the top edge of the page and scroll away with it,
	like things on a desk; ⌘/Ctrl K and each page's closing stamp cover the rest.
	Pages and labels come from site-nav, the same register the board uses.
-->
<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { drawers, drawerFor, onRoute, type Drawer } from '$lib/site-nav';
	import { search } from '$lib/search.svelte';
	import { theme } from '$lib/theme.svelte';
	import X from '@lucide/svelte/icons/x';

	let { user, unread = 0 }: { user?: { name: string; role?: string | null }; unread?: number } =
		$props();

	const onBoard = $derived(page.url.pathname === '/');
	const onEnglish = $derived(onRoute(page.url.pathname, '/english'));
	const current = $derived(drawerFor(page.url.pathname));
	const sections = drawers.filter((d) => d.id !== 'cover');

	function isCardActive(href: string) {
		const [path, query] = href.split('?');
		if (query) return page.url.pathname === path && page.url.search === `?${query}`;
		if (path === '/blog') return page.url.pathname === '/blog' && !page.url.searchParams.get('cat');
		return onRoute(page.url.pathname, path);
	}
	const currentCard = $derived(current?.cards.find((c) => isCardActive(c.href)) ?? null);

	let indexOpen = $state(false);
	let badgeOpen = $state(false);
	let badgeEl: HTMLElement | undefined = $state();
	let tugging = $state(false);

	$effect(() => {
		void page.url.href;
		indexOpen = false;
		badgeOpen = false;
	});

	function pullChain() {
		tugging = true;
		theme.toggle();
		setTimeout(() => (tugging = false), 650);
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			indexOpen = false;
			badgeOpen = false;
		}
	}
	function onWindowClick(e: MouseEvent) {
		if (badgeOpen && badgeEl && !badgeEl.contains(e.target as Node)) badgeOpen = false;
	}
</script>

<svelte:window onkeydown={onKeydown} onclick={onWindowClick} />

{#snippet indexCard(d: Drawer, i: number)}
	<div
		class="index-card rounded-sm px-5 pt-4 pb-6"
		style="rotate: {[-1.2, 0.8, -0.6, 1, -0.9][i % 5]}deg"
	>
		<!-- eslint-disable svelte/no-navigation-without-resolve -- static app paths (some with a query) from site-nav -->
		<a
			href={d.href}
			class="flex items-baseline justify-between border-b-2 border-stamp-400/70 pb-2"
		>
			<span class="font-display text-lg text-case-900">{d.label}</span>
			{#if current?.id === d.id}
				<span class="font-mono-hack text-[0.65rem] text-stamp-600">● 你在這裡</span>
			{/if}
		</a>
		{#if d.cards.length === 0}
			<p class="mt-2 text-sm text-case-800">
				{d.id === 'notes' ? '短句、隨手記，想到什麼寫什麼。' : '打開這個抽屜。'}
			</p>
		{/if}
		<ul class="mt-1">
			{#each d.cards as c (c.href)}
				<li>
					<a
						href={c.href}
						class="card-line group block py-1.5"
						class:is-active={isCardActive(c.href)}
					>
						<span class="block text-sm font-medium text-case-900 group-hover:text-stamp-600"
							>{c.label}</span
						>
						<span class="block font-mono-hack text-[0.68rem] text-case-600">{c.note}</span>
					</a>
				</li>
			{/each}
		</ul>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
		<span aria-hidden="true" class="punch"></span>
	</div>
{/snippet}

<!-- ── Top left: the way back, and where you are ── -->
{#if !onBoard}
	<nav
		class="slips absolute top-3 left-3 z-50 flex items-start gap-2 sm:top-4 sm:left-4"
		aria-label="位置"
	>
		<a href={resolve('/')} class="slip back-slip flex items-center">
			<span class="clip" aria-hidden="true"></span>
			<span class="font-display text-sm">← 回白板</span>
		</a>
		{#if current && current.id !== 'cover'}
			<span class="hidden items-end gap-0.5 sm:flex" aria-label="目前位置">
				<!-- eslint-disable svelte/no-navigation-without-resolve -- static app paths from site-nav -->
				<a href={current.href} class="folder-tab">{current.label}</a>
				{#if currentCard && currentCard.href !== current.href}
					<a href={currentCard.href} class="folder-tab is-current">{currentCard.label}</a>
				{/if}
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			</span>
		{/if}
		<button
			type="button"
			class="slip index-slip hidden items-center sm:flex"
			onclick={() => (indexOpen = true)}
			aria-expanded={indexOpen}
		>
			<span class="font-display text-sm">目錄</span>
		</button>
	</nav>
{/if}

<!-- ── Top right: things on the desk ── -->
<div class="props absolute top-0 right-3 z-50 flex items-start gap-3 sm:right-5">
	<!-- English profile: a luggage tag -->
	{#if onEnglish}
		<a
			href={resolve('/about')}
			hreflang="zh-Hant"
			lang="zh-Hant"
			title="中文"
			class="tag-prop mt-4"
		>
			中<span class="sr-only">文版人物檔案</span>
		</a>
	{:else}
		<a
			href={resolve('/english')}
			hreflang="en"
			lang="en"
			title="English profile"
			class="tag-prop mt-4"
		>
			EN<span class="sr-only"> · English profile</span>
		</a>
	{/if}

	<!-- Search: the magnifying glass -->
	<button
		type="button"
		class="glass-prop mt-3"
		aria-label="搜尋（Ctrl/⌘ K）"
		title="搜尋（Ctrl/⌘ K）"
		onclick={() => (search.open = true)}
	>
		<svg viewBox="0 0 48 48" aria-hidden="true">
			<circle
				cx="20"
				cy="20"
				r="12.5"
				fill="rgba(200,226,255,0.22)"
				stroke="#b8904f"
				stroke-width="4"
			/>
			<path
				d="M13 15 Q16 10.5 21 10"
				stroke="#fff"
				stroke-width="2"
				stroke-linecap="round"
				fill="none"
				opacity="0.8"
			/>
			<path d="M29 29 L40 40" stroke="#6b4f2a" stroke-width="6" stroke-linecap="round" />
			<path d="M29.5 29.5 L32 32" stroke="#8a6a36" stroke-width="6" stroke-linecap="round" />
		</svg>
	</button>

	<!-- Light / dark: the desk lamp's pull chain -->
	<button
		type="button"
		class="chain-prop"
		class:tug={tugging}
		aria-label={theme.current === 'dark' ? '拉一下檯燈，切成亮色' : '拉一下檯燈，切成暗色'}
		title="拉一下檯燈"
		onclick={pullChain}
	>
		<span class="chain" aria-hidden="true"></span>
		<span class="bead" aria-hidden="true"></span>
	</button>

	<!-- Account: a clip-on ID badge -->
	<div bind:this={badgeEl} class="relative mt-2">
		<button
			type="button"
			class="badge-prop"
			aria-label={unread ? `識別證（${unread} 則新通知）` : '識別證：登入與通知'}
			aria-expanded={badgeOpen}
			onclick={() => (badgeOpen = !badgeOpen)}
		>
			<span class="badge-clip" aria-hidden="true"></span>
			<span class="badge-band" aria-hidden="true"></span>
			<span class="badge-name font-mono-hack">{user ? user.name.slice(0, 6) : 'GUEST'}</span>
			{#if unread}<span class="unread-dot" aria-hidden="true"></span>{/if}
		</button>
		{#if badgeOpen}
			<div
				class="account-menu index-card top-full right-0 mt-2 w-44 rounded-sm px-2 pb-1"
				in:fly={{ y: -6, duration: 160 }}
				out:fly={{ y: -6, duration: 100 }}
			>
				{#if user}
					<p class="menu-row truncate font-mono-hack text-xs text-case-600">{user.name}</p>
					<a
						href={resolve('/notifications')}
						class="menu-row flex items-center justify-between rounded-sm text-sm text-case-900 hover:bg-case-200/60"
					>
						通知
						{#if unread}<span class="font-mono-hack text-xs text-stamp-500">{unread} 則新</span
							>{/if}
					</a>
					{#if user.role === 'Liam'}
						<a
							href={resolve('/admin/posts')}
							class="menu-row block rounded-sm text-sm text-case-900 hover:bg-case-200/60">後台</a
						>
						<a
							href={resolve('/admin/comments')}
							class="menu-row block rounded-sm text-sm text-case-900 hover:bg-case-200/60"
							>證詞審核</a
						>
					{/if}
					<form method="post" action="{resolve('/login')}?/signOut" use:enhance>
						<button
							type="submit"
							class="menu-row block w-full rounded-sm text-left text-sm text-case-900 hover:bg-case-200/60"
							>登出</button
						>
					</form>
				{:else}
					<a
						href={resolve('/login')}
						class="menu-row block rounded-sm text-sm text-case-900 hover:bg-case-200/60">登入</a
					>
				{/if}
			</div>
		{/if}
	</div>
</div>

<!-- ── Phones: a pocket notebook that opens the index ── -->
<button
	type="button"
	class="notebook-prop fixed bottom-4 left-4 z-50 sm:hidden"
	onclick={() => (indexOpen = true)}
	aria-expanded={indexOpen}
>
	<span class="font-display text-sm">目錄</span>
</button>

<!-- ── The cabinet index ── -->
{#if indexOpen}
	<div
		class="fixed inset-0 z-[60] overflow-y-auto px-4 pt-20 pb-10"
		transition:fade={{ duration: 160 }}
	>
		<button
			type="button"
			class="fixed inset-0 bg-case-950/80 backdrop-blur-sm"
			aria-label="關上目錄"
			onclick={() => (indexOpen = false)}
		></button>
		<div
			class="relative mx-auto max-w-4xl"
			role="dialog"
			aria-modal="true"
			aria-label="檔案櫃目錄"
			in:fly={{ y: 24, duration: 280, easing: cubicOut }}
		>
			<div class="mb-5 flex items-center justify-between">
				<p class="font-display text-2xl text-cream-100">檔案櫃目錄</p>
				<button
					type="button"
					class="flex size-10 items-center justify-center rounded-full text-cream-100/80 hover:text-cream-100"
					aria-label="關上目錄"
					onclick={() => (indexOpen = false)}
				>
					<X class="size-5" />
				</button>
			</div>
			<div class="grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3">
				<a
					href={resolve('/')}
					class="index-card block rounded-sm px-5 pt-4 pb-6"
					style="rotate: 0.6deg"
				>
					<span class="block border-b-2 border-stamp-400/70 pb-2 font-display text-lg text-case-900"
						>證物白板</span
					>
					<span class="mt-2 block text-sm text-case-800">一眼看完 Liam 是誰——所有線索的總部。</span>
					<span aria-hidden="true" class="punch"></span>
				</a>
				{#each sections as d, i (d.id)}
					{@render indexCard(d, i)}
				{/each}
			</div>
		</div>
	</div>
{/if}

<style>
	/* ── Paper slips (top left) ── */
	.slip {
		position: relative;
		padding: 7px 14px 8px;
		background: #f4ead2;
		color: #2c2118;
		box-shadow: 0 6px 14px -8px rgba(0, 0, 0, 0.55);
		transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	.back-slip {
		rotate: -2deg;
		padding-left: 22px;
	}
	.index-slip {
		rotate: 2deg;
		background: #ecdcae;
	}
	.slip:hover,
	.slip:focus-visible {
		transform: translateY(2px) rotate(1deg);
	}
	.clip {
		/* a bent-wire paperclip over the slip's left edge */
		position: absolute;
		top: -8px;
		left: 6px;
		width: 10px;
		height: 30px;
		border: 2px solid #8f969c;
		border-radius: 6px;
		box-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
	}
	.folder-tab {
		padding: 4px 12px 5px;
		border-radius: 6px 6px 0 0;
		background: #d4ad6e;
		color: #4a3925;
		font-family: var(--font-display);
		font-size: 0.8rem;
		box-shadow: 0 4px 8px -6px rgba(0, 0, 0, 0.5);
		transition: transform 0.2s;
	}
	.folder-tab.is-current {
		background: #f2e7cf;
		color: #2c2118;
	}
	.folder-tab:hover {
		transform: translateY(-2px);
	}

	/* ── Desk props (top right) ── */
	.tag-prop {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 42px;
		height: 26px;
		padding-left: 6px;
		background: #ecdcae;
		color: #4a3925;
		font-family: var(--font-mono-hack);
		font-size: 0.8rem;
		letter-spacing: 0.05em;
		clip-path: polygon(10px 0, 100% 0, 100% 100%, 10px 100%, 0 50%);
		rotate: 8deg;
		transition: rotate 0.25s;
	}
	.tag-prop::before {
		content: '';
		position: absolute;
		left: 8px;
		top: 50%;
		width: 5px;
		height: 5px;
		translate: 0 -50%;
		border-radius: 50%;
		background: var(--color-surface);
	}
	.tag-prop:hover {
		rotate: -4deg;
	}

	.glass-prop {
		width: 44px;
		height: 44px;
		rotate: -12deg;
		filter: drop-shadow(0 6px 6px rgba(0, 0, 0, 0.35));
		transition: rotate 0.3s cubic-bezier(0.2, 1.4, 0.4, 1);
	}
	.glass-prop:hover,
	.glass-prop:focus-visible {
		rotate: 8deg;
	}

	.chain-prop {
		position: relative;
		width: 22px;
		height: 74px;
		transform-origin: 50% 0;
	}
	.chain {
		position: absolute;
		top: 0;
		left: 50%;
		width: 2px;
		height: 58px;
		translate: -50% 0;
		background: repeating-linear-gradient(to bottom, #b8904f 0 3px, #6b4f2a 3px 5px);
	}
	.bead {
		position: absolute;
		top: 56px;
		left: 50%;
		width: 13px;
		height: 13px;
		translate: -50% 0;
		border-radius: 50%;
		background: radial-gradient(circle at 35% 30%, #f3d59a, #b8904f 55%, #6b4f22);
		box-shadow: 0 3px 4px rgba(0, 0, 0, 0.4);
	}
	.chain-prop:hover .chain,
	.chain-prop:hover .bead {
		translate: -50% 3px;
	}
	.chain-prop.tug {
		animation: swing 0.65s cubic-bezier(0.3, 1.6, 0.5, 1);
	}
	@keyframes swing {
		15% {
			transform: translateY(8px);
		}
		40% {
			transform: rotate(7deg);
		}
		70% {
			transform: rotate(-4deg);
		}
	}

	.badge-prop {
		position: relative;
		display: block;
		width: 44px;
		height: 56px;
		padding-top: 16px;
		border-radius: 5px;
		background: #fbfaf6;
		box-shadow: 0 8px 14px -8px rgba(0, 0, 0, 0.55);
		rotate: 4deg;
		transition: rotate 0.25s;
	}
	.badge-prop:hover,
	.badge-prop[aria-expanded='true'] {
		rotate: -3deg;
	}
	.badge-clip {
		position: absolute;
		top: -7px;
		left: 50%;
		width: 16px;
		height: 10px;
		translate: -50% 0;
		border-radius: 3px;
		background: linear-gradient(#c9ccd0, #8f969c);
	}
	.badge-band {
		position: absolute;
		top: 6px;
		left: 0;
		right: 0;
		height: 7px;
		background: #b3362b;
	}
	.badge-name {
		display: block;
		margin-top: 18px;
		font-size: 8px;
		letter-spacing: 0.08em;
		color: #4a3925;
		text-align: center;
		overflow: hidden;
	}
	.unread-dot {
		position: absolute;
		top: -4px;
		right: -4px;
		width: 11px;
		height: 11px;
		border-radius: 50%;
		background: #e2574a;
		box-shadow: 0 0 0 2px var(--color-surface);
	}
	.account-menu {
		position: absolute;
	}
	.menu-row {
		height: 28px;
		padding: 0 0.5rem;
		line-height: 27px;
	}

	.notebook-prop {
		padding: 10px 18px 10px 22px;
		border-radius: 3px 10px 10px 3px;
		background: #2c2118;
		color: #f4ead2;
		box-shadow:
			inset 6px 0 0 #b3362b,
			0 10px 24px -8px rgba(0, 0, 0, 0.6);
	}

	.card-line {
		position: relative;
		transition: transform 0.2s ease;
	}
	.card-line:hover {
		transform: translateX(4px);
	}
	.card-line.is-active::before {
		content: '';
		position: absolute;
		left: -0.8rem;
		top: 0.8rem;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #b3362b;
	}

	@media (prefers-reduced-motion: reduce) {
		.slip,
		.glass-prop,
		.badge-prop,
		.tag-prop,
		.card-line {
			transition: none;
		}
		.chain-prop.tug {
			animation: none;
		}
	}
</style>
