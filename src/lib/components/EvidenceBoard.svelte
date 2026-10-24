<!--
	The evidence board: every post is an index card pinned to cork, every tag a
	manila tag, and a red string runs from each post to each of its tags — so
	posts that share a lead hang off the same tag. Hover or focus a card and its
	strings pull taut while everything else fades back; hover a tag to see every
	case it ties together.

	Layout is a small deterministic force simulation (springs along strings,
	repulsion between cards), run once on the server's data. The board is a
	fixed virtual canvas scaled to fit; on phones it keeps a readable minimum
	scale and pans sideways instead.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';

	interface Post {
		path: string;
		title: string;
		kind: string;
		date: string;
		tags: string[];
		excerpt: string;
	}

	let { posts }: { posts: Post[] } = $props();

	const POST_W = 210;
	const POST_H = 132;
	const TAG_W = 118;
	const TAG_H = 40;
	const BOARD_W = 1200;

	type Node = {
		id: string;
		kind: 'post' | 'tag';
		w: number;
		h: number;
		x: number;
		y: number;
		vx: number;
		vy: number;
		tilt: number;
		post?: Post;
		tag?: string;
		count?: number;
	};

	// Seeded PRNG so the board looks the same on every visit (and on the server).
	function rng(seed: string) {
		let h = 2166136261;
		for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
		return () => {
			h = Math.imul(h ^ (h >>> 15), 2246822507);
			h = Math.imul(h ^ (h >>> 13), 3266489909);
			return ((h ^= h >>> 16) >>> 0) / 4294967296;
		};
	}

	const layout = $derived.by(() => {
		// Scratch maps for one layout pass, never reactive state.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const tagCount = new Map<string, number>();
		for (const p of posts) for (const t of p.tags) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);

		const nodes: Node[] = [];
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const byId = new Map<string, Node>();
		const rand = rng(posts.map((p) => p.path).join('|'));
		const area = posts.length * 72_000 + tagCount.size * 16_000;
		const H = Math.max(720, Math.round(area / BOARD_W));

		const add = (n: Omit<Node, 'x' | 'y' | 'vx' | 'vy' | 'tilt'>) => {
			const node: Node = {
				...n,
				x: 80 + rand() * (BOARD_W - 160),
				y: 80 + rand() * (H - 160),
				vx: 0,
				vy: 0,
				tilt: (rand() - 0.5) * (n.kind === 'post' ? 7 : 10)
			};
			nodes.push(node);
			byId.set(node.id, node);
		};
		for (const p of posts) add({ id: `p:${p.path}`, kind: 'post', w: POST_W, h: POST_H, post: p });
		for (const [tag, count] of tagCount)
			add({ id: `t:${tag}`, kind: 'tag', w: TAG_W, h: TAG_H, tag, count });

		const edges = posts.flatMap((p) => p.tags.map((t) => ({ a: `p:${p.path}`, b: `t:${t}` })));

		// Force simulation: strings pull, cards push apart, a weak pull to the centre.
		for (let step = 0; step < 420; step++) {
			const cool = 1 - step / 420;
			for (let i = 0; i < nodes.length; i++) {
				for (let j = i + 1; j < nodes.length; j++) {
					const a = nodes[i];
					const b = nodes[j];
					let dx = b.x - a.x;
					let dy = b.y - a.y;
					if (dx === 0 && dy === 0) dx = 0.5;
					// Treat cards as boxes: keep at least half their combined size apart.
					const minX = (a.w + b.w) / 2 + 28;
					const minY = (a.h + b.h) / 2 + 28;
					const ox = minX - Math.abs(dx);
					const oy = minY - Math.abs(dy);
					if (ox > 0 && oy > 0) {
						if (ox < oy) {
							const s = (ox / 2) * Math.sign(dx);
							a.vx -= s;
							b.vx += s;
						} else {
							const s = (oy / 2) * Math.sign(dy);
							a.vy -= s;
							b.vy += s;
						}
					} else {
						const d2 = dx * dx + dy * dy;
						const f = 60_000 / d2;
						const d = Math.sqrt(d2);
						a.vx -= (dx / d) * f;
						a.vy -= (dy / d) * f;
						b.vx += (dx / d) * f;
						b.vy += (dy / d) * f;
					}
				}
			}
			for (const e of edges) {
				const a = byId.get(e.a)!;
				const b = byId.get(e.b)!;
				const dx = b.x - a.x;
				const dy = b.y - a.y;
				const d = Math.max(1, Math.hypot(dx, dy));
				const f = (d - 230) * 0.03;
				a.vx += (dx / d) * f;
				a.vy += (dy / d) * f;
				b.vx -= (dx / d) * f;
				b.vy -= (dy / d) * f;
			}
			for (const n of nodes) {
				n.vx += (BOARD_W / 2 - n.x) * 0.0006;
				n.vy += (H / 2 - n.y) * 0.0006;
				n.x += Math.max(-30, Math.min(30, n.vx * 0.5 * cool));
				n.y += Math.max(-30, Math.min(30, n.vy * 0.5 * cool));
				n.vx *= 0.6;
				n.vy *= 0.6;
				n.x = Math.max(n.w / 2 + 24, Math.min(BOARD_W - n.w / 2 - 24, n.x));
				n.y = Math.max(n.h / 2 + 30, Math.min(H - n.h / 2 - 24, n.y));
			}
		}

		// Final pass: push apart anything still overlapping, no other forces.
		for (let pass = 0; pass < 80; pass++) {
			let moved = false;
			for (let i = 0; i < nodes.length; i++) {
				for (let j = i + 1; j < nodes.length; j++) {
					const a = nodes[i];
					const b = nodes[j];
					const dx = b.x - a.x || 0.5;
					const dy = b.y - a.y;
					const ox = (a.w + b.w) / 2 + 16 - Math.abs(dx);
					const oy = (a.h + b.h) / 2 + 16 - Math.abs(dy);
					if (ox <= 0 || oy <= 0) continue;
					moved = true;
					if (ox < oy) {
						a.x -= (ox / 2) * Math.sign(dx);
						b.x += (ox / 2) * Math.sign(dx);
					} else {
						a.y -= (oy / 2) * Math.sign(dy || 1);
						b.y += (oy / 2) * Math.sign(dy || 1);
					}
				}
			}
			for (const n of nodes) {
				n.x = Math.max(n.w / 2 + 24, Math.min(BOARD_W - n.w / 2 - 24, n.x));
				n.y = Math.max(n.h / 2 + 30, Math.min(H - n.h / 2 - 24, n.y));
			}
			if (!moved) break;
		}

		// Strings run between the pins at the top of each card, sagging a little.
		const strings = edges.map((e) => {
			const a = byId.get(e.a)!;
			const b = byId.get(e.b)!;
			const ax = a.x;
			const ay = a.y - a.h / 2 + 12;
			const bx = b.x;
			const by = b.y - b.h / 2 + 10;
			const sag = Math.hypot(bx - ax, by - ay) * 0.12;
			const d = `M${ax.toFixed(1)} ${ay.toFixed(1)} Q${((ax + bx) / 2).toFixed(1)} ${((ay + by) / 2 + sag).toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`;
			return { ...e, d };
		});

		return { nodes, strings, height: H };
	});

	// What the visitor is looking at: a post or a tag, and everything tied to it.
	let focus = $state<string | null>(null);
	const linked = $derived.by(() => {
		if (!focus) return null;
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- rebuilt on every change, never mutated after
		const set = new Set<string>([focus]);
		for (const s of layout.strings) {
			if (s.a === focus) set.add(s.b);
			if (s.b === focus) set.add(s.a);
		}
		return set;
	});
	const lit = (s: { a: string; b: string }) => !!focus && (s.a === focus || s.b === focus);

	let wrap: HTMLDivElement | undefined = $state();
	let scale = $state(1);
	let drawn = $state(false);

	onMount(() => {
		if (!wrap) return;
		const ro = new ResizeObserver(([e]) => {
			// Fit the board to the column, but never below a readable size: phones pan instead.
			scale = Math.max(0.62, Math.min(1, e.contentRect.width / BOARD_W));
		});
		ro.observe(wrap);
		requestAnimationFrame(() => (drawn = true));
		return () => ro.disconnect();
	});
