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
	import { drawerFor } from '$lib/site-nav';
	import { SITE_DESCRIPTION, SITE_TITLE } from '$lib/site';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();

	// The homepage is the evidence board itself; every other page is a sheet
	// pinned to that same cork board, under its section's label.
	const onPaper = $derived(page.url.pathname !== '/');
	const zone = $derived(
		page.url.pathname.startsWith('/admin')
			? '後台'
			: (drawerFor(page.url.pathname)?.label ?? '卷宗')
	);

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

	// Cross-fades between pages via the View Transitions API; falls back to an
	// instant swap on browsers without support. Browsers auto-disable the
	// animation (but keep the instant swap) for prefers-reduced-motion.
	onNavigate((navigation) => {
		if (!document.startViewTransition) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
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

<svelte:window onkeydown={handleKeydown} />

<DetectiveDepth />
<GlobalFx />

<CaseChrome user={data.user} unread={data.unread} />
<SearchPalette />

<main class:desk={onPaper}>
	{#if onPaper}
		<div class="cork">
			<span class="cork-zone">{zone}</span>
			<div class="case-paper">
				<span class="paper-tack" aria-hidden="true"></span>
				<span class="paper-tape left" aria-hidden="true"></span>
				<span class="paper-tape right" aria-hidden="true"></span>
				{@render children()}
				{#if !page.url.pathname.startsWith('/admin')}<CaseEnd />{/if}
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
