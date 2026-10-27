<!--
	The homepage: Liam's office, one room instead of a web page.
	- on the wall: the whiteboard in the middle (Liam, red string to each friend), a window with
	  venetian blinds, a clock, and the light switch (light / dark for the whole site);
	- on the desk, left: the computer and its keyboard. The screen is a desktop
	  with the search open and the newest files listed; type anywhere and the
	  keyboard presses the same keys, English or 注音;
	- on the desk, middle: an open book about Liam on a case folder. Its bookmarks
	  are the sections of the site — pull one and you dive into the book;
	- on the desk, right: a magnifying glass, a mug and his nameplate.
	Wide screens get the whole room in one view; phones stack the useful things.
-->
<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';
	import { SvelteSet } from 'svelte/reactivity';
	import mark from '$lib/assets/logo-mark.jpg';
	import { theme } from '$lib/theme.svelte';
	import { loadIndex, runSearch, type SearchHit } from '$lib/search.svelte';
	import { bookmarks } from '$lib/site-nav';
	import type { SuspectBoardData } from '$lib/suspect-board';

	interface FriendPin {
		id: string;
		name: string;
		url: string;
		avatar: string | null;
		description: string;
		lost: boolean;
	}

	let { board, friends = [] }: { board: SuspectBoardData; friends?: FriendPin[] } = $props();
	const ev = $derived(board.evidence);
	const user = $derived(page.data.user as { name: string; role?: string | null } | undefined);
	const unread = $derived((page.data.unread as number | undefined) ?? 0);
	const dark = $derived(theme.current === 'dark');

	// ── The clock (on the wall and in the menu bar) ──
	let now = $state<Date | null>(null);
	$effect(() => {
		now = new Date();
		const t = setInterval(() => (now = new Date()), 20_000);
		return () => clearInterval(t);
	});
	const hh = $derived(now ? now.getHours() : 10);
	const mm = $derived(now ? now.getMinutes() : 10);
	/** Outside the window it's whatever time it really is; the switch only lights the room. */
	const sky = $derived(hh < 5 || hh >= 19 ? 'night' : hh < 7 ? 'dawn' : hh < 17 ? 'day' : 'dusk');
	const clockText = $derived(
		now ? `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}` : '--:--'
	);

	// ── The computer: search right on the screen ──
	let query = $state('');
	let hits = $state<SearchHit[]>([]);
	let selected = $state(0);
	let searchInput: HTMLInputElement | undefined = $state();
	$effect(() => {
		const q = query.trim();
		if (!q) {
			hits = [];
			return;
		}
		let alive = true;
		loadIndex().then((docs) => {
			if (!alive) return;
			hits = runSearch(docs, q, 6);
			selected = 0;
		});
		return () => (alive = false);
	});
	// On a desk computer the cursor waits in the search box, so 注音 works from the first key.
	$effect(() => {
		if (window.matchMedia('(min-width: 900px) and (pointer: fine)').matches) {
			searchInput?.focus({ preventScroll: true });
		}
	});
	function openHit() {
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- path from the search index
		if (hits[selected]) goto(hits[selected].doc.path);
	}
	function onSearchKey(e: KeyboardEvent) {
		if (e.isComposing) return;
		if (e.key === 'ArrowDown' && hits.length) {
			e.preventDefault();
			selected = (selected + 1) % hits.length;
		} else if (e.key === 'ArrowUp' && hits.length) {
			e.preventDefault();
			selected = (selected - 1 + hits.length) % hits.length;
		} else if (e.key === 'Enter') {
			e.preventDefault();
			openHit();
		} else if (e.key === 'Escape') {
			query = '';
		}
	}
	const kindLabel: Record<string, string> = {
		article: '技術文章',
		blog: '文章',
		mood: '心情',
		thought: '筆記',
		page: '頁面'
	};

	let menuOpen = $state(false);
	let menuEl: HTMLElement | undefined = $state();

	// ── The keyboard: a Taiwanese layout, English and 注音 on each key ──
	interface Key {
		code: string;
		label: string;
		zy?: string;
		w?: number;
	}
	// prettier-ignore
	const zy: Record<string, string> = {
		'1': 'ㄅ', '2': 'ㄉ', '3': 'ˇ', '4': 'ˋ', '5': 'ㄓ', '6': 'ˊ', '7': '˙', '8': 'ㄚ', '9': 'ㄞ', '0': 'ㄢ', '-': 'ㄦ',
		Q: 'ㄆ', W: 'ㄊ', E: 'ㄍ', R: 'ㄐ', T: 'ㄔ', Y: 'ㄗ', U: 'ㄧ', I: 'ㄛ', O: 'ㄟ', P: 'ㄣ',
		A: 'ㄇ', S: 'ㄋ', D: 'ㄎ', F: 'ㄑ', G: 'ㄕ', H: 'ㄘ', J: 'ㄨ', K: 'ㄜ', L: 'ㄠ', ';': 'ㄤ',
		Z: 'ㄈ', X: 'ㄌ', C: 'ㄏ', V: 'ㄒ', B: 'ㄖ', N: 'ㄙ', M: 'ㄩ', ',': 'ㄝ', '.': 'ㄡ', '/': 'ㄥ'
	};
	// prettier-ignore
	const punct: Record<string, string> = {
		'`': 'Backquote', '-': 'Minus', '=': 'Equal', '[': 'BracketLeft', ']': 'BracketRight', '\\': 'Backslash',
		';': 'Semicolon', "'": 'Quote', ',': 'Comma', '.': 'Period', '/': 'Slash'
	};
	const keyOf = (ch: string): Key => ({
		code: /[A-Z]/.test(ch) ? `Key${ch}` : /\d/.test(ch) ? `Digit${ch}` : punct[ch],
		label: ch,
		zy: zy[ch]
	});
	// prettier-ignore
	const rows: Key[][] = [
		[...'`1234567890-='].map(keyOf).concat({ code: 'Backspace', label: '⌫', w: 2 }),
		[{ code: 'Tab', label: 'Tab', w: 1.5 }, ...[...'QWERTYUIOP[]'].map(keyOf), { code: 'Backslash', label: '\\', w: 1.5 }],
		[{ code: 'CapsLock', label: 'Caps', w: 1.8 }, ...[...'ASDFGHJKL;\''].map(keyOf), { code: 'Enter', label: 'Enter', w: 2.2 }],
		[{ code: 'ShiftLeft', label: 'Shift', w: 2.4 }, ...[...'ZXCVBNM,./'].map(keyOf), { code: 'ShiftRight', label: 'Shift', w: 2.6 }],
		[
			{ code: 'ControlLeft', label: 'Ctrl', w: 1.5 },
			{ code: 'AltLeft', label: 'Alt', w: 1.5 },
			{ code: 'Space', label: '', w: 9 },
			{ code: 'AltRight', label: 'Alt', w: 1.5 },
			{ code: 'ControlRight', label: 'Ctrl', w: 1.5 }
		]
	];
	const pressed = new SvelteSet<string>();

	function typing(target: EventTarget | null) {
		const el = target as HTMLElement | null;
		return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
	}
	function onKeydown(e: KeyboardEvent) {
		pressed.add(e.code);
		if (e.key === 'Escape') menuOpen = false;
		// Type anywhere in the room and it lands on the screen.
		if (
			!typing(e.target) &&
			!e.ctrlKey &&
			!e.metaKey &&
			!e.altKey &&
			(e.key.length === 1 || e.key === 'Process') &&
			e.key !== '/' &&
			e.key !== ' '
		) {
			searchInput?.focus({ preventScroll: true });
			// A plain key: put it on the screen ourselves so the first letter isn't lost.
			if (e.key !== 'Process') {
				e.preventDefault();
				query += e.key;
			}
		}
	}
	function onKeyup(e: KeyboardEvent) {
		pressed.delete(e.code);
	}
	/** Clicking a key on the desk types it too. */
	function tap(k: Key) {
		pressed.add(k.code);
		setTimeout(() => pressed.delete(k.code), 140);
		if (k.code === 'Backspace') query = query.slice(0, -1);
		else if (k.code === 'Space') query += ' ';
		else if (k.code === 'Enter') openHit();
		else if (k.label.length === 1) query += k.label.toLowerCase();
		searchInput?.focus({ preventScroll: true });
	}

	// ── The light switch ──
	function flip() {
		theme.toggle();
	}

	// ── First visit: the bookmarks and the switch peek out once ──
	let hint = $state(false);
	$effect(() => {
		try {
			if (localStorage.getItem('study-hinted')) return;
			localStorage.setItem('study-hinted', '1');
		} catch {
			return;
		}
		hint = true;
		const t = setTimeout(() => (hint = false), 5000);
		return () => clearTimeout(t);
	});

	// ── The book: pull a bookmark and dive into it (the full dive once a visit) ──
	let diving = $state<'' | 'full' | 'quick'>('');
	let diveOrigin = $state('50% 70%');
	let scene: HTMLElement | undefined = $state();
	function dive(e: MouseEvent, href: string) {
		if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !scene) return;
		e.preventDefault();
		let first = true;
		try {
			first = !sessionStorage.getItem('dove');
			sessionStorage.setItem('dove', '1');
		} catch {
			// storage blocked: every dive is the full one
		}
		const at =
			(e.currentTarget as HTMLElement).closest('.book') ?? (e.currentTarget as HTMLElement);
		const r = at.getBoundingClientRect();
		const s = scene.getBoundingClientRect();
		diveOrigin = `${r.left + r.width / 2 - s.left}px ${r.top + r.height / 2 - s.top}px`;
		diving = first ? 'full' : 'quick';
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- static app path from site-nav
		setTimeout(() => goto(href).finally(() => (diving = '')), first ? 620 : 220);
	}
	$effect(() => {
		void page.url.href;
		menuOpen = false;
	});

	function onWindowClick(e: MouseEvent) {
		if (menuOpen && menuEl && !menuEl.contains(e.target as Node)) menuOpen = false;
	}

	const findings = $derived([
		['職業', '2024 起在 MSI 做前端'],
		['作風', '做完不算，好用才算'],
		['解題', '卡關會追到底，再寫成筆記'],
		['生活', '也會老實寫下心情'],
		['下班後', ev.tapes[0] ? `最近在看《${ev.tapes[0].title}》` : '追劇中']
	]);

	// Four places around Liam on the board (desktop %, phone %); friends fill them,
	// the rest are unknowns waiting for an exchange.
	const places = [
		{ x: 19, y: 28, mx: 26, my: 20 },
		{ x: 81, y: 28, mx: 74, my: 20 },
		{ x: 19, y: 74, mx: 26, my: 76 },
		{ x: 81, y: 74, mx: 74, my: 76 }
	];
	const pinned = $derived(friends.slice(0, places.length));
	const slots = $derived(places.map((p, i) => ({ ...p, friend: pinned[i] ?? null })));
	const magnets = ['#c0392b', '#2b4c9b', '#d4a017', '#2f7a4f'];
	const fmt = (d: Date) =>
		`${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
</script>

<svelte:window
	onkeydown={onKeydown}
	onkeyup={onKeyup}
	onblur={() => pressed.clear()}
	onclick={onWindowClick}
/>

<h1 class="sr-only">Liam 的辦公室：前端工程師的偵探手記</h1>

<div class="study sky-{sky}" class:is-dark={dark} class:hint>
	<div
		bind:this={scene}
		class="scene"
		class:diving={diving !== ''}
		class:quick={diving === 'quick'}
		style="transform-origin: {diveOrigin}"
	>
		<!-- ════ The wall ════ -->
		<div class="wall" aria-hidden="true"></div>

		<svg class="wall-clock" viewBox="0 0 100 100" aria-hidden="true">
			<circle cx="50" cy="50" r="46" fill="#f1e6cc" stroke="#2a1a0f" stroke-width="5" />
			{#each Array.from({ length: 12 }, (_, i) => i) as i (i)}
				<line
					x1="50"
					y1="10"
					x2="50"
					y2={i % 3 === 0 ? 18 : 14}
					stroke="#2a1a0f"
					stroke-width={i % 3 === 0 ? 3 : 1.5}
					transform="rotate({i * 30} 50 50)"
				/>
			{/each}
			<line
				x1="50"
				y1="50"
				x2="50"
				y2="28"
				stroke="#2c2118"
				stroke-width="4"
				stroke-linecap="round"
				transform="rotate({(hh % 12) * 30 + mm / 2} 50 50)"
			/>
			<line
				x1="50"
				y1="50"
				x2="50"
				y2="17"
				stroke="#2c2118"
				stroke-width="2.5"
				stroke-linecap="round"
				transform="rotate({mm * 6} 50 50)"
			/>
			<circle cx="50" cy="50" r="3.5" fill="#8e1d12" />
		</svg>

		<!-- The window, blinds half open -->
		<div class="window" aria-hidden="true">
			<div class="sky">
				<span class="sun"></span>
				<span class="moon"></span>
				<span class="skyline"></span>
			</div>
			<span class="blinds"></span>
			<span class="mullion"></span>
			<span class="sill"></span>
		</div>

		<!-- ── The whiteboard: Liam in the middle, his friends strung to him in red ── -->
		<section class="whiteboard" aria-labelledby="wb-title">
			<h2 id="wb-title" class="wb-title hand">朋友們</h2>
			{#each ['wide', 'narrow'] as fit (fit)}
				<svg
					class="wb-strings {fit}"
					viewBox="0 0 100 100"
					preserveAspectRatio="none"
					aria-hidden="true"
				>
					{#each slots as s, i (i)}
						<line
							x1="50"
							y1="50"
							x2={fit === 'wide' ? s.x : s.mx}
							y2={fit === 'wide' ? s.y : s.my}
							class:loose={!s.friend}
							style="--i: {i}"
						/>
					{/each}
				</svg>
			{/each}
			<div class="wb-suspect">
				<span class="wb-pin" aria-hidden="true"></span>
				<img src={mark} alt="Liam 的 L 字標誌" class="wb-photo" />
				<span class="wb-me hand">Liam</span>
			</div>
			{#each slots as s, i (i)}
				<div
					class="wb-slot"
					style="--x: {s.x}%; --y: {s.y}%; --mx: {s.mx}%; --my: {s.my}%; rotate: {[
						-3, 2.5, 2, -2.5
					][i]}deg"
				>
					{#if s.friend}
						{@const f = s.friend}
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external friend site -->
						<a href={f.url} target="_blank" rel="noopener" class="wb-friend" class:lost={f.lost}>
							<span
								class="magnet"
								style="background: {magnets[i % magnets.length]}"
								aria-hidden="true"
							></span>
							<span class="face">
								<span aria-hidden="true">{f.name.charAt(0)}</span>
								{#if f.avatar}
									<img
										src={f.avatar}
										alt=""
										loading="lazy"
										referrerpolicy="no-referrer"
										onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
									/>
								{/if}
							</span>
							<span class="min-w-0">
								<span class="wb-name hand">{f.name}</span>
								<span class="wb-desc">{f.description}</span>
							</span>
						</a>
					{:else}
						<a href={resolve('/friends')} class="wb-friend unknown">
							<span class="magnet" style="background: #9aa0a6" aria-hidden="true"></span>
							<span class="face" aria-hidden="true">?</span>
							<span class="min-w-0">
								<span class="wb-name hand">待查</span>
								<span class="wb-desc">交換友鏈，就掛上來</span>
							</span>
						</a>
					{/if}
				</div>
			{/each}
			<a href={resolve('/friends')} class="wb-sticky hand">
				{friends.length > pinned.length
					? `還有 ${friends.length - pinned.length} 位 · `
					: ''}交換友鏈 →
			</a>
			<span class="wb-tray" aria-hidden="true">
				<span class="marker" style="--c: #2b4c9b"></span>
				<span class="marker" style="--c: #c0392b"></span>
				<span class="eraser"></span>
			</span>
		</section>

		<!-- ── The light switch ── -->
		<button
			type="button"
			class="switch"
			aria-pressed={!dark}
			aria-label={dark ? '電燈開關：開燈' : '電燈開關：關燈'}
			title={dark ? '開燈' : '關燈'}
			onclick={flip}
		>
			<span class="plate" aria-hidden="true">
				<span class="screw"></span>
				<span class="slot"><span class="lever" class:off={dark}></span></span>
				<span class="screw"></span>
			</span>
			<span class="switch-note hand" aria-hidden="true">{dark ? '開燈' : '關燈'}</span>
		</button>

		<!-- ════ The desk ════ -->
		<div class="desk" aria-hidden="true"></div>
		<div class="mat flat" aria-hidden="true"></div>

		<!-- ── The computer ── -->
		<div class="monitor">
			<div class="bezel">
				<div class="screen">
					<div class="menubar">
						<span class="font-bold">Liam</span>
						<span class="menu-decor" aria-hidden="true">檔案&emsp;編輯&emsp;顯示&emsp;視窗</span>
						<span class="ml-auto opacity-80">{clockText}</span>
						<div bind:this={menuEl} class="relative">
							{#if user}
								<button
									type="button"
									class="account"
									aria-expanded={menuOpen}
									onclick={() => (menuOpen = !menuOpen)}
								>
									<span class="avatar">{user.name.charAt(0)}</span>
									<span class="max-w-20 truncate">{user.name}</span>
									{#if unread}<span class="dot" aria-label="{unread} 則新通知"></span>{/if}
								</button>
								{#if menuOpen}
									<div class="account-menu" transition:fly={{ y: -4, duration: 140 }}>
										<a href={resolve('/notifications')}
											>通知{#if unread}<span class="text-amber-300"> · {unread}</span>{/if}</a
										>
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
								<a href={resolve('/login')} class="account">
									<span class="avatar">?</span>
									登入
								</a>
							{/if}
						</div>
					</div>

					<div class="finder">
						<label class="search-row">
							<svg viewBox="0 0 24 24" class="search-icon" aria-hidden="true">
								<circle
									cx="10.5"
									cy="10.5"
									r="6.5"
									fill="none"
									stroke="currentColor"
									stroke-width="2.2"
								/>
								<path
									d="M15.5 15.5 L21 21"
									stroke="currentColor"
									stroke-width="2.6"
									stroke-linecap="round"
								/>
							</svg>
							<span class="sr-only">搜尋整個網站</span>
							<input
								bind:this={searchInput}
								type="search"
								bind:value={query}
								onkeydown={onSearchKey}
								placeholder="直接打字搜尋，英文、注音都可以"
								autocomplete="off"
								spellcheck="false"
							/>
						</label>
						<p class="finder-label">{query.trim() ? '搜尋結果' : '最新案件'}</p>
						<ul class="finder-list" aria-label={query.trim() ? '搜尋結果' : '最新文章'}>
							{#if query.trim()}
								{#each hits as h, i (h.doc.path)}
									<li>
										<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- path from the search index -->
										<a href={h.doc.path} class="row" class:is-sel={i === selected}>
											<span class="row-kind">{kindLabel[h.doc.type] ?? h.doc.type}</span>
											<span class="truncate">{h.doc.title}</span>
										</a>
									</li>
								{:else}
									<li class="row opacity-60">找不到「{query.trim()}」</li>
								{/each}
							{:else}
								{#each board.latest as n (n.href)}
									<li>
										<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- content path -->
										<a href={n.href} class="row">
											<span class="row-kind">{n.kind}</span>
											<span class="truncate">{n.title}</span>
											<span class="row-date">{fmt(n.date)}</span>
										</a>
									</li>
								{/each}
							{/if}
						</ul>
						<a href={resolve('/blog')} class="finder-more">所有案件 →</a>
					</div>
					<span class="glare" aria-hidden="true"></span>
				</div>
				<span class="led" aria-hidden="true"></span>
			</div>
			<span class="neck" aria-hidden="true"></span>
			<span class="foot" aria-hidden="true"></span>
		</div>

		<!-- ── The keyboard and mouse ── -->
		<div class="keyboard flat" aria-hidden="true">
			<div class="kb-body">
				{#each rows as row, r (r)}
					<div class="kb-row">
						{#each row as k (k.code + k.label)}
							<button
								type="button"
								tabindex="-1"
								class="key"
								class:down={pressed.has(k.code)}
								style="flex: {k.w ?? 1}"
								onpointerdown={(e) => {
									e.preventDefault();
									tap(k);
								}}
							>
								<span class="key-en">{k.label}</span>
								{#if k.zy}<span class="key-zy">{k.zy}</span>{/if}
							</button>
						{/each}
					</div>
				{/each}
			</div>
		</div>
		<span class="mouse flat" aria-hidden="true"><span></span></span>

		<!-- ── The case folder and the open book ── -->
		<span class="folder flat" aria-hidden="true"><span class="stamp">機密</span></span>
		<div class="book">
			<div class="book-3d">
				<span class="book-pin pin-target" aria-hidden="true"></span>
				<a href={resolve('/about')} class="pages" onclick={(e) => dive(e, resolve('/about'))}>
					<span class="page left">
						<img src={mark} alt="" class="polaroid" />
						<span class="mt-3 block font-display text-[1.5em] leading-none">Liam</span>
						<span class="mt-1 block font-mono-hack text-[0.62em] tracking-[0.25em] text-[#8a7458]"
							>前端工程師 · MSI</span
						>
						<span class="hand mt-2 block text-[0.95em] leading-snug text-[#8e1d12]"
							>在意細節、卡關會追到底，<br />也會老實寫下生活的人。</span
						>
					</span>
					<span class="page right">
						<span
							class="block border-b border-[#c0392b] pb-1 font-display text-[1.05em] tracking-[0.3em]"
							>人物檔案</span
						>
						{#each findings as [field, note] (field)}
							<span class="finding">
								<span class="finding-field font-mono-hack">{field}</span>
								<span class="hand">{note}</span>
							</span>
						{/each}
						<span class="hand mt-auto block text-right text-[0.85em] text-[#8a7458]"
							>拉一張書籤，翻進去看 →</span
						>
					</span>
					<span class="sr-only">打開完整人物檔案</span>
				</a>
				<nav class="bookmarks" aria-label="書籤：網站的各個部分">
					<!-- eslint-disable svelte/no-navigation-without-resolve -- static app paths from site-nav -->
					{#each bookmarks as d, i (d.id)}
						<a
							href={d.href}
							class="bookmark"
							style="--c: {d.color}; --i: {i}"
							onclick={(e) => dive(e, d.href)}
						>
							{d.label}
						</a>
					{/each}
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				</nav>
			</div>
		</div>

		<!-- ── The right of the desk ── -->
		<svg class="magnifier flat" viewBox="0 0 120 60" aria-hidden="true">
			<rect x="58" y="25" width="56" height="10" rx="5" fill="#3b2516" />
			<rect x="52" y="24" width="10" height="12" rx="2" fill="#b8904f" />
			<circle
				cx="28"
				cy="30"
				r="24"
				fill="rgba(200,226,255,0.25)"
				stroke="#b8904f"
				stroke-width="5"
			/>
			<path d="M14 22 Q20 12 30 11" stroke="#fff" stroke-width="2.5" fill="none" opacity="0.7" />
		</svg>
		<span class="mug" aria-hidden="true"><span class="steam"></span></span>
		<span class="nameplate" aria-hidden="true">
			<span class="font-display">LIAM</span>
			<span class="font-mono-hack">FRONT-END DETECTIVE</span>
		</span>

		<!-- ── Lights off: the screen and the moon through the blinds ── -->
		<div class="night" aria-hidden="true"></div>
		<div class="slats-light" aria-hidden="true"></div>
	</div>
	<div
		class="dive-paper"
		class:on={diving !== ''}
		class:quick={diving === 'quick'}
		aria-hidden="true"
	></div>
</div>

<style>
	.hand {
		font-family: 'LXGW WenKai TC', var(--font-display);
	}

	/* ════ The room (phones: the useful things, stacked) ════ */
	.study {
		position: relative;
		overflow: hidden;
		background: #3f4439;
	}
	.scene {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 26px;
		padding: 76px 14px 34px;
		transition:
			transform 0.62s cubic-bezier(0.55, 0, 0.85, 0.35),
			filter 0.62s,
			opacity 0.22s;
	}
	.scene.diving {
		transform: scale(6);
		filter: blur(1.5px);
	}
	.scene.diving.quick {
		transform: scale(1.6);
		filter: none;
		transition-duration: 0.22s;
	}
	.dive-paper {
		position: fixed;
		inset: 0;
		z-index: 80;
		background: #fbf6e9;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.3s 0.32s;
	}
	.dive-paper.on {
		opacity: 1;
	}
	.dive-paper.quick {
		transition: opacity 0.2s;
	}
	.wall {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.035) 0 2px, transparent 3px) 0 0 /
				26px 26px,
			repeating-linear-gradient(90deg, rgba(0, 0, 0, 0.08) 0 1px, transparent 1px 52px),
			radial-gradient(ellipse at 50% 0%, #5d6553, #474d40 60%, #3a3f34);
	}
	.wall-clock,
	.window,
	.desk,
	.mat,
	.keyboard,
	.mouse,
	.folder,
	.magnifier,
	.mug,
	.nameplate,
	.slats-light {
		display: none;
	}

	/* ── Whiteboard ── */
	.whiteboard {
		position: relative;
		order: 3;
		padding: 18px 18px 58px;
		border: 9px solid #c9ccd1;
		border-radius: 4px;
		background:
			radial-gradient(ellipse at 70% 30%, rgba(160, 175, 190, 0.18), transparent 50%),
			radial-gradient(ellipse at 20% 80%, rgba(43, 76, 155, 0.05), transparent 40%),
			linear-gradient(160deg, #ffffff, #f1f3f4);
		box-shadow:
			inset 0 0 0 1px #9aa0a6,
			0 0 0 1px #8a9096,
			0 22px 34px -14px rgba(0, 0, 0, 0.7);
	}
	.wb-title {
		color: #2b4c9b;
		font-size: 30px;
		line-height: 1;
		rotate: -2deg;
	}
	.wb-title::after {
		content: '';
		display: block;
		width: 84px;
		height: 3px;
		margin-top: 6px;
		border-radius: 2px;
		background: #c0392b;
		rotate: 1deg;
	}
	/* Phones: a tall board; wide screens: a wide one (see the media query). */
	.whiteboard {
		height: 470px;
	}
	.wb-strings {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
	}
	.wb-strings.wide {
		display: none;
	}
	.wb-strings line {
		stroke: #b3261e;
		stroke-width: 2;
		vector-effect: non-scaling-stroke;
		stroke-dasharray: 160;
		stroke-dashoffset: 160;
		animation: string-pull 0.9s cubic-bezier(0.3, 0.7, 0.3, 1) calc(0.4s + var(--i) * 0.15s)
			forwards;
	}
	.wb-strings line.loose {
		stroke: #b3261e;
		opacity: 0.4;
	}
	@keyframes string-pull {
		to {
			stroke-dashoffset: 0;
		}
	}
	.wb-suspect {
		position: absolute;
		top: 51%;
		left: 50%;
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 34%;
		padding: 7px 7px 6px;
		background: #fff;
		box-shadow: 0 10px 18px -8px rgba(0, 0, 0, 0.5);
		translate: -50% -50%;
		rotate: -2deg;
	}
	.wb-photo {
		width: 100%;
		aspect-ratio: 1;
		object-fit: cover;
	}
	.wb-me {
		margin-top: 2px;
		color: #2c2118;
		font-size: 17px;
		font-weight: 700;
	}
	.wb-pin {
		position: absolute;
		top: -7px;
		left: 50%;
		width: 15px;
		height: 15px;
		margin-left: -7px;
		border-radius: 50%;
		background: radial-gradient(circle at 35% 30%, #ff9a8b, #c0392b 55%, #6a1d16);
		box-shadow: 0 3px 3px rgba(0, 0, 0, 0.4);
	}
	.wb-slot {
		position: absolute;
		top: var(--my);
		left: var(--mx);
		width: 46%;
		translate: -50% -50%;
	}
	.wb-friend {
		position: relative;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 9px 9px 7px;
		border: 2px solid #1f2937;
		border-radius: 10px 14px 9px 12px;
		background: #fff;
		color: #1f2937;
		transition:
			transform 0.2s,
			box-shadow 0.2s;
	}
	.wb-friend:hover {
		transform: translateY(-2px) rotate(-1deg);
		box-shadow: 4px 4px 0 rgba(43, 76, 155, 0.25);
	}
	.wb-friend.lost {
		opacity: 0.55;
	}
	.wb-friend.unknown {
		border-style: dashed;
		border-color: #9aa0a6;
		color: #6b7280;
	}
	.wb-friend.unknown .face {
		border-style: dashed;
		border-color: #9aa0a6;
	}
	.magnet {
		position: absolute;
		top: -8px;
		left: 50%;
		width: 16px;
		height: 16px;
		margin-left: -8px;
		border-radius: 50%;
		box-shadow:
			inset -2px -3px 0 rgba(0, 0, 0, 0.25),
			0 3px 4px rgba(0, 0, 0, 0.3);
	}
	.face {
		position: relative;
		display: grid;
		flex: none;
		place-items: center;
		width: 38px;
		height: 38px;
		overflow: hidden;
		border: 2px solid #1f2937;
		border-radius: 50%;
		font-family: var(--font-display);
		font-size: 18px;
	}
	.face img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		background: #fff;
	}
	.wb-name {
		display: block;
		overflow: hidden;
		font-size: 17px;
		font-weight: 700;
		line-height: 1.2;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.wb-desc {
		display: -webkit-box;
		overflow: hidden;
		color: #4b5563;
		font-size: 12px;
		line-height: 1.35;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 1;
		line-clamp: 1;
	}
	.wb-sticky {
		position: absolute;
		right: 14px;
		bottom: 12px;
		z-index: 2;
		padding: 8px 12px 10px;
		background: #fde68a;
		color: #5b3a00;
		font-size: 16px;
		box-shadow: 0 8px 10px -6px rgba(0, 0, 0, 0.4);
		rotate: 3deg;
		transition: rotate 0.2s;
	}
	.wb-sticky:hover {
		rotate: -1deg;
	}
	.wb-tray {
		position: absolute;
		bottom: -9px;
		left: 8%;
		display: flex;
		align-items: flex-end;
		gap: 10px;
		width: 48%;
		height: 12px;
		padding: 0 10px;
		border-radius: 0 0 3px 3px;
		background: #b7bbc1;
		translate: 0 100%;
	}
	.marker {
		width: 46px;
		height: 9px;
		margin-bottom: 3px;
		border-radius: 2px 5px 5px 2px;
		background: linear-gradient(90deg, var(--c) 0 26%, #e5e7eb 26%);
	}
	.eraser {
		width: 40px;
		height: 12px;
		margin-bottom: 2px;
		border-radius: 2px;
		background: linear-gradient(#1f2937 0 55%, #e5e7eb 55%);
	}

	/* ── Light switch ── */
	.switch {
		position: absolute;
		top: 14px;
		right: 60px;
		z-index: 7;
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 30px;
		cursor: pointer;
	}
	.plate {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		aspect-ratio: 0.62;
		padding: 12% 0;
		border-radius: 4px;
		background: linear-gradient(150deg, #f4ecd8, #ddd0b2);
		box-shadow:
			inset 0 1px 0 #fffaf0,
			inset 0 -2px 0 rgba(0, 0, 0, 0.12),
			0 4px 8px -2px rgba(0, 0, 0, 0.55);
	}
	.screw {
		width: 14%;
		aspect-ratio: 1;
		border-radius: 50%;
		background: linear-gradient(135deg, #c9b07a, #8a6a36);
		box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.4);
	}
	.slot {
		position: relative;
		width: 30%;
		height: 34%;
		border-radius: 3px;
		background: #3b2a1c;
		box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.6);
		perspective: 120px;
	}
	.lever {
		position: absolute;
		left: 18%;
		bottom: 50%;
		width: 64%;
		height: 92%;
		border-radius: 3px 3px 2px 2px;
		background: linear-gradient(90deg, #6b4a2c, #a37a4c 45%, #6b4a2c);
		transform: rotateX(28deg);
		transform-origin: bottom center;
		transition: transform 0.18s cubic-bezier(0.5, 1.8, 0.6, 1);
	}
	.lever.off {
		transform: rotateX(152deg);
	}
	.switch:hover .plate {
		box-shadow:
			inset 0 1px 0 #fffaf0,
			inset 0 -2px 0 rgba(0, 0, 0, 0.12),
			0 0 0 3px rgba(212, 160, 23, 0.35),
			0 4px 8px -2px rgba(0, 0, 0, 0.55);
	}
	.switch-note {
		display: none;
	}
	.hint .plate {
		animation: beckon 1.1s ease-in-out 3;
	}
	@keyframes beckon {
		50% {
			box-shadow:
				inset 0 1px 0 #fffaf0,
				0 0 0 6px rgba(212, 160, 23, 0.45),
				0 4px 8px -2px rgba(0, 0, 0, 0.55);
		}
	}

	/* ── Monitor ── */
	.monitor {
		position: relative;
		z-index: 6;
		order: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.bezel {
		position: relative;
		width: 100%;
		padding: 9px 9px 20px;
		border-radius: 12px;
		background: linear-gradient(180deg, #2a2724, #1b1917);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.08),
			0 24px 40px -18px rgba(0, 0, 0, 0.8);
	}
	.screen {
		position: relative;
		display: flex;
		flex-direction: column;
		min-height: 320px;
		overflow: hidden;
		border-radius: 3px;
		background:
			radial-gradient(ellipse at 78% 18%, rgba(255, 170, 90, 0.42), transparent 45%),
			radial-gradient(ellipse at 10% 100%, rgba(80, 120, 170, 0.5), transparent 55%),
			linear-gradient(160deg, #3b2a20, #263246 70%, #1b2433);
		color: #f4ead2;
		font-size: 13px;
		transition: box-shadow 0.6s;
	}
	.is-dark .screen {
		box-shadow: 0 0 80px rgba(150, 180, 255, 0.25);
	}
	.menubar {
		display: flex;
		flex: none;
		align-items: center;
		gap: 1em;
		height: 2.1em;
		padding: 0 0.5em 0 0.8em;
		background: rgba(20, 16, 12, 0.5);
		backdrop-filter: blur(8px);
		font-size: 0.92em;
	}
	.menu-decor {
		overflow: hidden;
		opacity: 0.75;
		white-space: nowrap;
	}
	.account {
		display: flex;
		align-items: center;
		gap: 0.45em;
		padding: 0.1em 0.7em 0.1em 0.15em;
		border-radius: 999px;
		color: #f4ead2;
		white-space: nowrap;
		transition: background 0.15s;
	}
	.account:hover {
		background: rgba(244, 234, 210, 0.16);
	}
	.avatar {
		display: grid;
		place-items: center;
		width: 1.5em;
		height: 1.5em;
		border-radius: 50%;
		background: #d4a017;
		color: #1c1813;
		font-size: 0.85em;
		font-weight: 700;
	}
	.dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #ef4444;
	}
	.account-menu {
		position: absolute;
		top: calc(100% + 4px);
		right: 0;
		z-index: 2;
		display: grid;
		min-width: 130px;
		padding: 4px;
		border: 1px solid rgba(244, 234, 210, 0.15);
		border-radius: 8px;
		background: rgba(34, 29, 23, 0.94);
		backdrop-filter: blur(10px);
		box-shadow: 0 12px 24px rgba(0, 0, 0, 0.5);
	}
	.account-menu a,
	.account-menu button {
		display: block;
		width: 100%;
		padding: 5px 10px;
		border-radius: 5px;
		color: #f4ead2;
		font-size: 13px;
		text-align: left;
	}
	.account-menu a:hover,
	.account-menu button:hover {
		background: rgba(244, 234, 210, 0.12);
	}
	.finder {
		display: flex;
		flex-direction: column;
		width: min(90%, 460px);
		min-height: 0;
		margin: auto;
		padding: 0.6em;
		border: 1px solid rgba(255, 255, 255, 0.14);
		border-radius: 12px;
		background: rgba(28, 24, 20, 0.66);
		backdrop-filter: blur(14px);
		box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.6);
	}
	.search-row {
		display: flex;
		align-items: center;
		gap: 0.7em;
		padding: 0.45em 0.6em;
		color: #d4a017;
		cursor: text;
	}
	.search-icon {
		flex: none;
		width: 1.15em;
		height: 1.15em;
	}
	.search-row input {
		flex: 1;
		min-width: 0;
		border: 0;
		background: transparent;
		color: #f4ead2;
		font-size: 1.2em;
		outline: none;
		caret-color: #d4a017;
	}
	.search-row input::placeholder {
		color: rgba(244, 234, 210, 0.45);
	}
	.search-row input::-webkit-search-cancel-button {
		display: none;
	}
	.finder-label {
		margin: 0.3em 0.6em 0.15em;
		padding-top: 0.5em;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		color: rgba(244, 234, 210, 0.5);
		font-size: 0.82em;
		letter-spacing: 0.1em;
	}
	.finder-list {
		min-height: 0;
		overflow: hidden;
	}
	.row {
		display: flex;
		align-items: baseline;
		gap: 0.8em;
		padding: 0.38em 0.6em;
		border-radius: 6px;
		color: #f4ead2;
	}
	.row:hover,
	.row.is-sel {
		background: rgba(212, 160, 23, 0.88);
		color: #1c1813;
	}
	.row-kind {
		flex: none;
		width: 4.6em;
		color: #e3b04b;
		font-size: 0.82em;
	}
	.row:hover .row-kind,
	.row.is-sel .row-kind {
		color: inherit;
	}
	.row-date {
		flex: none;
		margin-left: auto;
		opacity: 0.55;
		font-family: var(--font-mono-hack);
		font-size: 0.8em;
	}
	.finder-more {
		align-self: flex-end;
		margin: 0.3em 0.6em 0.1em;
		color: #e3b04b;
		font-size: 0.85em;
	}
	.finder-more:hover {
		text-decoration: underline;
	}
	.glare {
		position: absolute;
		inset: 0;
		background: linear-gradient(115deg, rgba(255, 255, 255, 0.08), transparent 38%);
		pointer-events: none;
	}
	.led {
		position: absolute;
		right: 18px;
		bottom: 7px;
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: #4ade80;
		box-shadow: 0 0 6px #4ade80;
	}
	.neck {
		width: 13%;
		height: 26px;
		background: linear-gradient(90deg, #1b1917, #3a3632 50%, #1b1917);
	}
	.foot {
		width: 36%;
		height: 9px;
		border-radius: 50% 50% 4px 4px / 100% 100% 4px 4px;
		background: linear-gradient(180deg, #3a3632, #1b1917);
		box-shadow: 0 10px 14px -4px rgba(0, 0, 0, 0.7);
	}

	/* ── Keyboard ── */
	.kb-body {
		display: grid;
		gap: 0.3em;
		padding: 0.55em;
		border-radius: 0.6em;
		background: linear-gradient(180deg, #34312d, #24221f);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.12),
			0 0.45em 0 #161513,
			0 2em 1.6em -0.6em rgba(0, 0, 0, 0.6);
	}
	.kb-row {
		display: flex;
		gap: 0.3em;
	}
	.key {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		min-width: 0;
		height: 2.5em;
		padding: 0.2em 0.3em;
		border-radius: 0.3em;
		background: linear-gradient(180deg, #f2ece0, #ddd3c0);
		color: #2c2118;
		box-shadow:
			0 0.22em 0 #a99b80,
			0 0.28em 0.28em rgba(0, 0, 0, 0.35);
		cursor: pointer;
		transition:
			transform 0.06s,
			box-shadow 0.06s,
			background 0.06s;
	}
	.key.down {
		background: linear-gradient(180deg, #e3b04b, #d4a017);
		box-shadow:
			0 0.04em 0 #a99b80,
			0 0.08em 0.1em rgba(0, 0, 0, 0.35);
		transform: translateY(0.18em);
	}
	.key-en {
		font-family: var(--font-mono-hack);
		font-size: 0.85em;
		line-height: 1;
		text-align: left;
	}
	.key-zy {
		align-self: flex-end;
		color: #8e1d12;
		font-size: 0.8em;
		line-height: 1;
	}

	/* ── The open book ── */
	.book {
		position: relative;
		z-index: 6;
		order: 2;
		font-size: 15px;
	}
	/* Where the red pushpin lands when you come back from inside the book. */
	.book-pin {
		position: absolute;
		z-index: 3;
		top: -7px;
		left: 22px;
	}
	.book-3d {
		position: relative;
		margin-right: 46px;
		padding: 8px;
		border-radius: 6px;
		background: linear-gradient(160deg, #6a1f14, #4a140d);
		box-shadow:
			0 3px 0 #e9dcbb,
			0 5px 0 #d9c9a3,
			0 7px 0 #3a0f09,
			0 30px 30px -10px rgba(0, 0, 0, 0.6);
	}
	.pages {
		position: relative;
		display: grid;
		grid-template-columns: 1fr;
		color: #2c2118;
	}
	.page {
		display: flex;
		flex-direction: column;
		padding: 1.1em 1.2em 1.2em;
		background:
			url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.8' numOctaves='2'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='.05'/%3E%3C/svg%3E"),
			#fbf6e9;
		transition: background-color 0.2s;
	}
	.page.left {
		align-items: center;
		text-align: center;
		border-radius: 3px 3px 0 0;
	}
	.page.right {
		border-radius: 0 0 3px 3px;
		box-shadow: inset 0 14px 16px -14px rgba(60, 35, 10, 0.4);
	}
	.pages:hover .page {
		background-color: #fffbf1;
	}
	.polaroid {
		width: 6.2em;
		height: 6.2em;
		padding: 0.35em 0.35em 1em;
		background: #fff;
		object-fit: cover;
		box-shadow: 0 0.5em 0.8em -0.4em rgba(0, 0, 0, 0.5);
		rotate: -3deg;
	}
	.finding {
		display: flex;
		align-items: baseline;
		gap: 0.6em;
		margin-top: 0.55em;
		color: #8e1d12;
		font-size: 0.95em;
	}
	.finding-field {
		flex: none;
		width: 4.2em;
		padding: 0.1em 0.3em;
		background: #2c2118;
		color: #f4ead2;
		font-size: 0.62em;
		letter-spacing: 0.1em;
		text-align: center;
		white-space: nowrap;
	}
	.bookmarks {
		position: absolute;
		top: 1.2em;
		right: -46px;
		display: grid;
		gap: 0.45em;
	}
	.bookmark {
		display: block;
		width: 54px;
		padding: 0.35em 0.5em 0.35em 0.9em;
		border-radius: 0 4px 4px 0;
		background: var(--c);
		color: #fff;
		font-size: 0.72em;
		letter-spacing: 0.05em;
		white-space: nowrap;
		box-shadow: 2px 3px 4px rgba(0, 0, 0, 0.35);
		transition: translate 0.2s;
	}
	.bookmark:hover,
	.bookmark:focus-visible {
		translate: 8px 0;
	}
	.hint .bookmark {
		animation: peek 0.9s ease-in-out calc(0.6s + var(--i) * 0.12s) 2;
	}
	@keyframes peek {
		50% {
			translate: 10px 0;
		}
	}

	/* ── Lights off ── */
	.night {
		position: absolute;
		inset: 0;
		z-index: 5;
		background: rgba(6, 5, 10, 0.55);
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.5s;
	}
	.is-dark .night {
		opacity: 1;
	}

	/* ════ Wide screens: the whole office in one view ════ */
	@media (min-width: 900px) {
		.study {
			height: max(680px, 100svh);
			container-type: size;
		}
		.scene {
			position: absolute;
			inset: 0;
			display: block;
			padding: 0;
		}
		/* Things lying on the desk share one camera angle. */
		.flat {
			transform: perspective(1200px) rotateX(46deg);
			transform-origin: center bottom;
		}

		/* ── Wall ── */
		.wall {
			bottom: 38%;
		}
		.wall::after {
			/* walnut wainscot under the chair rail */
			content: '';
			position: absolute;
			right: 0;
			bottom: 0;
			left: 0;
			height: 26%;
			border-top: 6px solid #2a1a0f;
			background:
				repeating-linear-gradient(
					90deg,
					transparent 0 2cqw,
					rgba(0, 0, 0, 0.25) 2cqw calc(2cqw + 2px),
					rgba(255, 220, 170, 0.06) calc(2cqw + 2px) calc(2cqw + 4px),
					transparent calc(2cqw + 4px) 14cqw
				),
				linear-gradient(180deg, #4a2e1b, #3b2516);
			box-shadow: 0 -2px 0 rgba(255, 220, 170, 0.12);
		}
		.wall-clock {
			position: absolute;
			top: 6cqh;
			left: 13cqw;
			display: block;
			width: 9cqh;
			filter: drop-shadow(0 8px 8px rgba(0, 0, 0, 0.45));
		}
		.window {
			position: absolute;
			top: 6cqh;
			left: 78cqw;
			display: block;
			width: 16cqw;
			height: 36cqh;
			padding: 0.7cqw;
			border-radius: 2px;
			background: linear-gradient(180deg, #3b2516, #2a1a0f);
			box-shadow:
				inset 0 0 0 2px rgba(255, 220, 170, 0.08),
				0 16px 24px -10px rgba(0, 0, 0, 0.6);
		}
		.sky {
			position: absolute;
			inset: 0.7cqw;
			overflow: hidden;
			background: linear-gradient(180deg, #a9c6d8, #e9dcc0 85%);
			transition: background 0.6s;
		}
		.sky-dawn .sky {
			background: linear-gradient(180deg, #56628f, #d99a78 70%, #f2c995);
		}
		.sky-dusk .sky {
			background: linear-gradient(180deg, #34385f, #b9664f 70%, #e39a62);
		}
		.sky-night .sky {
			background: linear-gradient(180deg, #0c1424, #1d2a44 80%);
		}
		.sun {
			position: absolute;
			top: 12%;
			left: 16%;
			width: 16%;
			aspect-ratio: 1;
			border-radius: 50%;
			background: #fff4d6;
			box-shadow: 0 0 34px 12px rgba(255, 240, 200, 0.55);
			transition:
				top 0.6s,
				opacity 0.6s;
		}
		.sky-dawn .sun,
		.sky-dusk .sun {
			top: 46%;
			background: #ffcf8a;
			box-shadow: 0 0 30px 10px rgba(255, 170, 90, 0.5);
		}
		.sky-dusk .sun {
			left: auto;
			right: 16%;
		}
		.sky-night .sun {
			opacity: 0;
		}
		.moon {
			position: absolute;
			top: 14%;
			right: 18%;
			width: 18%;
			aspect-ratio: 1;
			border-radius: 50%;
			background: #fff6cf;
			opacity: 0;
			box-shadow: 0 0 30px 8px rgba(255, 246, 207, 0.35);
			transition: opacity 0.6s;
		}
		.sky-night .moon {
			opacity: 1;
		}
		.skyline {
			position: absolute;
			right: 0;
			bottom: 0;
			left: 0;
			height: 42%;
			background: linear-gradient(
				90deg,
				transparent 0 4%,
				#6d7480 4% 18%,
				transparent 18% 22%,
				#5c6370 22% 30%,
				transparent 30% 34%,
				#737a86 34% 52%,
				transparent 52% 56%,
				#5c6370 56% 70%,
				transparent 70% 74%,
				#6d7480 74% 92%,
				transparent 92%
			);
			clip-path: polygon(
				0 40%,
				4% 40%,
				4% 10%,
				18% 10%,
				18% 30%,
				22% 30%,
				22% 50%,
				30% 50%,
				30% 20%,
				34% 20%,
				34% 0,
				52% 0,
				52% 35%,
				56% 35%,
				56% 15%,
				70% 15%,
				70% 45%,
				74% 45%,
				74% 25%,
				92% 25%,
				92% 55%,
				100% 55%,
				100% 100%,
				0 100%
			);
		}
		.sky-dusk .skyline,
		.sky-night .skyline {
			background:
				radial-gradient(circle, #ffd27a 0 1.5px, transparent 2px) 0 0 / 9px 11px,
				#141b29;
		}
		.blinds {
			position: absolute;
			inset: 0.7cqw 0.7cqw 42% 0.7cqw;
			background: repeating-linear-gradient(
				180deg,
				#e6dcc4 0 7px,
				#b9ab8c 7px 8px,
				transparent 8px 13px
			);
			box-shadow: 0 6px 8px -4px rgba(0, 0, 0, 0.4);
		}
		.is-dark .blinds {
			background: repeating-linear-gradient(
				180deg,
				#8f8774 0 7px,
				#5e5748 7px 8px,
				transparent 8px 13px
			);
		}
		.mullion {
			position: absolute;
			top: 0.7cqw;
			bottom: 0.7cqw;
			left: 50%;
			width: 0.5cqw;
			margin-left: -0.25cqw;
			background: #2a1a0f;
		}
		.sill {
			position: absolute;
			right: -0.8cqw;
			bottom: -1.1cqh;
			left: -0.8cqw;
			height: 1.6cqh;
			border-radius: 2px;
			background: linear-gradient(180deg, #5a3a22, #3b2516);
		}
		/* Light through the blinds, across the wall and the desk */
		.slats-light {
			position: absolute;
			inset: 30cqh 0 0 34cqw;
			z-index: 5;
			display: block;
			background: repeating-linear-gradient(
				158deg,
				transparent 0 2.2cqh,
				rgba(255, 226, 160, 0.1) 2.2cqh 3.4cqh
			);
			opacity: 0.8;
			mask-image: linear-gradient(200deg, #000 10%, transparent 75%);
			pointer-events: none;
			mix-blend-mode: screen;
			transition:
				background 0.5s,
				opacity 0.5s;
		}
		.sky-dawn .slats-light,
		.sky-dusk .slats-light {
			background: repeating-linear-gradient(
				158deg,
				transparent 0 2.2cqh,
				rgba(255, 170, 110, 0.12) 2.2cqh 3.4cqh
			);
		}
		.sky-night .slats-light {
			background: repeating-linear-gradient(
				158deg,
				transparent 0 2.2cqh,
				rgba(150, 180, 255, 0.13) 2.2cqh 3.4cqh
			);
		}
		/* With the room light off, whatever comes through the blinds shows up more. */
		.is-dark .slats-light {
			opacity: 1;
		}
		.sky-night:not(.is-dark) .slats-light {
			opacity: 0.35;
		}
		.whiteboard {
			position: absolute;
			top: 5cqh;
			left: 50%;
			width: 38cqw;
			height: 43cqh;
			translate: -50% 0;
		}
		.wb-strings.wide {
			display: block;
		}
		.wb-sticky {
			top: 12px;
			bottom: auto;
		}
		.wb-strings.narrow {
			display: none;
		}
		.wb-suspect {
			top: 50%;
			width: 21%;
		}
		.wb-slot {
			top: var(--y);
			left: var(--x);
			width: 30%;
		}
		.wb-name {
			font-size: clamp(13px, 1.05cqw, 17px);
		}
		.face {
			width: clamp(28px, 2.4cqw, 38px);
			height: clamp(28px, 2.4cqw, 38px);
		}
		.switch {
			top: 25cqh;
			right: auto;
			left: 72cqw;
			width: clamp(30px, 2.4cqw, 44px);
		}
		.switch-note {
			display: block;
			margin-top: 8px;
			padding: 1px 8px 3px;
			background: #f8f1df;
			color: #8e1d12;
			font-size: 13px;
			white-space: nowrap;
			box-shadow: 0 4px 8px -4px rgba(0, 0, 0, 0.5);
			rotate: 4deg;
		}

		/* ── Desk ── */
		.desk {
			position: absolute;
			top: 62%;
			right: 0;
			bottom: 0;
			left: 0;
			display: block;
			background:
				linear-gradient(180deg, transparent 90%, #2a1a0f 90%, #3b2516 91%, #2a1a0f),
				repeating-linear-gradient(177deg, rgba(30, 15, 5, 0.12) 0 2px, transparent 2px 21px),
				linear-gradient(180deg, #7a4428, #5e331d 90%);
			box-shadow:
				inset 0 2px 0 rgba(255, 210, 160, 0.25),
				0 -18px 30px -16px rgba(0, 0, 0, 0.7);
		}
		.mat {
			position: absolute;
			bottom: 5cqh;
			left: 4cqw;
			display: block;
			width: 70cqw;
			height: 34cqh;
			border: 1.2cqh solid #4a2e1b;
			border-radius: 3px;
			background:
				radial-gradient(
					circle at 78% 30%,
					transparent 2.2cqh,
					rgba(60, 35, 15, 0.25) 2.4cqh,
					transparent 2.9cqh
				),
				linear-gradient(160deg, #2f4a3a, #22382b);
			box-shadow:
				inset 0 0 0 2px rgba(184, 144, 79, 0.45),
				0 8px 14px -6px rgba(0, 0, 0, 0.6);
		}
		.monitor {
			position: absolute;
			bottom: 36cqh;
			left: 3cqw;
			width: min(29cqw, 56cqh);
			transform: perspective(1400px) rotateY(9deg);
			transform-origin: left center;
		}
		.screen {
			min-height: 0;
			aspect-ratio: 16 / 10;
			font-size: clamp(11px, 0.88cqw, 14px);
		}
		.keyboard {
			position: absolute;
			bottom: 11cqh;
			left: 7.5cqw;
			z-index: 4;
			display: block;
			width: 23cqw;
			font-size: clamp(6px, 0.5cqw, 9px);
		}
		.mouse {
			position: absolute;
			bottom: 13cqh;
			left: 32.5cqw;
			z-index: 4;
			display: block;
			width: 2.2cqw;
			aspect-ratio: 0.62;
			border-radius: 50% 50% 46% 46% / 40% 40% 60% 60%;
			background: linear-gradient(180deg, #3a3632, #1f1d1a);
			box-shadow: 0 0.8cqh 0.8cqh rgba(0, 0, 0, 0.5);
		}
		.mouse span {
			position: absolute;
			top: 12%;
			left: 50%;
			width: 1px;
			height: 26%;
			background: rgba(255, 255, 255, 0.25);
		}
		.folder {
			position: absolute;
			bottom: 12cqh;
			left: 41cqw;
			display: block;
			width: 28cqw;
			height: 28cqh;
			border-radius: 2px 6px 3px 3px;
			background: linear-gradient(160deg, #e2c98f, #cfb173);
			box-shadow: 0 6px 10px -4px rgba(0, 0, 0, 0.5);
			rotate: -7deg;
		}
		.folder::before {
			content: '';
			position: absolute;
			top: -2.4cqh;
			left: 8%;
			width: 26%;
			height: 2.6cqh;
			border-radius: 4px 4px 0 0;
			background: #d9bf83;
		}
		.stamp {
			position: absolute;
			top: 8%;
			right: 6%;
			padding: 0.2em 0.6em;
			border: 3px double #b3261e;
			color: #b3261e;
			font-family: var(--font-display);
			font-size: clamp(12px, 1.2cqw, 20px);
			letter-spacing: 0.3em;
			opacity: 0.8;
			rotate: 12deg;
		}
		.book {
			position: absolute;
			bottom: 6cqh;
			left: 42cqw;
			z-index: 4;
			width: 30cqw;
			font-size: clamp(11px, 0.95cqw, 16px);
			transform: perspective(1400px) rotateX(24deg);
			transform-origin: center bottom;
			transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
		}
		.book:hover,
		.book:focus-within {
			transform: perspective(1400px) rotateX(8deg) translateY(-1.5cqh);
		}
		.book-3d {
			margin-right: 0;
		}
		.pages {
			grid-template-columns: 1fr 1fr;
			aspect-ratio: 1.55;
		}
		.page.left {
			justify-content: center;
			border-radius: 3px 0 0 3px;
			box-shadow: inset -22px 0 26px -22px rgba(60, 35, 10, 0.45);
		}
		.page.right {
			border-radius: 0 3px 3px 0;
			box-shadow: inset 22px 0 26px -22px rgba(60, 35, 10, 0.45);
		}
		.bookmarks {
			right: calc(-4.6em + 8px);
		}
		.bookmark {
			width: 5.2em;
			font-size: 0.8em;
		}
		.magnifier {
			position: absolute;
			bottom: 15cqh;
			left: 77cqw;
			z-index: 4;
			display: block;
			width: 11cqw;
			rotate: -18deg;
			filter: drop-shadow(0 0.8cqh 0.6cqh rgba(0, 0, 0, 0.5));
		}
		.mug {
			position: absolute;
			bottom: 31cqh;
			left: 88cqw;
			z-index: 4;
			display: block;
			width: 3.6cqw;
			height: 5.6cqh;
			border-radius: 2px 2px 8px 8px;
			background: linear-gradient(90deg, #d9d1bd, #fbf6ea 40%, #c9bfa8);
			box-shadow: 0 8px 8px -4px rgba(0, 0, 0, 0.5);
		}
		.mug::after {
			content: '';
			position: absolute;
			top: 22%;
			right: -34%;
			width: 40%;
			height: 50%;
			border: 3px solid #d2c9b4;
			border-left: 0;
			border-radius: 0 10px 10px 0;
		}
		.steam {
			position: absolute;
			bottom: 110%;
			left: 30%;
			width: 40%;
			height: 3cqh;
			border-left: 2px solid rgba(255, 255, 255, 0.5);
			border-radius: 50%;
			animation: steam 3.6s ease-in-out infinite;
		}
		@keyframes steam {
			0%,
			100% {
				opacity: 0;
				transform: translateY(4px) skewX(0);
			}
			50% {
				opacity: 1;
				transform: translateY(-6px) skewX(12deg);
			}
		}
		.nameplate {
			position: absolute;
			bottom: 3cqh;
			left: 78cqw;
			z-index: 4;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			width: 15cqw;
			height: 6.5cqh;
			border: 2px solid #8a6a36;
			border-radius: 2px;
			background: linear-gradient(180deg, #e8cf8f, #b8904f 60%, #9c7739);
			color: #2a1a0f;
			box-shadow:
				0 0.9cqh 0 #2a1a0f,
				0 1.6cqh 1.2cqh rgba(0, 0, 0, 0.5);
		}
		.nameplate span:first-child {
			font-size: clamp(14px, 1.5cqw, 24px);
			letter-spacing: 0.4em;
			line-height: 1;
		}
		.nameplate span:last-child {
			margin-top: 0.3em;
			font-size: clamp(7px, 0.6cqw, 10px);
			letter-spacing: 0.25em;
		}

		/* ── Lights off: the screen, the window and its slats stay lit ── */
		.night {
			background: rgba(6, 5, 10, 0.7);
			mask-image:
				radial-gradient(ellipse 22cqw 30cqh at 19% 42%, rgba(0, 0, 0, 0.35) 20%, #000 100%),
				radial-gradient(ellipse 20cqw 18cqh at 57% 80%, rgba(0, 0, 0, 0.5) 25%, #000 100%),
				radial-gradient(ellipse 13cqw 24cqh at 85% 24%, rgba(0, 0, 0, 0.3) 30%, #000 100%);
			mask-composite: intersect;
		}
		/* Daytime with the light off: still dim, but the sun gets in. */
		.sky-day .night,
		.sky-dawn .night,
		.sky-dusk .night {
			background: rgba(6, 5, 10, 0.5);
		}
	}

	/* Narrow laptops: the computer and the book take more of the desk. */
	@media (min-width: 900px) and (max-width: 1199px) {
		.monitor {
			left: 3cqw;
			width: min(34cqw, 60cqh);
		}
		.keyboard {
			left: 5cqw;
			width: 26cqw;
		}
		.mouse {
			left: 33cqw;
		}
		.book {
			left: 41cqw;
			width: 36cqw;
		}
		.folder {
			left: 40cqw;
			width: 32cqw;
		}
		.whiteboard {
			width: 36cqw;
		}
		.wb-desc {
			display: none;
		}
		.wall-clock,
		.magnifier,
		.nameplate,
		.mug {
			display: none;
		}
		.window {
			left: 80cqw;
			width: 16cqw;
		}
		.switch {
			left: 73.5cqw;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.scene,
		.key,
		.lever,
		.book {
			transition: none;
		}
		.steam,
		.hint .bookmark,
		.hint .plate {
			animation: none;
		}
	}
</style>