</script>

<div
	bind:this={wrap}
	class="board-wrap"
	class:pans={scale * BOARD_W > (wrap?.clientWidth ?? 0) + 1}
>
	<div
		class="board-sizer"
		style:width="{BOARD_W * scale}px"
		style:height="{layout.height * scale}px"
	>
		<div
			class="board"
			class:has-focus={!!focus}
			style:width="{BOARD_W}px"
			style:height="{layout.height}px"
			style:transform="scale({scale})"
		>
			<svg class="strings" class:drawn viewBox="0 0 {BOARD_W} {layout.height}" aria-hidden="true">
				{#each layout.strings as s, i (s.a + s.b)}
					<path
						d={s.d}
						pathLength="1"
						class="string"
						class:lit={lit(s)}
						style:animation-delay="{Math.min(i * 40, 1200)}ms"
					/>
				{/each}
			</svg>

			{#each layout.nodes as n (n.id)}
				{@const dim = !!linked && !linked.has(n.id)}
				{#if n.post}
					<!-- eslint-disable svelte/no-navigation-without-resolve -- paths come from the server-built content index -->
					<a
						href={n.post.path}
						class="card post"
						class:dim
						class:on={focus === n.id}
						style:left="{n.x - n.w / 2}px"
						style:top="{n.y - n.h / 2}px"
						style:width="{n.w}px"
						style:height="{n.h}px"
						style:--tilt="{n.tilt}deg"
						onpointerenter={() => (focus = n.id)}
						onpointerleave={() => (focus = null)}
						onfocus={() => (focus = n.id)}
						onblur={() => (focus = null)}
					>
						<span class="pin" aria-hidden="true"></span>
						<span class="post-meta">{n.post.kind} · {n.post.date}</span>
						<span class="post-title">{n.post.title}</span>
						<span class="post-excerpt">{n.post.excerpt}</span>
					</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				{:else if n.tag}
					<a
						href={resolve('/tags/[tag]', { tag: n.tag })}
						class="card tag"
						class:dim
						class:on={focus === n.id}
						style:left="{n.x - n.w / 2}px"
						style:top="{n.y - n.h / 2}px"
						style:width="{n.w}px"
						style:height="{n.h}px"
						style:--tilt="{n.tilt}deg"
						onpointerenter={() => (focus = n.id)}
						onpointerleave={() => (focus = null)}
						onfocus={() => (focus = n.id)}
						onblur={() => (focus = null)}
						aria-label="線索 #{n.tag}，{n.count} 篇"
					>
						<span class="hole" aria-hidden="true"></span>
						#{n.tag}
						<span class="tag-count">{n.count}</span>
					</a>
				{/if}
			{/each}
		</div>
	</div>
</div>

<style>
	.board-wrap {
		position: relative;
		overflow: hidden;
		border-radius: 6px;
		box-shadow:
			0 0 0 10px #5b3b22,
			0 0 0 12px #3b2615,
			0 30px 60px -30px rgba(0, 0, 0, 0.7);
		margin: 12px;
	}
	.board-wrap.pans {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}
	.board-sizer {
		position: relative;
	}
	/* Cork: warm brown with flecks; a physical object, the same in both themes. */
	.board {
		position: absolute;
		top: 0;
		left: 0;
		transform-origin: 0 0;
		background:
			radial-gradient(circle at 20% 30%, rgba(0, 0, 0, 0.12) 0 1px, transparent 2px) 0 0 / 23px 19px,
			radial-gradient(circle at 70% 60%, rgba(255, 230, 190, 0.14) 0 1px, transparent 2px) 0 0 /
				31px 27px,
			radial-gradient(circle at 40% 80%, rgba(60, 30, 10, 0.18) 0 1.5px, transparent 2.5px) 0 0 /
				41px 37px,
			radial-gradient(ellipse at 50% 40%, #c4935f, #9c6b3f 75%);
	}
	.strings {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 1;
	}
	.string {
		fill: none;
		stroke: #b3362b;
		stroke-width: 2;
		stroke-linecap: round;
		opacity: 0.75;
		stroke-dasharray: 1;
		stroke-dashoffset: 1;
		filter: drop-shadow(0 2px 1px rgba(0, 0, 0, 0.35));
		transition:
			opacity 0.2s,
			stroke-width 0.2s;
	}
	.drawn .string {
		animation: draw 0.9s cubic-bezier(0.3, 0.6, 0.2, 1) forwards;
	}
	@keyframes draw {
		to {
			stroke-dashoffset: 0;
		}
	}
	.has-focus .string {
		opacity: 0.15;
	}
	.has-focus .string.lit {
		opacity: 1;
		stroke-width: 3;
		stroke: #d6402f;
	}

	.card {
		position: absolute;
		z-index: 2;
		transform: rotate(var(--tilt));
		transition:
			transform 0.25s cubic-bezier(0.2, 1, 0.3, 1),
			opacity 0.2s,
			box-shadow 0.25s;
		color: #2c2118;
		text-decoration: none;
	}
	.card:hover,
	.card:focus-visible,
	.card.on {
		z-index: 3;
		transform: rotate(0deg) scale(1.06);
	}
	.card:focus-visible {
		outline: 2px solid #f0b429;
		outline-offset: 3px;
	}
	.card.dim {
		opacity: 0.35;
	}

	.post {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding: 1.1rem 0.9rem 0.8rem;
		border-top: 2px solid rgba(179, 54, 43, 0.65);
		border-radius: 2px;
		background:
			repeating-linear-gradient(
				to bottom,
				transparent 0,
				transparent 21px,
				rgba(90, 130, 170, 0.2) 21px,
				rgba(90, 130, 170, 0.2) 22px
			),
			#f8f1df;
		box-shadow: 0 10px 18px -8px rgba(30, 15, 5, 0.55);
	}
	.post:hover,
	.post.on {
		box-shadow: 0 18px 30px -10px rgba(30, 15, 5, 0.65);
	}
	.pin {
		position: absolute;
		top: 6px;
		left: 50%;
		width: 14px;
		height: 14px;
		margin-left: -7px;
		border-radius: 50%;
		background: radial-gradient(circle at 35% 35%, #f07a6c, #b3362b 60%, #74211a);
		box-shadow: 1px 2px 2px rgba(0, 0, 0, 0.4);
	}
	.post-meta {
		font-family: var(--font-mono-hack);
		font-size: 0.68rem;
		letter-spacing: 0.08em;
		color: #6b5336;
	}
	.post-title {
		font-family: var(--font-display);
		font-size: 0.98rem;
		line-height: 1.3;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.post-excerpt {
		font-size: 0.74rem;
		line-height: 1.45;
		color: #4a3925;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.tag {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0 0.7rem 0 1.4rem;
		border-radius: 3px 14px 14px 3px;
		background: #d4ad6e;
		font-family: var(--font-mono-hack);
		font-size: 0.78rem;
		white-space: nowrap;
		overflow: hidden;
		box-shadow: 0 8px 14px -8px rgba(30, 15, 5, 0.6);
	}
	.hole {
		position: absolute;
		left: 0.5rem;
		top: 50%;
		width: 8px;
		height: 8px;
		margin-top: -4px;
		border-radius: 50%;
		background: #8a5a33;
		box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.5);
	}
	.tag-count {
		margin-left: auto;
		padding-left: 0.4rem;
		color: #6b5336;
		font-size: 0.7rem;
	}

	@media (prefers-reduced-motion: reduce) {
		.string {
			stroke-dashoffset: 0;
		}
		.drawn .string {
			animation: none;
		}
		.card {
			transition: opacity 0.2s;
		}
		.card:hover,
		.card:focus-visible,
		.card.on {
			transform: rotate(var(--tilt));
		}
	}
</style>
