<!--
	Red string between the pinned cards inside it (see actions/pinned). It runs
	pin to pin, row by row and back again like a real board, sagging a little
	between pins, and is strung up as the cards scroll into view. It sits
	behind the cards, so it shows in the gaps and meets each pin on top.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children, class: cls = '' }: { children: Snippet; class?: string } = $props();

	let box: HTMLElement | undefined = $state();
	let size = $state({ w: 0, h: 0 });
	let runs = $state<{ d: string; at: number }[]>([]);
	let strung = $state(false);

	$effect(() => {
		const el = box;
		if (!el) return;
		const measure = () => {
			const r = el.getBoundingClientRect();
			size = { w: r.width, h: r.height };
			const pins = [...el.querySelectorAll<HTMLElement>('.card-pin')]
				.filter((p) => p.offsetParent !== null)
				.map((p) => {
					// Offsets, not client rects: cards still waiting to be pinned up are moved by a transform.
					let x = p.offsetWidth / 2;
					let y = p.offsetHeight / 2;
					for (let e: HTMLElement | null = p; e && e !== el; e = e.offsetParent as HTMLElement) {
						x += e.offsetLeft;
						y += e.offsetTop;
					}
					return { x, y };
				});
			// Rows by height, then left→right, right→left, … so the string never crosses the board.
			const rows: (typeof pins)[] = [];
			for (const p of [...pins].sort((a, b) => a.y - b.y)) {
				const row = rows.at(-1);
				if (row && Math.abs(row[0].y - p.y) < 40) row.push(p);
				else rows.push([p]);
			}
			const order = rows.flatMap((row, i) => row.sort((a, b) => (i % 2 ? b.x - a.x : a.x - b.x)));
			runs = order.slice(1).map((b, i) => {
				const a = order[i];
				const sag = Math.min(Math.hypot(b.x - a.x, b.y - a.y) * 0.16, 46);
				const mx = (a.x + b.x) / 2;
				const my = (a.y + b.y) / 2 + sag;
				return {
					d: `M${a.x.toFixed(1)} ${a.y.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`,
					at: i
				};
			});
		};
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		// Once the cards have finished swinging into place.
		const settle = [setTimeout(measure, 300), setTimeout(measure, 1400)];
		const io = new IntersectionObserver(
			([e]) => {
				if (!e.isIntersecting) return;
				strung = true;
				io.disconnect();
			},
			{ rootMargin: '0px 0px -10% 0px' }
		);
		io.observe(el);
		return () => {
			ro.disconnect();
			io.disconnect();
			settle.forEach(clearTimeout);
		};
	});
</script>

<div bind:this={box} class="pin-string {cls}" class:strung>
	<svg width={size.w} height={size.h} aria-hidden="true">
		{#each runs as r (r.at)}
			<path d={r.d} pathLength="1" style="--at: {r.at}" />
		{/each}
	</svg>
	{@render children()}
</div>

<style>
	.pin-string {
		position: relative;
		isolation: isolate;
	}
	svg {
		position: absolute;
		inset: 0;
		z-index: 0;
		overflow: visible;
		pointer-events: none;
	}
	path {
		fill: none;
		stroke: var(--b-red);
		stroke-width: 1.6;
		stroke-linecap: round;
		stroke-dasharray: 1;
		stroke-dashoffset: 1;
		filter: drop-shadow(0 3px 2px rgb(40 20 5 / 0.22));
	}
	.strung path {
		stroke-dashoffset: 0;
		transition: stroke-dashoffset 0.8s cubic-bezier(0.65, 0, 0.35, 1)
			calc(0.25s + var(--at) * 0.12s);
	}
	@media (prefers-reduced-motion: reduce) {
		path,
		.strung path {
			stroke-dashoffset: 0;
			transition: none;
		}
	}
</style>
