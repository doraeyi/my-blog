<!--
	Page-wide effects driven from one place:
	- lights off: the room goes dark except the detective's torch, which follows
	  the cursor (or stays put on touch screens);
	- the time of day outside (data-sky), for the light through the blinds;
	- a frame-rate guard that switches slow devices to light-effects mode.
	Only CSS custom properties and data attributes are written here; the look
	lives in layout.css.
-->
<script lang="ts">
	let dark: HTMLDivElement | undefined = $state();

	$effect(() => {
		let frame = 0;
		const onMove = (e: PointerEvent) => {
			if (e.pointerType !== 'mouse') return;
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				dark?.style.setProperty('--fx', `${e.clientX}px`);
				dark?.style.setProperty('--fy', `${e.clientY}px`);
			});
		};
		window.addEventListener('pointermove', onMove, { passive: true });
		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener('pointermove', onMove);
		};
	});

	// The time of day outside the office window (the homepage window works it out the same way).
	$effect(() => {
		const root = document.documentElement;
		const set = () => {
			const h = new Date().getHours();
			root.dataset.sky = h < 5 || h >= 19 ? 'night' : h < 7 ? 'dawn' : h < 17 ? 'day' : 'dusk';
		};
		set();
		const t = setInterval(set, 60_000);
		return () => clearInterval(t);
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

<div bind:this={dark} class="room-dark" aria-hidden="true"></div>
