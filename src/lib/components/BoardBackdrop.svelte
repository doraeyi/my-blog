<!--
	Behind every page: the board's surface. A faint grid, paper grain, and the
	light that follows the pointer: a soft sheen with the lights on, the one
	lamp in the room with them off. Fixed to the window, so pages scroll over it.

	On every page but the board itself, the rest of the board is still there
	either side of the sheet, out of focus: the other cards and their string,
	one run leading in to where this sheet was taken down from. It drifts a
	little slower than the page as you scroll.
-->
<script lang="ts">
	let el: HTMLDivElement | undefined = $state();

	type Ghost = { x: number; y: number; w: number; h: number; r: number; photo?: boolean };
	const sides: { side: 'l' | 'r'; cards: Ghost[]; lead: number }[] = [
		{
			side: 'l',
			lead: 1,
			cards: [
				{ x: 44, y: 110, w: 128, h: 86, r: -4 },
				{ x: 70, y: 360, w: 104, h: 132, r: 3, photo: true },
				{ x: 30, y: 640, w: 140, h: 78, r: -2 }
			]
		},
		{
			side: 'r',
			lead: 0,
			cards: [
				{ x: 56, y: 80, w: 118, h: 80, r: 3 },
				{ x: 38, y: 320, w: 140, h: 104, r: -3 },
				{ x: 78, y: 590, w: 100, h: 126, r: 2, photo: true }
			]
		}
	];
	const pinOf = (c: Ghost) => ({ x: c.x + c.w / 2, y: c.y + 6 });
	function sag(a: { x: number; y: number }, b: { x: number; y: number }) {
		const s = Math.min(Math.hypot(b.x - a.x, b.y - a.y) * 0.12, 40);
		return `M${a.x} ${a.y} Q${(a.x + b.x) / 2} ${(a.y + b.y) / 2 + s} ${b.x} ${b.y}`;
	}

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
		let sraf = 0;
		const onScroll = () => {
			if (sraf) return;
			sraf = requestAnimationFrame(() => {
				sraf = 0;
				el?.style.setProperty('--sy', `${(-scrollY * 0.08).toFixed(1)}px`);
			});
		};
		addEventListener('pointermove', onMove, { passive: true });
		addEventListener('scroll', onScroll, { passive: true });
		return () => {
			cancelAnimationFrame(raf);
			cancelAnimationFrame(sraf);
			removeEventListener('pointermove', onMove);
			removeEventListener('scroll', onScroll);
		};
	});
</script>

<div bind:this={el} class="backdrop" aria-hidden="true">
	<span class="grid"></span>
	{#each sides as { side, cards, lead } (side)}
		<svg class="ghost ghost-{side}" viewBox="0 0 220 820" preserveAspectRatio="xMidYMin meet">
			{#each cards.slice(1) as c, i (i)}
				<path class="g-string" d={sag(pinOf(cards[i]), pinOf(c))} />
			{/each}
			<!-- The run that leads in to the sheet in the middle -->
			<path
				class="g-string"
				d={sag(pinOf(cards[lead]), { x: side === 'l' ? 240 : -20, y: pinOf(cards[lead]).y + 70 })}
			/>
			{#each cards as c, i (i)}
				<g transform="rotate({c.r} {c.x + c.w / 2} {c.y})">
					<rect class="g-card" x={c.x} y={c.y} width={c.w} height={c.h} rx="2" />
					{#if c.photo}
						<rect class="g-photo" x={c.x + 8} y={c.y + 8} width={c.w - 16} height={c.h - 34} />
					{:else}
						{#each [0, 1, 2] as l (l)}
							<rect
								class="g-line"
								x={c.x + 12}
								y={c.y + 22 + l * 16}
								width={(c.w - 24) * [1, 0.8, 0.55][l]}
								height="4"
								rx="2"
							/>
						{/each}
					{/if}
					<circle class="g-pin" cx={c.x + c.w / 2} cy={c.y + 6} r="5" />
				</g>
			{/each}
		</svg>
	{/each}
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
	/* The rest of the board, out of focus beside the sheet. Only where there's room. */
	.ghost {
		position: fixed;
		top: 4.5rem;
		width: 220px;
		height: calc(100vh - 4.5rem);
		overflow: visible;
		/* Faint and soft enough to read as background, not as cards you could click. */
		opacity: 0.3;
		filter: blur(2px);
		pointer-events: none;
		translate: 0 var(--sy, 0);
		display: none;
	}
	/* Tucked a little under the sheet's edges, so on narrower screens the
	   cards still peek out from behind it. */
	.ghost-l {
		right: calc(50% + 516px);
	}
	.ghost-r {
		left: calc(50% + 516px);
	}
	@media (min-width: 1180px) {
		.ghost {
			display: block;
		}
	}
	/* Not on the homepage (it is the board), and not beside a post: there the
	   text is the only thing to look at. */
	:global(:root:has(.board, .case-head)) .ghost {
		display: none;
	}
	:global(:root[data-theme='dark']) .ghost {
		opacity: 0.22;
	}
	.g-card {
		fill: var(--b-card);
		filter: drop-shadow(0 6px 8px rgb(40 25 10 / 0.25));
	}
	.g-photo {
		fill: var(--b-muted);
		opacity: 0.35;
	}
	.g-line {
		fill: var(--b-muted);
		opacity: 0.28;
	}
	.g-pin {
		fill: var(--b-red);
	}
	.g-string {
		fill: none;
		stroke: var(--b-red);
		stroke-width: 1.6;
		opacity: 0.7;
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
