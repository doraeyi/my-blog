<!--
	The red string down the sheet's left margin. It's pinned at the top of the
	sheet and runs down to where you're reading, swinging out a little when
	you scroll fast and settling when you stop. Each section of an article is a
	knot on it: the ones you've passed are tied red; hover one to see its
	heading, click it to jump there.
-->
<script lang="ts">
	import { page } from '$app/state';

	let { sheet }: { sheet: HTMLElement | undefined } = $props();

	interface Knot {
		y: number;
		text: string;
		el: HTMLElement;
	}
	let height = $state(0);
	let knots = $state<Knot[]>([]);
	let read = $state(0);
	let pathEl: SVGPathElement | undefined = $state();
	let tipEl: SVGGElement | undefined = $state();

	const X = 16;
	const TOP = 18;

	$effect(() => {
		const el = sheet;
		void page.url.pathname;
		if (!el) return;
		const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		// The string: where its tip is, how far it swings, and how fast.
		const s = { tip: TOP, sway: 0, v: 0, lastY: scrollY, lastT: performance.now() };
		let raf = 0;

		const measure = () => {
			const r = el.getBoundingClientRect();
			if (Math.abs(height - r.height) > 1) height = r.height;
			const next = [...el.querySelectorAll<HTMLElement>('.prose h2, h2[data-knot]')]
				.filter((h) => h.offsetParent !== null && h.offsetHeight > 4 && !h.closest('.sr-only'))
				.map((h) => {
					const b = h.getBoundingClientRect();
					return {
						y: b.top - r.top + b.height / 2,
						text: h.textContent?.replace(/#$/, '').trim() ?? '',
						el: h
					};
				});
			// Only touch the knots when something actually moved (late fonts, images).
			if (next.length !== knots.length || next.some((k, i) => Math.abs(k.y - knots[i].y) > 1))
				knots = next;
		};
		const target = () => {
			const r = el.getBoundingClientRect();
			return Math.max(TOP, Math.min(r.height - 24, innerHeight * 0.42 - r.top));
		};
		const draw = () => {
			const mid = (TOP + s.tip) / 2;
			pathEl?.setAttribute(
				'd',
				`M${X} ${TOP} Q${(X + s.sway).toFixed(2)} ${mid.toFixed(1)} ${X} ${s.tip.toFixed(1)}`
			);
			tipEl?.setAttribute('transform', `translate(${X} ${s.tip.toFixed(1)})`);
			read = s.tip;
		};
		const step = () => {
			const goal = target();
			s.tip += (goal - s.tip) * 0.18;
			s.v *= 0.9;
			s.sway += (Math.max(-12, Math.min(12, -s.v * 0.5)) - s.sway) * 0.12;
			draw();
			raf =
				Math.abs(goal - s.tip) > 0.4 || Math.abs(s.sway) > 0.1 || Math.abs(s.v) > 0.05
					? requestAnimationFrame(step)
					: 0;
		};
		const onScroll = () => {
			measure();
			if (still) {
				s.tip = target();
				draw();
				return;
			}
			const t = performance.now();
			const dy = scrollY - s.lastY;
			s.v += (dy / Math.max(8, t - s.lastT)) * 6;
			s.lastY = scrollY;
			s.lastT = t;
			if (!raf) raf = requestAnimationFrame(step);
		};
		const onResize = () => onScroll();
		measure();
		s.tip = still ? target() : TOP;
		draw();
		onScroll();
		addEventListener('scroll', onScroll, { passive: true });
		// Again once the sheet has finished hanging in (a transform the observer can't see).
		const settle = [setTimeout(onResize, 1000), setTimeout(onResize, 2600)];
		document.fonts?.ready.then(onResize);
		const ro = new ResizeObserver(onResize);
		ro.observe(el);
		return () => {
			cancelAnimationFrame(raf);
			settle.forEach(clearTimeout);
			removeEventListener('scroll', onScroll);
			ro.disconnect();
		};
	});

	function jump(k: Knot) {
		k.el.scrollIntoView({
			behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
			block: 'start'
		});
	}
</script>

<div
	class="reading-thread"
	style="height: {height}px"
	aria-hidden={knots.length ? undefined : true}
>
	<svg width="32" {height} aria-hidden="true">
		<path bind:this={pathEl} class="string" />
		<g bind:this={tipEl}>
			<circle class="tip-glow" r="9" />
			<circle class="tip" r="5.5" />
		</g>
		<circle class="anchor" cx={X} cy={TOP} r="6" />
	</svg>
	{#each knots as k, i (i)}
		<button
			type="button"
			class="knot"
			class:passed={k.y <= read}
			style="top: {k.y}px"
			aria-label="跳到：{k.text}"
			onclick={() => jump(k)}
		>
			<span class="knot-label">{k.text}</span>
		</button>
	{/each}
</div>

<style>
	.reading-thread {
		position: absolute;
		z-index: 2;
		top: 0;
		left: -34px;
		width: 32px;
		pointer-events: none;
	}
	svg {
		position: absolute;
		inset: 0;
		overflow: visible;
	}
	.string {
		fill: none;
		stroke: var(--b-red);
		stroke-width: 2;
		stroke-linecap: round;
		filter: drop-shadow(1px 3px 2px rgb(0 0 0 / 0.25));
	}
	.anchor,
	.tip {
		fill: var(--b-red);
		stroke: rgb(0 0 0 / 0.25);
		stroke-width: 1;
	}
	.tip-glow {
		fill: var(--b-red-glow);
		opacity: 0.45;
	}

	/* A knot per section */
	.knot {
		position: absolute;
		left: 16px;
		width: 22px;
		height: 22px;
		margin: -11px 0 0 -11px;
		border-radius: 50%;
		pointer-events: auto;
		cursor: pointer;
	}
	.knot::before {
		content: '';
		position: absolute;
		inset: 6px;
		border: 1.5px solid var(--b-muted);
		border-radius: 50%;
		background: var(--b-bg);
		transition:
			background-color 0.3s,
			border-color 0.3s,
			transform 0.4s cubic-bezier(0.34, 1.7, 0.64, 1);
	}
	.knot.passed::before {
		border-color: var(--b-red);
		background: var(--b-red);
		transform: scale(1.15);
	}
	.knot:hover::before,
	.knot:focus-visible::before {
		transform: scale(1.5);
	}
	/* The heading, slid out into the margin */
	.knot-label {
		position: absolute;
		top: 50%;
		right: calc(100% + 6px);
		max-width: 11rem;
		overflow: hidden;
		padding: 0.25rem 0.6rem;
		border-radius: 6px;
		background: var(--b-card);
		box-shadow: var(--b-shadow);
		color: var(--b-ink);
		font-size: 0.78rem;
		text-overflow: ellipsis;
		white-space: nowrap;
		opacity: 0;
		translate: 8px -50%;
		transition:
			opacity 0.2s,
			translate 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
		pointer-events: none;
	}
	.knot:hover .knot-label,
	.knot:focus-visible .knot-label {
		opacity: 1;
		translate: 0 -50%;
	}
	@media (max-width: 1279px) {
		.knot-label {
			display: none;
		}
	}
	@media (max-width: 639px) {
		.reading-thread {
			left: -24px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.knot::before,
		.knot-label {
			transition: none;
		}
	}
</style>
