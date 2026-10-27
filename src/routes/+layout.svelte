<script lang="ts">
	import './layout.css';
	import './intro.css';
	import { resolve } from '$app/paths';
	import { afterNavigate, goto, onNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import CaseChrome from '$lib/components/CaseChrome.svelte';
	import DetectiveDepth from '$lib/components/DetectiveDepth.svelte';
	import SearchPalette from '$lib/components/SearchPalette.svelte';
	import CaseEnd from '$lib/components/CaseEnd.svelte';
	import GlobalFx from '$lib/components/GlobalFx.svelte';
	import { theme } from '$lib/theme.svelte';
	import { bookmarks, drawerFor, isEntryActive } from '$lib/site-nav';
	import { SITE_DESCRIPTION, SITE_TITLE } from '$lib/site';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();

	// The homepage is Liam's office; every other page is a page of the book on
	// his desk, seen up close: the same red cover, the same bookmarks.
	const onPaper = $derived(page.url.pathname !== '/');
	const section = $derived(drawerFor(page.url.pathname));
	const openMark = $derived(bookmarks.find((b) => b.id === section?.id));
	// The chapter, as the cover's gold foil says it: 參 · 作品收藏.
	const chapterTitle = $derived(
		page.url.pathname.startsWith('/admin')
			? '後台'
			: section?.no
				? `${section.no} · ${section.label}`
				: (section?.label ?? '卷宗')
	);
	// Dust drifting in the light from the blinds: fixed spots so server and client agree.
	const motes = Array.from({ length: 18 }, (_, i) => ({
		x: (i * 53 + 11) % 100,
		y: (i * 37 + 5) % 100,
		d: 16 + ((i * 7) % 14),
		s: 2 + (i % 3),
		delay: -((i * 1.7) % 20)
	}));

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

	$effect(() => {
		theme.sync();
	});

	// Page changes via the View Transitions API, moving the camera in the
	// office: from the desk into the book ("into"), out of the book back to the
	// desk ("out"), or turning a page inside it ("turn"). Falls back to an
	// instant swap on browsers without support; reduced motion skips the
	// animation (layout.css).
	//
	// Every move also carries the red pushpin: it leaves from where you clicked
	// and flies to the pin on the next page (.pin-target), pinning it down.
	let lastClick: { x: number; y: number } | null = null;
	function onClickCapture(e: MouseEvent) {
		lastClick = { x: e.clientX, y: e.clientY };
	}
	onNavigate((navigation) => {
		if (!document.startViewTransition) return;
		const from = navigation.from?.url.pathname;
		const to = navigation.to?.url.pathname;
		if (from === to) return;
		const root = document.documentElement;
		root.dataset.nav = to === '/' ? 'out' : from === '/' ? 'into' : 'turn';

		let pin: HTMLElement | null = null;
		if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			const at = lastClick ?? { x: innerWidth / 2, y: innerHeight / 2 };
			pin = document.createElement('span');
			pin.className = 'travel-pin';
			pin.style.left = `${at.x}px`;
			pin.style.top = `${at.y}px`;
			document.body.append(pin);
			root.dataset.traveling = '';
		}
		lastClick = null;

		return new Promise((resolve) => {
			const t = document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
				pin?.remove();
				delete root.dataset.traveling;
			});
			t.finished.finally(() => {
				delete root.dataset.nav;
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
	<meta name="theme-color" content="#fdfaf3" media="(prefers-color-scheme: light)" />
	<meta name="theme-color" content="#120d0a" media="(prefers-color-scheme: dark)" />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- static JSON-LD built from site constants -->
	{@html structuredData}
	<link rel="alternate" type="application/rss+xml" title={SITE_TITLE} href="/rss.xml" />
	<link rel="webmention" href="/webmention" />
</svelte:head>

<svelte:window onkeydown={handleKeydown} onclickcapture={onClickCapture} />

<DetectiveDepth />
<GlobalFx />

<CaseChrome user={data.user} unread={data.unread} />
<SearchPalette />

<main class:desk={onPaper}>
	{#if onPaper}
		<!-- Light through the office blinds, the colour of the real time of day (GlobalFx). -->
		<div class="blind-light" aria-hidden="true">
			{#each motes as m, i (i)}
				<i style="--x: {m.x}%; --y: {m.y}%; --d: {m.d}s; --s: {m.s}px; --delay: {m.delay}s"></i>
			{/each}
		</div>
		<div class="file-desk">
			<div class="case-book">
				<p class="book-band" aria-hidden="true">
					<span>LIAM · 調查檔案</span>
					<span>{chapterTitle}</span>
				</p>
				<div class="case-paper">
					<span class="page-pin pin-target" aria-hidden="true"></span>
					{#if openMark}
						<span class="page-ribbon" style="--c: {openMark.color}" aria-hidden="true"></span>
					{/if}
					{#if section?.cards.length}
						<!-- What else is in this chapter, typed along the top of the page -->
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
					{@render children()}
					{#if !page.url.pathname.startsWith('/admin')}<CaseEnd />{/if}
				</div>
				<!-- The book's bookmarks, still in it: the sections, the open one pulled out. -->
				<nav class="paper-marks" aria-label="書籤：網站的各個部分">
					<div class="paper-marks-inner">
						<!-- eslint-disable svelte/no-navigation-without-resolve -- static app paths from site-nav -->
						{#each bookmarks as b (b.id)}
							<a
								href={b.href}
								class="paper-mark"
								class:is-open={section?.id === b.id}
								aria-current={section?.id === b.id ? 'true' : undefined}
								style="--c: {b.color}">{b.label}</a
							>
						{/each}
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
					</div>
				</nav>
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
