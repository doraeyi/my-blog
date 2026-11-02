<!--
	The bar along the top of every page, the same on the case board and inside
	any chapter:
	- left: the file's label (back to the board);
	- middle (wide screens): the chapters, in the book's order. A red thread
	  sits under the open one and runs to whichever one you point at;
	- right: search, the English profile, the light, and your badge.
	Inside the chapters it tucks away while you read down and comes back the
	moment you scroll up. Phones fold the chapters into a menu: the chapters
	strung down one red thread.
-->
<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';
	import mark from '$lib/assets/logo-mark.jpg';
	import { bookmarks, drawerFor, onRoute } from '$lib/site-nav';
	import { search } from '$lib/search.svelte';
	import { theme } from '$lib/theme.svelte';

	let { user, unread = 0 }: { user?: { name: string; role?: string | null }; unread?: number } =
		$props();

	const onBoard = $derived(page.url.pathname === '/');
	const onEnglish = $derived(onRoute(page.url.pathname, '/english'));
	const open = $derived(drawerFor(page.url.pathname)?.id);
	const dark = $derived(theme.current === 'dark');

	// ── The thread under the chapters: under the open one, or the one pointed at ──
	let navEl: HTMLElement | undefined = $state();
	let pointed = $state<string | null>(null);
	let thread = $state<{ x: number; w: number; c: string } | null>(null);
	$effect(() => {
		const id = pointed ?? open;
		void page.url.pathname;
		const el = navEl?.querySelector<HTMLElement>(`[data-id="${id}"]`);
		thread = el ? { x: el.offsetLeft, w: el.offsetWidth, c: el.dataset.c ?? '' } : null;
	});

	// ── Tucked away while reading down, back on the way up ──
	let tucked = $state(false);
	let scrolled = $state(false);
	$effect(() => {
		let last = scrollY;
		const onScroll = () => {
			const y = scrollY;
			scrolled = y > 8;
			if (Math.abs(y - last) > 6) {
				tucked = y > last && y > 160;
				last = y;
			}
		};
		onScroll();
		addEventListener('scroll', onScroll, { passive: true });
		return () => removeEventListener('scroll', onScroll);
	});

	// ── Menus ──
	let menuOpen = $state(false);
	let badgeOpen = $state(false);
	let badgeEl: HTMLElement | undefined = $state();
	$effect(() => {
		void page.url.href;
		menuOpen = false;
		badgeOpen = false;
		tucked = false;
	});
	$effect(() => {
		document.documentElement.style.overflow = menuOpen ? 'hidden' : '';
		return () => (document.documentElement.style.overflow = '');
	});
	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			menuOpen = false;
			badgeOpen = false;
		}
	}
	function onWindowClick(e: MouseEvent) {
		if (badgeOpen && badgeEl && !badgeEl.contains(e.target as Node)) badgeOpen = false;
	}
</script>

<svelte:window onkeydown={onKeydown} onclick={onWindowClick} />

<header
	class="site-bar"
	class:on-board={onBoard}
	class:tucked={tucked && !menuOpen && !badgeOpen}
	class:scrolled
