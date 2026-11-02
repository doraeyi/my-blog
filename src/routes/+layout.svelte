<script lang="ts">
	import './layout.css';
	import './intro.css';
	import { resolve } from '$app/paths';
	import { afterNavigate, goto, onNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import SiteBar from '$lib/components/SiteBar.svelte';
	import BoardBackdrop from '$lib/components/BoardBackdrop.svelte';
	import ReadingThread from '$lib/components/ReadingThread.svelte';
	import DetectiveDepth from '$lib/components/DetectiveDepth.svelte';
	import SearchPalette from '$lib/components/SearchPalette.svelte';
	import CaseEnd from '$lib/components/CaseEnd.svelte';
	import GlobalFx from '$lib/components/GlobalFx.svelte';
	import { theme } from '$lib/theme.svelte';
	import { chapters, drawerFor, isEntryActive } from '$lib/site-nav';
	import { SITE_DESCRIPTION, SITE_TITLE } from '$lib/site';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();

	// The homepage is the case board; every other page is one sheet pinned to it.
	const onPaper = $derived(page.url.pathname !== '/');
	const section = $derived(drawerFor(page.url.pathname));
	// What the sheet is, typed across its top: CH.03 · 參 · 文章.
	const sheetLabel = $derived.by(() => {
		if (page.url.pathname.startsWith('/admin')) return '後台';
		if (!section) return '卷宗';
		const i = chapters.findIndex((c) => c.id === section.id);
		return i < 0
			? section.label
			: `CH.${String(i + 1).padStart(2, '0')} · ${section.no} · ${section.label}`;
	});

	// The sheet, for the red thread down its margin.
	let sheetEl: HTMLElement | undefined = $state();

	// WebSite + Person JSON-LD so search engines pick up the site name and the
	// seal as its logo.
	const structuredData = $derived(
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@graph': [
				{
					'@type': 'WebSite',
					name: SITE_TITLE,
					alternateName: 'Liam 偵探手記',
					url: page.url.origin,
					description: SITE_DESCRIPTION,
					inLanguage: 'zh-Hant-TW'
				},
				{
					'@type': 'Person',
					name: 'Liam',
					url: page.url.origin,
					jobTitle: '前端工程師',
					image: `${page.url.origin}/icon-512.png`,
					logo: `${page.url.origin}/icon-512.png`
				}
			]
		}).replace(/</g, '\\u003c')}</` + `script>`
	);

	let themed = $state(false);
	$effect(() => {
		theme.sync();
		themed = true;
	});

	// Page changes via the View Transitions API: from the board into a sheet
	// ("into"), from a sheet back to the board ("out"), or swapping one sheet
	// for the next ("turn"). Falls back to an
	// instant swap on browsers without support, and for reduced motion (no
	// transition at all: even the browser's default one would still morph the
	// card into the sheet).
	//
	// Every move also carries the red pushpin: it leaves from where you clicked
	// and flies to the pin on the next page (.pin-target), pinning it down.
	//
	// Opening a card (on the board, or one pinned up on a page) takes that card
	// down and it becomes the next sheet: the card and the new .case-paper share
	// a view-transition name, so the card grows into the page.
	const CARD = '.card, .pin-card, .case-card, .case-map .node';
	let lastClick: { x: number; y: number } | null = null;
	let lastCard: HTMLElement | null = null;
	function onClickCapture(e: MouseEvent) {
		lastClick = { x: e.clientX, y: e.clientY };
		const link = (e.target as Element | null)?.closest('a');
		lastCard = link?.closest<HTMLElement>(CARD) ?? null;
	}
	onNavigate((navigation) => {
		if (
			!document.startViewTransition ||
			window.matchMedia('(prefers-reduced-motion: reduce)').matches
		)
			return;
		const from = navigation.from?.url.pathname;
		const to = navigation.to?.url.pathname;
		if (from === to) return;
		const root = document.documentElement;
		root.dataset.nav = to === '/' ? 'out' : from === '/' ? 'into' : 'turn';

		const at = lastClick ?? { x: innerWidth / 2, y: innerHeight / 2 };
		const pin = document.createElement('span');
		pin.className = 'travel-pin';
		pin.style.left = `${at.x}px`;
		pin.style.top = `${at.y}px`;
		document.body.append(pin);
		root.dataset.traveling = '';
		lastClick = null;

		// Into a page: the clicked card becomes the sheet. Back to the board: the
		// sheet goes back to its card (the one for this file, or this chapter's).
		const back = to === '/' && from !== '/';
		const fromEl = back
			? document.querySelector<HTMLElement>('.case-paper')
			: lastCard?.isConnected
				? lastCard
				: null;
		lastCard = null;
		let toEl: HTMLElement | null = null;
		if (fromEl) {
			fromEl.style.viewTransitionName = 'case-file';
			root.dataset.morph = back ? 'back' : '';
		}
		const boardCard = (path: string) => {
			const cards = [...document.querySelectorAll<HTMLElement>('.board a.card')];
			const top = `/${path.split('/')[1]}`;
			return (
				cards.find((c) => c.getAttribute('href') === path) ??
				cards.find((c) => c.getAttribute('href')?.split(/[?#]/)[0] === top) ??
				null
			);
		};

		return new Promise((resolve) => {
			const t = document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
				pin?.remove();
				delete root.dataset.traveling;
				if (fromEl) {
					fromEl.style.viewTransitionName = '';
					toEl = back ? boardCard(from ?? '') : document.querySelector('.case-paper');
					if (toEl) toEl.style.viewTransitionName = 'case-file';
				}
			});
			// A transition the browser skips (a hidden tab, a click mid-transition)
			// rejects `ready`; the page still changes, so there's nothing to report.
			t.ready.catch(() => {});
			t.finished
				.catch(() => {})
				.finally(() => {
					delete root.dataset.nav;
					delete root.dataset.morph;
					if (fromEl) fromEl.style.viewTransitionName = '';
					if (toEl) toEl.style.viewTransitionName = '';
					pin?.remove();
					delete root.dataset.traveling;
				});
		});
	});

	// Traffic beacon: one per page view, with the outside referrer on the first
	// page of a visit. The owner's own browsing isn't counted.
	afterNavigate((nav) => {
		if (data.user?.role === 'Liam' || !nav.to) return;
		fetch('/api/hit', {
			method: 'POST',
			keepalive: true,
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				p: nav.to.url.pathname,
				r: nav.type === 'enter' ? document.referrer : ''
			})
		}).catch(() => {});
	});

	const DOUBLE_TAP_MS = 600;
	const SKIP_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A']);
	let lastSpaceAt = 0;

	// Hidden shortcut: double-tap spacebar (while not typing/focused on a control) to jump to
	// the admin entry point — there's no visible "admin" link on the public site.
	function handleKeydown(event: KeyboardEvent) {
		if (event.code !== 'Space') return;

		const target = event.target as HTMLElement | null;
		if (target && (SKIP_TAGS.has(target.tagName) || target.isContentEditable)) return;

		const now = Date.now();
		if (now - lastSpaceAt < DOUBLE_TAP_MS) {
			event.preventDefault();
			lastSpaceAt = 0;
			goto(resolve(data.user?.role === 'Liam' ? '/admin/projects' : '/login'));
		} else {
			lastSpaceAt = now;
		}
	}
</script>

<svelte:head>
	<link rel="icon" href="/favicon.ico" sizes="48x48" />
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
	<link rel="manifest" href="/site.webmanifest" />
	<!-- The browser chrome takes the board's colour: by the system setting until the
	     app knows the visitor's own choice, then by that. -->
	{#if themed}
		<meta name="theme-color" content={theme.current === 'dark' ? '#15110e' : '#ebe4d6'} />
	{:else}
		<meta name="theme-color" content="#ebe4d6" media="(prefers-color-scheme: light)" />
		<meta name="theme-color" content="#15110e" media="(prefers-color-scheme: dark)" />
	{/if}
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- static JSON-LD built from site constants -->
	{@html structuredData}
	<link rel="alternate" type="application/rss+xml" title={SITE_TITLE} href="/rss.xml" />
	<link rel="webmention" href="/webmention" />
</svelte:head>

<svelte:window onkeydown={handleKeydown} onclickcapture={onClickCapture} />

<DetectiveDepth />
<GlobalFx />

<BoardBackdrop />
<!-- For keyboards: the first Tab offers a way past the bar, straight to the page. -->
<a href="#main" class="skip-link">跳到內容</a>
<SiteBar user={data.user} unread={data.unread} />
<SearchPalette />

<main id="main" tabindex="-1" class:sheet-desk={onPaper}>
	{#if onPaper}
		<div class="sheet-wrap">
			<ReadingThread sheet={sheetEl} />
			<div bind:this={sheetEl} class="case-paper">
				<span class="page-pin pin-target" aria-hidden="true"></span>
				<div class="sheet-head">
					<p class="sheet-label">
						<span class="ch-tab" style="--c: {section?.color ?? '#8e1d12'}"></span>{sheetLabel}
					</p>
					{#if section?.cards.length}
						<!-- What else is in this chapter -->
						<nav class="chapter-entries" aria-label="{section.label}這一章">
							<!-- eslint-disable svelte/no-navigation-without-resolve -- static app paths (some with a query) from site-nav -->
							{#each section.cards as c (c.href)}
								{@const here = isEntryActive(page.url, c.href)}
								<a href={c.href} class:is-here={here} aria-current={here ? 'page' : undefined}
									>{c.label}</a
								>
							{/each}
							<!-- eslint-enable svelte/no-navigation-without-resolve -->
						</nav>
					{/if}
				</div>
				{@render children()}
				{#if !page.error && !page.url.pathname.startsWith('/admin')}<CaseEnd />{/if}
			</div>
		</div>
	{:else}
		{@render children()}
	{/if}
</main>

<div style="display:none">
	{#each locales as locale (locale)}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- localizeHref already yields a full app path -->
		<a href={localizeHref(page.url.pathname, { locale })}>{locale}</a>
	{/each}
</div>
