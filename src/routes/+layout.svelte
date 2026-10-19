<script lang="ts">
	import './layout.css';
	import { resolve } from '$app/paths';
	import { goto, onNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import favicon from '$lib/assets/favicon.svg';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import CabinetNav from '$lib/components/CabinetNav.svelte';
	import DetectiveDepth from '$lib/components/DetectiveDepth.svelte';
	import SearchPalette from '$lib/components/SearchPalette.svelte';
	import SiteFooter from '$lib/components/SiteFooter.svelte';
	import GlobalFx from '$lib/components/GlobalFx.svelte';
	import { theme } from '$lib/theme.svelte';
	import { SITE_TITLE } from '$lib/site';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();

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
	<link rel="icon" href={favicon} />
	<link rel="alternate" type="application/rss+xml" title={SITE_TITLE} href="/rss.xml" />
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<DetectiveDepth />
<GlobalFx />

<CabinetNav user={data.user} />
<SearchPalette />

<main class="lg:pl-10">
	{@render children()}
</main>

{#if !page.url.pathname.startsWith('/admin')}
	<SiteFooter />
{/if}

<div style="display:none">
	{#each locales as locale (locale)}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- localizeHref already yields a full app path -->
		<a href={localizeHref(page.url.pathname, { locale })}>{locale}</a>
	{/each}
</div>
