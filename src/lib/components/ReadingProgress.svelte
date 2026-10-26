<!--
	A thin red thread across the top that fills as you read, and — if you left a
	post half-way — a slip at the bottom offering to take you back to where you
	stopped. Positions are kept per post in localStorage, on this device only.
-->
<script lang="ts">
	import { fly } from 'svelte/transition';
	import X from '@lucide/svelte/icons/x';

	let { path }: { path: string } = $props();

	let progress = $state(0);
	let resumeAt = $state<number | null>(null);

	const storeKey = (p: string) => `reading:${p}`;

	function body(): HTMLElement | null {
		return document.querySelector('article .prose');
	}

	/** 0 → 1 through the article text, measured at a reading line 30% down the screen. */
	function measure(el: HTMLElement) {
		const rect = el.getBoundingClientRect();
		const line = window.innerHeight * 0.3;
		return Math.min(1, Math.max(0, (line - rect.top) / Math.max(1, rect.height)));
	}

	function jumpTo(p: number) {
		const el = body();
		if (!el) return;
		const rect = el.getBoundingClientRect();
		window.scrollTo({
			top: window.scrollY + rect.top + p * rect.height - window.innerHeight * 0.3,
			behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
		});
		resumeAt = null;
	}

	$effect(() => {
		const key = storeKey(path);
		progress = 0;
		resumeAt = null;

		try {
			const saved = JSON.parse(localStorage.getItem(key) ?? 'null') as { p: number } | null;
			if (saved && saved.p > 0.1 && saved.p < 0.92 && window.scrollY < 200) resumeAt = saved.p;
		} catch {
			// Storage blocked or garbled; just don't offer to resume.
		}

		let frame = 0;
		let lastSave = 0;
		const onScroll = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				const el = body();
				if (!el) return;
				progress = measure(el);
				if (resumeAt !== null && progress > 0.05) resumeAt = null;
				const now = Date.now();
				if (now - lastSave < 1000) return;
				lastSave = now;
				try {
					if (progress >= 0.92) localStorage.removeItem(key);
					else if (progress > 0.08)
						localStorage.setItem(key, JSON.stringify({ p: progress, t: now }));
				} catch {
					// Not saving is fine.
				}
			});
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll, { passive: true });
		const hide = setTimeout(() => (resumeAt = null), 12000);
		return () => {
			cancelAnimationFrame(frame);
			clearTimeout(hide);
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
		};
	});
</script>

<div
	class="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-accent shadow-[0_0_8px_rgba(179,54,43,0.6)]"
	style="transform: scaleX({progress})"
	role="progressbar"
	aria-label="閱讀進度"
	aria-valuemin="0"
	aria-valuemax="100"
	aria-valuenow={Math.round(progress * 100)}
></div>

{#if resumeAt !== null}
	<div
		transition:fly={{ y: 24, duration: 260 }}
		class="fixed inset-x-0 bottom-5 z-50 mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-1 rounded-full border border-border-case bg-surface/95 py-1 pr-1 pl-4 text-sm shadow-[0_12px_30px_-12px_rgba(0,0,0,0.5)] backdrop-blur"
	>
		<span class="text-ink-muted">上次讀到 {Math.round(resumeAt * 100)}%</span>
		<button
			type="button"
			onclick={() => jumpTo(resumeAt!)}
			class="ml-2 rounded-full bg-accent px-3 py-1 text-white transition hover:bg-accent-strong"
		>
			繼續閱讀
		</button>
		<button
			type="button"
			onclick={() => (resumeAt = null)}
			aria-label="關閉"
			class="rounded-full p-1.5 text-ink-muted hover:text-ink"><X class="size-3.5" /></button
		>
	</div>
{/if}
