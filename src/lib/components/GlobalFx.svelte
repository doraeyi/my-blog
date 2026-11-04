<!--
	Page-wide effects driven from one place:
	- lights off (by hand): while the cursor moves, the room goes dark except
	  the detective's torch around it; once it's still, the dark lifts;
	- a frame-rate guard that switches slow devices to light-effects mode.
	Only CSS custom properties and data attributes are written here; the look
	lives in layout.css.
-->
<script lang="ts">
	let dark: HTMLDivElement | undefined = $state();
	// The torch is only out while the cursor moves: still (or scrolling, or a
	// touch screen with no cursor at all), the room's lights stay as they are.
	let resting = $state(true);

	$effect(() => {
		let frame = 0;
		let idle = 0;
		const restSoon = () => {
			clearTimeout(idle);
			idle = window.setTimeout(() => (resting = true), 900);
		};
		const onMove = (e: PointerEvent) => {
			if (e.pointerType !== 'mouse') return;
			resting = false;
			restSoon();
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				dark?.style.setProperty('--fx', `${e.clientX}px`);
				dark?.style.setProperty('--fy', `${e.clientY}px`);
			});
		};
		const onScroll = () => (resting = true);
		window.addEventListener('pointermove', onMove, { passive: true });
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => {
			cancelAnimationFrame(frame);
			clearTimeout(idle);
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('scroll', onScroll);
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
</script>

<div bind:this={dark} class="room-dark" class:resting aria-hidden="true"></div>
