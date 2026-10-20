<!--
	Two page-wide effects driven from one place:
	- the dark-mode flashlight (a lamp-coloured pool of light under the cursor)
	- a reading-progress hairline on post pages
	Both write CSS custom properties only; the look lives in layout.css.
-->
<script lang="ts">
	import { page } from '$app/state';

	let light: HTMLDivElement | undefined = $state();
	let bar: HTMLDivElement | undefined = $state();

	const isPost = $derived(/^\/(blog|articles|moods)\/[^/]+\/?$/.test(page.url.pathname));

	$effect(() => {
		let frame = 0;
		const onMove = (e: PointerEvent) => {
			if (e.pointerType !== 'mouse') return;
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				light?.style.setProperty('--fx', `${e.clientX}px`);
				light?.style.setProperty('--fy', `${e.clientY}px`);
			});
		};
		window.addEventListener('pointermove', onMove, { passive: true });
		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener('pointermove', onMove);
		};
	});

	// Frame-rate guard: watch ~3s of frames after load; if this device can't hold
	// ~45fps, switch the site to light-effects mode (data-lite) and remember it.
	$effect(() => {
		const root = document.documentElement;
		if (root.dataset.lite === '1') return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const frames: number[] = [];
		let last = 0;
		let raf = 0;
		const startAt = performance.now() + 800; // skip the very first paint burst
		const tick = (t: number) => {
			if (document.hidden) return; // a background tab isn't a fair measurement
			if (t > startAt) {
				if (last) frames.push(t - last);
				last = t;
			}
			if (frames.length < 180) {
				raf = requestAnimationFrame(tick);
				return;
			}
			const sorted = [...frames].sort((a, b) => a - b);
			const median = sorted[Math.floor(sorted.length / 2)];
			if (median > 22) {
				root.dataset.lite = '1';
				try {
					localStorage.setItem('fx-lite', '1');
				} catch {
					// storage blocked — the guard simply runs again next visit
				}
			}
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	$effect(() => {
		if (!isPost) return;
		const onScroll = () => {
			const max = document.documentElement.scrollHeight - window.innerHeight;
			bar?.style.setProperty('--p', String(max > 0 ? Math.min(1, window.scrollY / max) : 0));
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});
</script>

<div bind:this={light} class="flashlight" aria-hidden="true"></div>
{#if isPost}
	<div bind:this={bar} class="read-progress" aria-hidden="true"></div>
{/if}
