<script lang="ts">
	import type { Snippet } from 'svelte';

	interface TocItem {
		id: string;
		text: string;
		level: number;
	}

	let {
		containerEl,
		extraLinks = [],
		children
	}: {
		containerEl: HTMLElement | undefined;
		extraLinks?: { label: string; href: string }[];
		children?: Snippet;
	} = $props();

	let toc = $state<TocItem[]>([]);
	let activeId = $state<string | null>(null);
	let progress = $state(0);

	const minLevel = $derived(toc.length ? Math.min(...toc.map((item) => item.level)) : 1);

	$effect(() => {
		if (!containerEl) return;

		const headings = Array.from(containerEl.querySelectorAll('h1, h2, h3, h4')) as HTMLElement[];
		toc = headings
			.filter((heading) => heading.id)
			.map((heading) => ({
				id: heading.id,
				text: heading.textContent ?? '',
				level: Number(heading.tagName[1])
			}));

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						activeId = entry.target.id;
						break;
					}
				}
			},
			{ rootMargin: '0px 0px -70% 0px', threshold: 0 }
		);
		headings.forEach((heading) => observer.observe(heading));

		function handleScroll() {
			const doc = document.documentElement;
			const scrollable = doc.scrollHeight - doc.clientHeight;
			progress = scrollable > 0 ? Math.min(100, Math.round((doc.scrollTop / scrollable) * 100)) : 0;
		}
		window.addEventListener('scroll', handleScroll, { passive: true });
		handleScroll();

		return () => {
			observer.disconnect();
			window.removeEventListener('scroll', handleScroll);
		};
	});
</script>

<aside
	class="flex flex-col gap-4 lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto"
>
	{#if toc.length}
		<div>
			<div class="h-1 w-full overflow-hidden rounded-full bg-surface-alt">
				<div
					class="h-full rounded-full bg-accent transition-all duration-150"
					style="width: {progress}%"
				></div>
			</div>
			<p class="mt-1 text-xs text-ink-muted">已閱讀 {progress}%</p>
		</div>

		<nav aria-label="目錄" class="flex flex-col gap-1 border-l border-border-case pl-3 text-sm">
			{#each toc as item (item.id)}
				<a
					href="#{item.id}"
					class="truncate transition {activeId === item.id
						? 'font-medium text-ink'
						: 'text-ink-muted hover:text-ink'}"
					style="padding-left: {(item.level - minLevel) * 0.75}rem"
				>
					{item.text}
				</a>
			{/each}
			<!-- eslint-disable svelte/no-navigation-without-resolve -- same-page fragment anchors (e.g. #comments), not app routes -->
			{#each extraLinks as link (link.href)}
				<a
					href={link.href}
					class="mt-1 border-t border-border-case pt-2 text-ink-muted hover:text-ink"
				>
					{link.label}
				</a>
			{/each}
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		</nav>
	{/if}

	{#if children}
		<div class="flex flex-col gap-2 border-t border-border-case pt-4">
			{@render children()}
		</div>
	{/if}
</aside>
