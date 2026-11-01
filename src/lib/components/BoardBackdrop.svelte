<!--
	Behind every page: the board's surface. A faint grid, paper grain, and the
	light that follows the pointer: a soft sheen with the lights on, the one
	lamp in the room with them off. Fixed to the window, so pages scroll over it.
-->
<script lang="ts">
	let el: HTMLDivElement | undefined = $state();

	$effect(() => {
		if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const at = { x: innerWidth / 2, y: innerHeight * 0.35 };
		const to = { ...at };
		let raf = 0;
		const step = () => {
			at.x += (to.x - at.x) * 0.14;
			at.y += (to.y - at.y) * 0.14;
			el?.style.setProperty('--lx', `${at.x.toFixed(1)}px`);
			el?.style.setProperty('--ly', `${at.y.toFixed(1)}px`);
			raf = Math.abs(to.x - at.x) + Math.abs(to.y - at.y) > 0.5 ? requestAnimationFrame(step) : 0;
		};
		const onMove = (e: PointerEvent) => {
			if (e.pointerType !== 'mouse') return;
			to.x = e.clientX;
			to.y = e.clientY;
			if (!raf) raf = requestAnimationFrame(step);
		};
		addEventListener('pointermove', onMove, { passive: true });
		return () => {
			cancelAnimationFrame(raf);
			removeEventListener('pointermove', onMove);
		};
	});
</script>

<div bind:this={el} class="backdrop" aria-hidden="true">
	<span class="grid"></span>
	<span class="spot"></span>
	<span class="grain"></span>
</div>

<style>
	.backdrop,
	.backdrop > span {
		position: fixed;
		inset: 0;
		pointer-events: none;
	}
	.backdrop {
		z-index: -1;
		background: radial-gradient(120% 90% at 50% 20%, var(--b-bg), var(--b-bg-2));
	}
	.grid {
		background-image:
			linear-gradient(var(--b-grid) 1px, transparent 1px),
			linear-gradient(90deg, var(--b-grid) 1px, transparent 1px);
		background-size: 48px 48px;
		mask-image: radial-gradient(90% 80% at 50% 40%, #000 30%, transparent 85%);
	}
	.spot {
		background: radial-gradient(
			38rem circle at var(--lx, 50%) var(--ly, 35%),
			var(--b-spot),
			transparent 70%
		);
	}
	.grain {
		opacity: 0.35;
		mix-blend-mode: multiply;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .3 0 0 0 0 .22 0 0 0 0 .14 0 0 0 .35 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
	}
	:global(:root[data-theme='dark']) .grain {
		opacity: 0.5;
		mix-blend-mode: screen;
	}
</style>
