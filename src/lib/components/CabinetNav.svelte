<!--
	Site navigation as a filing cabinet.
	Desktop: manila index tabs stand out of the left edge, written vertically.
	Hover / focus pulls a tab out and slides that drawer's index card beside it.
	Phone: one "檔案" tab rises from the bottom-left corner and opens the whole
	cabinet as a drawer sheet.
-->
<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { fly, slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { drawers, drawerFor, onRoute, type Drawer } from '$lib/site-nav';
	import { search } from '$lib/search.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import Search from '@lucide/svelte/icons/search';
	import User from '@lucide/svelte/icons/user';
	import X from '@lucide/svelte/icons/x';

	let { user }: { user?: { name: string; role?: string | null } } = $props();

	const current = $derived(drawerFor(page.url.pathname));

	let peek = $state<string | null>(null);
	let closeTimer: ReturnType<typeof setTimeout> | undefined;
	let sheetOpen = $state(false);
	let profileOpen = $state(false);
	let profileEl: HTMLElement | undefined = $state();

	function open(id: string) {
		clearTimeout(closeTimer);
		peek = id;
	}
	function scheduleClose() {
		clearTimeout(closeTimer);
		closeTimer = setTimeout(() => (peek = null), 160);
	}

	$effect(() => {
		void page.url.href;
		peek = null;
		sheetOpen = false;
		profileOpen = false;
	});

	function isCardActive(href: string) {
		const [path, query] = href.split('?');
		if (query) return page.url.pathname === path && page.url.search === `?${query}`;
		if (path === '/blog') return page.url.pathname === '/blog' && !page.url.searchParams.get('cat');
		return onRoute(page.url.pathname, path);
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			peek = null;
			sheetOpen = false;
			profileOpen = false;
		}
	}
	function onWindowClick(e: MouseEvent) {
		if (profileOpen && profileEl && !profileEl.contains(e.target as Node)) profileOpen = false;
	}

	const caseNo = String(new Date().getFullYear()).slice(2) + '-0819';
</script>

<svelte:window onkeydown={onKeydown} onclick={onWindowClick} />

