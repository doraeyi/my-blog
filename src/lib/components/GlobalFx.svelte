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
