<!--
	The corner of the board this file was taken down from: the article in the
	middle, the files on either side of it, the related files and its tags
	pinned around it, all on red string. Hovering a card pulls its string tight;
	clicking it opens that file. Sits beside the text on wide screens; left
	out when the file has nothing pinned around it.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PostNav } from '$lib/server/content-index';

	let { title, kind, nav }: { title: string; kind: 'blog' | 'article' | 'mood'; nav: PostNav } =
		$props();

	const W = 224;
	const C = { x: 112, y: 150 };
	const kindColor = { blog: '#2b4c9b', article: '#b3261e', mood: '#5b3a8a' } as const;
	const kindLabel = { blog: '手記', article: '技術', mood: '心情' } as const;

	type Node = {
		id: string;
		href: string;
		label: string;
		text: string;
		x: number;
		y: number;
		tilt: number;
		color: string;
		tag?: boolean;
	};

	const nodes = $derived.by(() => {
		const out: Node[] = [];
		if (nav.prev)
			out.push({
				id: 'prev',
				href: nav.prev.path,
				label: '← 上一宗',
				text: nav.prev.title,
				x: 56,
				y: 34,
				tilt: -3,
				color: kindColor[nav.prev.kind]
			});
		if (nav.next)
			out.push({
				id: 'next',
				href: nav.next.path,
				label: '下一宗 →',
				text: nav.next.title,
				x: 168,
				y: 30,
				tilt: 2.5,
				color: kindColor[nav.next.kind]
			});
		nav.related.slice(0, 2).forEach((r, i) =>
			out.push({
				id: `rel-${i}`,
				href: r.path,
				label: '相關',
				text: r.title,
				x: i ? 168 : 56,
				y: i ? 262 : 256,
				tilt: i ? -2 : 3,
				color: kindColor[r.kind]
			})
		);
		nav.tags.slice(0, 3).forEach((t, i) =>
			out.push({
				id: `tag-${t}`,
				href: resolve('/tags/[tag]', { tag: t }),
				label: '',
				text: `#${t}`,
				x: [40, 112, 184][i],
				y: [338, 350, 336][i],
				tilt: [-4, 2, -2][i],
				color: '#8a6d45',
				tag: true
			})
		);
		return out;
	});
	const H = $derived(nodes.some((n) => n.tag) ? 372 : 310);

	// Strings from the case in the middle out to each pin, sagging a little:
	// from its pin to the cards above it, from its bottom edge to those below.
	function path(n: Node) {
		const top = n.y - (n.tag ? 10 : 22);
		const sy = top < C.y ? C.y - 30 : C.y + 30;
		const mx = (C.x + n.x) / 2;
		const my = (sy + top) / 2 + Math.min(Math.hypot(n.x - C.x, top - sy) * 0.14, 22);
		return `M${C.x} ${sy} Q${mx} ${my} ${n.x} ${top}`;
	}

	let hot = $state<string | null>(null);
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- paths come from the server-built content index -->
{#if nodes.length}
	<nav class="case-map" aria-label="這宗案件在板上的位置" style="--h: {H}px">
		<p class="map-head font-mono-hack">BOARD · 這宗案件的位置</p>
		<div class="map" style="height: {H}px">
			<svg class="strings" viewBox="0 0 {W} {H}" aria-hidden="true">
				{#each nodes as n, i (n.id)}
					<path
						d={path(n)}
						class="string"
						class:hot={hot === n.id}
						class:faint={hot && hot !== n.id}
						pathLength="1"
						style="--d: {0.35 + i * 0.09}s"
					/>
				{/each}
			</svg>

			<div class="here" style="left: {C.x}px; top: {C.y}px; --k: {kindColor[kind]}">
				<span class="pin" aria-hidden="true"></span>
				<span class="here-kicker font-mono-hack">本案 · {kindLabel[kind]}</span>
				<span class="here-title font-display">{title}</span>
			</div>

			{#each nodes as n, i (n.id)}
				<a
					href={n.href}
					class="node"
					class:tag={n.tag}
					style="left: {n.x}px; top: {n.y}px; --t: {n.tilt}deg; --k: {n.color}; --d: {0.45 +
						i * 0.09}s"
					onpointerenter={() => (hot = n.id)}
					onpointerleave={() => (hot = null)}
					onfocus={() => (hot = n.id)}
					onblur={() => (hot = null)}
				>
					<span class="pin" aria-hidden="true"></span>
					{#if n.label}<span class="node-label font-mono-hack">{n.label}</span>{/if}
					<span class="node-text">{n.text}</span>
				</a>
			{/each}
		</div>
	</nav>
{/if}

<!-- eslint-enable svelte/no-navigation-without-resolve -->

<style>
	.case-map {
		margin-bottom: 1.75rem;
	}
	.map-head {
		margin-bottom: 0.6rem;
		color: var(--color-ink-muted);
		font-size: 0.62rem;
		letter-spacing: 0.22em;
	}
	/* A patch of cork-coloured board under the cards. */
	.map {
		position: relative;
		width: 224px;
		border-radius: 4px;
		background:
			linear-gradient(rgb(60 40 20 / 0.05) 1px, transparent 1px) 0 0 / 16px 16px,
			linear-gradient(90deg, rgb(60 40 20 / 0.05) 1px, transparent 1px) 0 0 / 16px 16px,
			rgb(60 40 20 / 0.04);
		box-shadow: inset 0 0 0 1px rgb(60 40 20 / 0.08);
	}
	.strings {
		position: absolute;
		inset: 0;
		overflow: visible;
		pointer-events: none;
	}
	.string {
		fill: none;
		stroke: var(--b-red);
		stroke-width: 1.4;
		stroke-linecap: round;
		stroke-dasharray: 1;
		stroke-dashoffset: 1;
		opacity: 0.8;
		animation: draw 0.8s cubic-bezier(0.65, 0, 0.35, 1) var(--d) forwards;
		transition:
			stroke-width 0.25s,
			opacity 0.25s;
	}
	.string.hot {
		stroke-width: 2.4;
		opacity: 1;
		filter: drop-shadow(0 0 4px var(--b-red-glow));
	}
	.string.faint {
		opacity: 0.3;
	}
	@keyframes draw {
		to {
			stroke-dashoffset: 0;
		}
	}

	.pin {
		position: absolute;
		top: -6px;
		left: 50%;
		width: 11px;
		height: 11px;
		margin-left: -5.5px;
		border-radius: 50%;
		background: radial-gradient(circle at 35% 30%, #ff8b80, var(--b-red) 45%, #6d0b0b);
		box-shadow: 0 2px 3px rgb(0 0 0 / 0.35);
	}
	.here,
	.node {
		position: absolute;
		translate: -50% -50%;
		display: flex;
		flex-direction: column;
		background: #fffcf5;
		box-shadow:
			0 1px 2px rgb(40 25 10 / 0.1),
			0 10px 18px -10px rgb(40 25 10 / 0.4);
	}
	.here {
		z-index: 2;
		width: 132px;
		gap: 0.2rem;
		padding: 0.7rem 0.65rem 0.6rem;
		border-top: 3px solid var(--k);
		rotate: -1deg;
		animation: hang 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) 0.15s backwards;
	}
	.here-kicker {
		color: var(--k);
		font-size: 0.58rem;
		letter-spacing: 0.16em;
	}
	.here-title {
		display: -webkit-box;
		overflow: hidden;
		color: var(--color-ink);
		font-size: 0.86rem;
		line-height: 1.3;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		line-clamp: 3;
	}
	.node {
		z-index: 1;
		width: 96px;
		gap: 0.15rem;
		padding: 0.55rem 0.5rem 0.45rem;
		rotate: var(--t);
		transform-origin: 50% 0;
		animation: hang 0.75s cubic-bezier(0.2, 0.8, 0.2, 1) var(--d) backwards;
		transition:
			rotate 0.45s cubic-bezier(0.34, 1.56, 0.64, 1),
			translate 0.45s cubic-bezier(0.34, 1.56, 0.64, 1),
			box-shadow 0.3s;
	}
	.node:hover,
	.node:focus-visible {
		z-index: 3;
		rotate: 0deg;
		translate: -50% calc(-50% - 4px);
		box-shadow:
			0 1px 2px rgb(40 25 10 / 0.1),
			0 18px 26px -12px rgb(40 25 10 / 0.5),
			0 0 0 1px color-mix(in srgb, var(--b-red) 35%, transparent);
	}
	.node-label {
		color: var(--k);
		font-size: 0.55rem;
		letter-spacing: 0.12em;
	}
	.node-text {
		display: -webkit-box;
		overflow: hidden;
		color: var(--color-ink);
		font-size: 0.7rem;
		line-height: 1.35;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}
	/* Tags are just slips of paper with the word on them. */
	.node.tag {
		width: auto;
		max-width: 80px;
		padding: 0.3rem 0.55rem 0.25rem;
		background: #f3e6c2;
	}
	.node.tag .node-text {
		color: #6b5336;
		font-family: var(--font-mono-hack);
		font-size: 0.64rem;
		white-space: nowrap;
		-webkit-line-clamp: 1;
		line-clamp: 1;
	}
	.node.tag .pin {
		top: -5px;
		width: 8px;
		height: 8px;
		margin-left: -4px;
		background: radial-gradient(circle at 35% 30%, #fff1b8, #c9a227 50%, #6e5310);
	}
	@keyframes hang {
		from {
			opacity: 0;
			translate: -50% calc(-50% - 16px);
			rotate: calc(var(--t, -1deg) - 6deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.string {
			animation: none;
			stroke-dashoffset: 0;
		}
		.here,
		.node {
			animation: none;
			transition: none;
		}
	}
</style>
