<script lang="ts">
	import './layout.css';
	import type { Pathname } from '$app/types';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import favicon from '$lib/assets/favicon.svg';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import Navbar from '$lib/components/Navbar.svelte';
	import { theme } from '$lib/theme.svelte';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();

	$effect(() => {
		theme.sync();
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

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<svelte:window onkeydown={handleKeydown} />

<Navbar user={data.user} />

<main>
	{@render children()}
</main>

<div style="display:none">
	{#each locales as locale (locale)}
		<a href={resolve(localizeHref(page.url.pathname, { locale }) as Pathname)}>{locale}</a>
	{/each}
</div>