>
	<a href={resolve('/')} class="brand" aria-label="Liam 偵探手記：回到案件板">
		<img src={mark} alt="" width="28" height="28" />
		<span class="brand-name">LIAM</span>
		<span class="brand-sub">CASE FILE · 偵探手記</span>
	</a>

	<!-- eslint-disable svelte/no-navigation-without-resolve -- static app paths from site-nav -->
	<nav bind:this={navEl} class="chapters" aria-label="章節" onpointerleave={() => (pointed = null)}>
		{#each bookmarks as b (b.id)}
			<a
				href={b.href}
				data-id={b.id}
				data-c={b.color}
				class="chapter"
				class:is-open={open === b.id}
				aria-current={open === b.id ? 'page' : undefined}
				onpointerenter={() => (pointed = b.id)}
				onfocus={() => (pointed = b.id)}
				onblur={() => (pointed = null)}
			>
				<span class="tab" style="--c: {b.color}"></span>{b.label}
			</a>
		{/each}
		{#if thread}
			<span
				class="thread"
				style="--x: {thread.x}px; --w: {thread.w}px; --c: {thread.c}"
				aria-hidden="true"
			></span>
		{/if}
	</nav>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->

	<div class="tools">
		<button
			type="button"
			class="tool"
			aria-label="搜尋（Ctrl/⌘ K）"
			onclick={() => (search.open = true)}
		>
			<svg viewBox="0 0 24 24" aria-hidden="true"
				><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg
			>
			<kbd>Ctrl K</kbd>
		</button>
		{#if onEnglish}
			<a href={resolve('/about')} class="tool lang" hreflang="zh-Hant" lang="zh-Hant">中</a>
		{:else}
			<a href={resolve('/english')} class="tool lang" hreflang="en" lang="en">EN</a>
		{/if}
		<button
			type="button"
			class="tool lamp"
			aria-pressed={!dark}
			aria-label={dark ? '開燈（淺色）' : '關燈（深色）'}
			title={dark ? '開燈' : '關燈'}
			onclick={() => theme.toggle()}
		>
			<span class="bulb" class:off={dark} aria-hidden="true"></span>
		</button>
		<div bind:this={badgeEl} class="badge-wrap">
			{#if user}
				<button
					type="button"
					class="tool who"
					aria-expanded={badgeOpen}
					aria-label={unread ? `${user.name}（${unread} 則新通知）` : user.name}
					onclick={() => (badgeOpen = !badgeOpen)}
				>
					<span class="who-name">{user.name.slice(0, 8)}</span>
					{#if unread}<span class="dot" aria-hidden="true"></span>{/if}
				</button>
				{#if badgeOpen}
					<div class="badge-menu" transition:fly={{ y: -6, duration: 160 }}>
						<a href={resolve('/notifications')}>
							通知{#if unread}<span class="count">{unread}</span>{/if}
						</a>
						{#if user.role === 'Liam'}
							<a href={resolve('/admin/posts')}>後台</a>
							<a href={resolve('/admin/comments')}>證詞審核</a>
						{/if}
						<form method="post" action="{resolve('/login')}?/signOut" use:enhance>
							<button type="submit">登出</button>
						</form>
					</div>
				{/if}
			{:else}
				<a href={resolve('/login')} class="tool">登入</a>
			{/if}
		</div>
		<button
			type="button"
			class="tool menu-btn"
			aria-expanded={menuOpen}
			aria-controls="chapter-menu"
			onclick={() => (menuOpen = !menuOpen)}
		>
			<span class="burger" class:x={menuOpen} aria-hidden="true"><i></i><i></i></span>
			<span class="sr-only">章節選單</span>
		</button>
	</div>
</header>

<!-- Phones: the chapters strung down one red thread -->
{#if menuOpen}
	<div
		id="chapter-menu"
		class="chapter-menu"
		role="dialog"
		aria-modal="true"
		aria-label="章節"
		transition:fly={{ y: -12, duration: 220 }}
	>
		<div class="menu-list">
			<span class="menu-thread" aria-hidden="true"></span>
			<!-- eslint-disable svelte/no-navigation-without-resolve -- static app paths from site-nav -->
			<a href={resolve('/')} class="menu-item" style="--i: 0">
				<span class="menu-pin" aria-hidden="true"></span>
				<span class="menu-no">00</span>
				<span class="menu-name">案件板</span>
			</a>
			{#each bookmarks as b, i (b.id)}
				<div class="menu-group" style="--i: {i + 1}; --c: {b.color}">
					<a href={b.href} class="menu-item" class:is-open={open === b.id}>
						<span class="menu-pin" aria-hidden="true"></span>
						<span class="menu-no">{b.no ?? '目'}</span>
						<span class="menu-name">{b.label}</span>
					</a>
					<!-- What's filed under the chapter, one tap away. -->
					{#if b.cards.length}
						<div class="menu-subs">
							{#each b.cards as c (c.href)}
								<a href={c.href} class="menu-sub">{c.label}</a>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	</div>
{/if}

<style>
	.site-bar {
		position: sticky;
		top: 0;
		z-index: 60;
		display: flex;
		align-items: center;
		gap: 1rem;
		height: 64px;
		padding: 0 clamp(1rem, 3vw, 2.2rem);
		color: var(--b-ink);
		transition:
			translate 0.45s cubic-bezier(0.2, 0.8, 0.2, 1),
			background-color 0.3s;
	}
	/* A soft fade under the bar once the page moves under it: no hard edge. */
	.site-bar::before {
		content: '';
		position: absolute;
		inset: 0 0 -18px;
		z-index: -1;
		background: linear-gradient(
			var(--b-bg) 0,
			color-mix(in srgb, var(--b-bg) 88%, transparent) 62%,
			transparent
		);
		opacity: 0;
		transition: opacity 0.3s;
		pointer-events: none;
	}
	.site-bar.scrolled::before {
		opacity: 1;
	}
	.site-bar.tucked {
		translate: 0 -110%;
	}
	/* On the case board the bar floats over the board itself. */
	.site-bar.on-board {
		position: absolute;
		inset: 0 0 auto;
	}
	.site-bar.on-board::before {
		display: none;
	}

	.brand {
		display: flex;
		flex: none;
		align-items: center;
		gap: 0.6rem;
	}
	.brand img {
		width: 28px;
		height: 28px;
		border-radius: 6px;
		transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.brand:hover img {
		transform: rotate(-8deg) scale(1.08);
	}
	.brand-name {
		font-family: var(--font-display);
		font-size: 1.05rem;
		letter-spacing: 0.18em;
	}
	.brand-sub {
		color: var(--b-muted);
		font-family: var(--font-mono-hack);
		font-size: 0.72rem;
		letter-spacing: 0.12em;
	}

	/* ── Chapters ── */
	.chapters {
		position: relative;
		display: none;
		align-items: center;
		gap: 0.2rem;
		margin: 0 auto;
	}
	.chapter {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		height: 2.2rem;
		padding: 0 0.7rem;
		color: var(--b-muted);
		font-size: 0.9rem;
		transition: color 0.2s;
	}
	.chapter:hover,
	.chapter:focus-visible,
	.chapter.is-open {
		color: var(--b-ink);
	}
	.tab {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--c);
		transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.chapter:hover .tab,
	.chapter.is-open .tab {
		transform: scale(1.5);
	}
	/* The thread: slides to where you point, with a little sag of red string */
	.thread {
		position: absolute;
		bottom: 0;
		left: 0;
		width: var(--w);
		height: 2px;
		border-radius: 2px;
		background: var(--b-red);
		box-shadow: 0 2px 8px var(--b-red-glow);
		translate: var(--x) 0;
		transition:
			translate 0.45s cubic-bezier(0.34, 1.4, 0.64, 1),
			width 0.45s cubic-bezier(0.34, 1.4, 0.64, 1);
	}
	.thread::before,
	.thread::after {
		content: '';
		position: absolute;
		top: -2px;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--b-red);
	}
	.thread::before {
		left: -3px;
	}
	.thread::after {
		right: -3px;
	}

	/* ── Tools ── */
	.tools {
		display: flex;
		flex: none;
		align-items: center;
		gap: 0.2rem;
		margin-left: auto;
	}
	.tool {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.45rem;
		min-width: 2.2rem;
		height: 2.2rem;
		padding: 0 0.6rem;
		border-radius: 999px;
		color: var(--b-ink);
		font-size: 0.86rem;
		transition:
			background-color 0.2s,
			transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.tool:hover {
		background: var(--b-hair);
	}
	.tool:active {
		transform: scale(0.92);
	}
	.tool svg {
		width: 17px;
		height: 17px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.tool:hover svg {
		transform: rotate(-12deg) scale(1.1);
	}
	kbd {
		padding: 0.05rem 0.35rem;
		border: 1px solid var(--b-hair);
		border-radius: 4px;
		color: var(--b-muted);
		font-family: var(--font-mono-hack);
		font-size: 0.68rem;
	}
	.lang {
		font-family: var(--font-mono-hack);
		font-size: 0.8rem;
	}
	.bulb {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: #f2b632;
		box-shadow:
			0 0 0 3px rgb(242 182 50 / 0.18),
			0 0 14px 2px rgb(242 182 50 / 0.6);
		transition:
			background-color 0.3s,
			box-shadow 0.3s;
	}
	.bulb.off {
		background: transparent;
		box-shadow: inset 0 0 0 1.5px var(--b-muted);
	}
	.lamp:hover .bulb:not(.off) {
		box-shadow:
			0 0 0 5px rgb(242 182 50 / 0.2),
			0 0 22px 4px rgb(242 182 50 / 0.7);
	}
	.badge-wrap {
		position: relative;
	}
	.who-name {
		max-width: 7rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--b-red);
	}
	.badge-menu {
		position: absolute;
		top: calc(100% + 0.5rem);
		right: 0;
		display: grid;
		width: 10rem;
		padding: 0.35rem;
		border: 1px solid var(--b-hair);
		border-radius: 10px;
		background: var(--b-card);
		box-shadow: var(--b-shadow);
	}
	.badge-menu a,
	.badge-menu button {
		display: flex;
		justify-content: space-between;
		width: 100%;
		padding: 0.5rem 0.65rem;
		border-radius: 6px;
		color: var(--b-ink);
		font-size: 0.88rem;
		text-align: left;
	}
	.badge-menu a:hover,
	.badge-menu button:hover {
		background: var(--b-hair);
	}
	.count {
		color: var(--b-red);
		font-family: var(--font-mono-hack);
		font-size: 0.75rem;
	}
	.burger {
		position: relative;
		width: 18px;
		height: 12px;
	}
	.burger i {
		position: absolute;
		left: 0;
		width: 100%;
		height: 2px;
		border-radius: 2px;
		background: currentColor;
		transition:
			top 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
			rotate 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	.burger i:first-child {
		top: 1px;
	}
	.burger i:last-child {
		top: 9px;
	}
	.burger.x i {
		top: 5px;
		rotate: 45deg;
	}
	.burger.x i:last-child {
		rotate: -45deg;
	}

	@media (min-width: 1024px) {
		.chapters {
			display: flex;
		}
		.chapters + .tools {
			margin-left: 0;
		}
		.menu-btn {
			display: none;
		}
	}
	@media (max-width: 1180px) {
		.brand-sub,
		kbd {
			display: none;
		}
	}
	@media (max-width: 480px) {
		.lang {
			display: none;
		}
	}

	/* ── The phone menu ── */
	.chapter-menu {
		position: fixed;
		inset: 64px 0 0;
		z-index: 59;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 1.5rem 1.5rem 2rem 3.4rem;
		overflow-y: auto;
		background: var(--b-bg);
	}
	.menu-list {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
	.menu-thread {
		position: absolute;
		top: 1.6rem;
		bottom: 1.6rem;
		left: -1.35rem;
		width: 2px;
		background: var(--b-red);
		transform-origin: top;
		animation: menu-thread 0.7s cubic-bezier(0.65, 0, 0.35, 1) both;
	}
	@keyframes menu-thread {
		from {
			transform: scaleY(0);
		}
	}
	.menu-item {
		position: relative;
		display: flex;
		align-items: baseline;
		gap: 0.9rem;
		padding: 0.75rem 0;
		color: var(--b-ink);
	}
	.menu-list > .menu-item,
	.menu-group {
		border-bottom: 1px solid var(--b-hair);
		animation: menu-item 0.5s cubic-bezier(0.34, 1.4, 0.64, 1) calc(0.08s + var(--i) * 0.06s) both;
	}
	.menu-subs {
		display: flex;
		flex-wrap: wrap;
		gap: 0.15rem 1rem;
		margin: -0.35rem 0 0.8rem 2.5rem;
	}
	.menu-sub {
		padding: 0.25rem 0;
		color: var(--b-muted);
		font-size: 0.85rem;
	}
	.menu-sub:active,
	.menu-sub:hover {
		color: var(--b-red);
	}
	@keyframes menu-item {
		from {
			opacity: 0;
			transform: translateX(-14px);
		}
	}
	.menu-pin {
		position: absolute;
		top: 50%;
		left: -1.72rem;
		width: 12px;
		height: 12px;
		margin-top: -6px;
		border-radius: 50%;
		background: radial-gradient(circle at 35% 30%, #ff8b80, var(--b-red) 45%, #6d0b0b);
		box-shadow: 0 2px 3px rgb(0 0 0 / 0.35);
	}
	.menu-no {
		width: 1.6rem;
		/* The chapter's colour, lifted toward the ink so it reads on the dark board. */
		color: color-mix(in srgb, var(--c, var(--b-muted)) 55%, var(--b-ink));
		font-family: var(--font-mono-hack);
		font-size: 0.8rem;
	}
	.menu-name {
		font-size: 1.6rem;
		font-weight: 700;
	}
	.menu-item.is-open .menu-name {
		color: var(--b-red);
	}

	@media (prefers-reduced-motion: reduce) {
		.site-bar,
		.thread,
		.tool,
		.burger i {
			transition: none;
		}
		.menu-thread,
		.menu-item,
		.menu-group {
			animation: none;
		}
	}
</style>