{#snippet indexCard(d: Drawer)}
	<div class="index-card w-64 rounded-sm px-5 pt-4 pb-5">
		<p class="flex items-baseline justify-between border-b-2 border-stamp-400/70 pb-2">
			<span class="font-display text-lg text-case-900">{d.label}</span>
			<span class="font-mono-hack text-[0.65rem] text-case-600">{d.cards.length} 份</span>
		</p>
		<ul class="mt-1">
			{#each d.cards as c (c.href)}
				<li>
					<!-- eslint-disable svelte/no-navigation-without-resolve -- static app paths (some with a query) from site-nav -->
					<a
						href={c.href}
						class="card-line group block py-2"
						class:is-active={isCardActive(c.href)}
					>
						<span class="block text-sm font-medium text-case-900 group-hover:text-stamp-600">
							{c.label}
						</span>
						<span class="block font-mono-hack text-[0.7rem] text-case-600">{c.note}</span>
					</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				</li>
			{/each}
		</ul>
		<span aria-hidden="true" class="punch"></span>
	</div>
{/snippet}

<!-- Case label (brand) -->
<a
	href={resolve('/')}
	class="case-label fixed top-4 left-4 z-50 hidden items-center gap-2 rounded-sm px-3 py-1.5 lg:flex"
>
	<span class="font-mono-hack text-[0.65rem] tracking-widest text-case-600">No.{caseNo}</span>
	<span class="font-display text-sm text-case-900">Liam 偵探手記</span>
</a>

<!-- Desktop: index tabs on the left edge -->
<nav
	aria-label="主選單"
	class="fixed top-24 left-0 z-50 hidden flex-col gap-1.5 lg:flex"
	onpointerleave={scheduleClose}
>
	{#each drawers as d, i (d.id)}
		{@const active = current?.id === d.id}
		<div
			class="relative"
			role="presentation"
			onpointerenter={() => open(d.id)}
			onfocusin={() => open(d.id)}
			onfocusout={scheduleClose}
		>
			<!-- eslint-disable svelte/no-navigation-without-resolve -- static app paths from site-nav -->
			<a
				href={d.href}
				class="tab"
				class:is-active={active}
				class:is-peek={peek === d.id}
				style="--i: {i}"
				aria-current={active ? 'page' : undefined}
			>
				{d.label}
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
			{#if peek === d.id && d.cards.length}
				<div
					class="absolute top-0 left-full z-10 pl-2"
					in:fly={{ x: -16, duration: 260, easing: cubicOut }}
					out:fly={{ x: -10, duration: 120 }}
				>
					{@render indexCard(d)}
				</div>
			{/if}
		</div>
	{/each}
</nav>

<!-- Phone: one tab rising from the bottom-left corner -->
<button
	type="button"
	class="mobile-tab fixed bottom-0 left-4 z-50 rounded-t-md px-4 pt-2 pb-3 font-display text-sm lg:hidden"
	aria-expanded={sheetOpen}
	onclick={() => (sheetOpen = !sheetOpen)}
>
	檔案{current && current.id !== 'cover' ? ` · ${current.label}` : ''}
</button>

{#if sheetOpen}
	<button
		type="button"
		aria-label="關閉檔案櫃"
		class="fixed inset-0 z-50 bg-case-950/40 backdrop-blur-[2px] lg:hidden"
		onclick={() => (sheetOpen = false)}
		transition:fly={{ duration: 150, opacity: 0 }}
	></button>
	<div
		class="drawer-sheet fixed inset-x-0 bottom-0 z-50 max-h-[82vh] overflow-y-auto rounded-t-xl px-4 pt-4 pb-8 lg:hidden"
		transition:fly={{ y: 400, duration: 320, easing: cubicOut }}
	>
		<div class="mb-3 flex items-center justify-between">
			<p class="font-display text-lg text-cream-100">檔案櫃</p>
			<button
				type="button"
				aria-label="關閉"
				onclick={() => (sheetOpen = false)}
				class="flex size-9 items-center justify-center rounded-full text-cream-100/80"
			>
				<X class="size-5" />
			</button>
		</div>
		<ul class="space-y-2">
			{#each drawers as d (d.id)}
				<li class="index-card rounded-sm px-4 py-3" transition:slide>
					<!-- eslint-disable svelte/no-navigation-without-resolve -- static app paths from site-nav -->
					<a href={d.href} class="flex items-baseline justify-between">
						<span class="font-display text-base text-case-900">{d.label}</span>
						{#if current?.id === d.id}
							<span class="font-mono-hack text-[0.65rem] text-stamp-600">● 目前位置</span>
						{/if}
					</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
					{#if d.cards.length}
						<div class="mt-2 flex flex-wrap gap-x-4 gap-y-1">
							{#each d.cards as c (c.href)}
								<!-- eslint-disable svelte/no-navigation-without-resolve -- static app paths from site-nav -->
								<a
									href={c.href}
									class="text-sm text-case-700 underline-offset-4"
									class:font-medium={isCardActive(c.href)}
									class:underline={isCardActive(c.href)}
								>
									{c.label}
								</a>
								<!-- eslint-enable svelte/no-navigation-without-resolve -->
							{/each}
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	</div>
{/if}

<!-- Tools: search, theme, account -->
<div class="fixed top-4 right-4 z-50 flex items-center gap-2">
	<button
		type="button"
		aria-label="搜尋（Ctrl/⌘ K）"
		title="搜尋（Ctrl/⌘ K）"
		onclick={() => (search.open = true)}
		class="tool-btn"
	>
		<Search class="size-4" />
	</button>
	<div class="tool-wrap"><ThemeToggle /></div>
	<div bind:this={profileEl} class="relative">
		<button
			type="button"
			aria-label="使用者選單"
			aria-expanded={profileOpen}
			onclick={() => (profileOpen = !profileOpen)}
			class="tool-btn"
		>
			<User class="size-4" />
		</button>
		{#if profileOpen}
			<div
				class="index-card absolute top-full right-0 mt-2 w-44 rounded-sm px-2 pb-1"
				in:fly={{ y: -6, duration: 160 }}
				out:fly={{ y: -6, duration: 100 }}
			>
				{#if user}
					<p class="menu-row truncate font-mono-hack text-xs text-case-600">{user.name}</p>
					{#if user.role === 'Liam'}
						<a
							href={resolve('/admin/posts')}
							class="menu-row block rounded-sm text-sm text-case-900 hover:bg-case-200/60"
						>
							後台
						</a>
						<a
							href={resolve('/admin/comments')}
							class="menu-row block rounded-sm text-sm text-case-900 hover:bg-case-200/60"
						>
							證詞審核
						</a>
					{/if}
					<form method="post" action="{resolve('/login')}?/signOut" use:enhance>
						<button
							type="submit"
							class="menu-row block w-full rounded-sm text-left text-sm text-case-900 hover:bg-case-200/60"
						>
							登出
						</button>
					</form>
				{:else}
					<a
						href={resolve('/login')}
						class="menu-row block rounded-sm text-sm text-case-900 hover:bg-case-200/60"
					>
						登入
					</a>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	/* Account menu rows sit exactly on the index card's 28px ruled lines. */
	.menu-row {
		height: 28px;
		padding: 0 0.5rem;
		line-height: 27px;
	}

	/* ── manila stock shared by tabs, labels and index cards ── */
	.tab,
	.case-label,
	.mobile-tab {
		background:
			url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='80' height='80' filter='url(%23n)' opacity='.08'/%3E%3C/svg%3E"),
			#d4ad6e;
		color: #2c2118;
		box-shadow:
			0 1px 0 rgba(255, 255, 255, 0.35) inset,
			0 6px 14px -8px rgba(44, 33, 24, 0.55);
	}

	.tab {
		position: relative;
		display: block;
		writing-mode: vertical-rl;
		text-orientation: upright;
		letter-spacing: 0.2em;
		font-family: var(--font-display);
		font-size: 0.9rem;
		padding: 0.9rem 0.55rem 0.9rem 0.75rem;
		border-radius: 0 6px 6px 0;
		transform: translateX(-10px);
		transition:
			transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
			background-color 0.2s ease,
			filter 0.2s ease;
		/* Real guide tabs alternate tone slightly as they go down the drawer. */
		filter: brightness(calc(1 - var(--i) * 0.025));
	}
	.tab.is-peek {
		transform: translateX(0);
	}
	.tab.is-active {
		transform: translateX(4px);
		background-color: #f2e7cf;
		filter: none;
	}
	.tab.is-active::after {
		content: '';
		position: absolute;
		left: 0.25rem;
		top: 50%;
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: #b3362b;
		transform: translateY(-50%);
	}

	.mobile-tab {
		box-shadow: 0 -8px 20px -10px rgba(44, 33, 24, 0.6);
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
		top: 0.85rem;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #b3362b;
	}

	.drawer-sheet {
		background: #2c2118;
		box-shadow: 0 -20px 40px -20px rgba(0, 0, 0, 0.6);
	}

	/* ── tools: small stamped squares ── */
	.tool-btn,
	.tool-wrap :global(button) {
		display: flex;
		width: 2.5rem;
		height: 2.5rem;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		border: 1px solid var(--color-border-case);
		background: color-mix(in srgb, var(--color-surface) 85%, transparent);
		color: var(--color-ink);
		box-shadow: none;
		backdrop-filter: none;
		transition:
			transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
			border-color 0.2s ease;
	}
	.tool-btn:hover,
	.tool-wrap :global(button:hover) {
		transform: translateY(-2px) rotate(-3deg);
		border-color: var(--color-accent);
	}

	@media (prefers-reduced-motion: reduce) {
		.tab,
		.card-line,
		.tool-btn {
			transition: none;
		}
	}
</style>
