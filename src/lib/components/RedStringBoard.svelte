<!--
	The homepage: the case board. Liam in the middle, the five chapters of his
	book pinned around him, the newest files and his friends pinned to the
	chapter they belong to, and red string between them all.
	- the strings are real: they sag, sway a little, and bend and twang when the
	  pointer runs through them; the card at the end of a pulled string swings;
	- the cards sit at different depths and drift with the pointer;
	- on load the pins go in and the string runs out from Liam, card by card;
	- open a card and the board zooms into it before the page turns;
	- type anywhere to search the files from Liam's card.
	Wide screens spread the board across the window; phones get a tall board.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { fly } from 'svelte/transition';
	import mark from '$lib/assets/logo-mark.jpg';
	import { loadIndex, runSearch, search, type SearchHit } from '$lib/search.svelte';
	import { chapters } from '$lib/site-nav';
	import type { SuspectBoardData } from '$lib/suspect-board';

	interface FriendPin {
		id: string;
		name: string;
		url: string;
		avatar: string | null;
		description: string;
		lost: boolean;
	}

	let { board, friends = [] }: { board: SuspectBoardData; friends?: FriendPin[] } = $props();
	const ev = $derived(board.evidence);

	// ── What's on the board ──
	// Each node is pinned at (x, y) % of the board — wide layout, then the tall
	// (phone) one — and hangs from its pin. `depth` is how far it drifts with the pointer.
	type Kind = 'liam' | 'chapter' | 'file' | 'friend';
	interface Node {
		id: string;
		kind: Kind;
		parent: string | null;
		at: [number, number, number, number];
		depth: number;
		/** Seconds into the opening when its string arrives. */
		delay: number;
	}
	const chapterAt: Record<string, [number, number, number, number]> = {
		files: [16, 13, 27, 34],
		evidence: [84, 11, 73, 36],
		cases: [73, 55, 27, 52],
		notes: [38, 63, 73, 54],
		testimony: [13, 48, 50, 68]
	};
	const fileAt: [number, number, number, number][] = [
		[93, 33, 0, 0],
		[89, 80, 0, 0],
		[63, 85, 0, 0]
	];
	const friendAt: [number, number, number, number][] = [
		[5, 70, 14, 85],
		[12, 81, 38, 89],
		[20, 69, 62, 85],
		[26, 80, 86, 89]
	];
	const latest = $derived(board.latest.slice(0, fileAt.length));
	const pinned = $derived(friends.slice(0, friendAt.length));

	const nodes = $derived<Node[]>([
		{ id: 'liam', kind: 'liam', parent: null, at: [50, 26, 50, 3], depth: 0.35, delay: 0 },
		...chapters.map((c, i) => ({
			id: c.id,
			kind: 'chapter' as const,
			parent: 'liam',
			at: chapterAt[c.id] ?? [50, 50, 50, 50],
			depth: 0.8,
			delay: 0.35 + i * 0.13
		})),
		...latest.map((_, i) => ({
			id: `file-${i}`,
			kind: 'file' as const,
			parent: 'cases',
			at: fileAt[i],
			depth: 1.15,
			delay: 1.15 + i * 0.12
		})),
		...friendAt.map((p, i) => ({
			id: `friend-${i}`,
			kind: 'friend' as const,
			parent: 'testimony',
			at: p,
			depth: 1.35,
			delay: 1.3 + i * 0.1
		}))
	]);
	const strings = $derived(nodes.filter((n) => n.parent));

	// ── Hover: the string back to Liam lights up, everything else steps back ──
	let hot = $state<string | null>(null);
	const hotChain = $derived.by(() => {
		if (!hot) return [] as string[];
		const chain = [hot, ...nodes.filter((n) => n.parent === hot).map((n) => n.id)];
		let p = nodes.find((n) => n.id === hot)?.parent;
		while (p) {
			chain.push(p);
			p = nodes.find((n) => n.id === p)?.parent;
		}
		return chain;
	});
	const lit = (n: Node) =>
		!hot || (hotChain.includes(n.id) && (n.parent ? hotChain.includes(n.parent) : true));

	// ── The string physics ──
	let boardEl: HTMLElement | undefined = $state();
	const nodeEls: Record<string, HTMLElement> = {};
	const pathEls: Record<string, SVGPathElement> = {};
	// The frame loop reads these every frame, so they're plain maps, not state;
	// an attachment files each element under its id (bind:this can't target a
	// non-reactive object without Svelte warning on every render).
	function keep<E extends Element>(map: Record<string, E>, id: string) {
		return (el: E) => {
			map[id] = el;
			return () => {
				if (map[id] === el) delete map[id];
			};
		};
	}
	let size = $state({ w: 0, h: 0 });
	interface Spring {
		ox: number;
		oy: number;
		vx: number;
		vy: number;
	}
	const springs: Record<string, Spring> = {};
	const pins: Record<string, { x: number; y: number; on: boolean }> = {};
	const pointer = { x: 0, y: 0, in: false, px: 0, py: 0 };
	const drift = { x: 0, y: 0 };
	let still = false;

	function measure() {
		for (const n of nodes) {
			const el = nodeEls[n.id];
			// offsetLeft/Top ignore the drift and swing transforms: this is where the pin went in.
			pins[n.id] = el
				? { x: el.offsetLeft, y: el.offsetTop, on: el.offsetParent !== null }
				: { x: 0, y: 0, on: false };
		}
	}

	function frame(t: number) {
		const reduce = still;
		if (!reduce) {
			const tx = pointer.in ? pointer.px - 0.5 : 0;
			const ty = pointer.in ? pointer.py - 0.5 : 0;
			drift.x += (tx - drift.x) * 0.06;
			drift.y += (ty - drift.y) * 0.06;
			boardEl?.style.setProperty('--bgx', `${(-drift.x * 30).toFixed(2)}px`);
			boardEl?.style.setProperty('--bgy', `${(-drift.y * 20).toFixed(2)}px`);
		}
		const off = (depth: number) => ({
			x: drift.x * depth * 36,
			y: drift.y * depth * 24
		});
		const swing: Record<string, number> = {};

		strings.forEach((n, i) => {
			const a = pins[n.parent!];
			const b = pins[n.id];
			const path = pathEls[n.id];
			if (!a || !b || !path) return;
			if (!a.on || !b.on) {
				path.setAttribute('d', '');
				return;
			}
			const pa = nodes.find((m) => m.id === n.parent)!;
			const oa = off(pa.depth);
			const ob = off(n.depth);
			const ax = a.x + oa.x;
			const ay = a.y + oa.y;
			const bx = b.x + ob.x;
			const by = b.y + ob.y;
			const mx = (ax + bx) / 2;
			const my = (ay + by) / 2;
			const len = Math.hypot(bx - ax, by - ay);
			const s = (springs[n.id] ??= { ox: 0, oy: Math.min(len * 0.12, 70), vx: 0, vy: 0 });

			// Gravity, and a breath of air through the room.
			let gx = 0;
			let gy = Math.min(len * 0.12, 70);
			if (!reduce) {
				gx += Math.sin(t / 1300 + i * 1.7) * 2.2;
				gy += Math.cos(t / 1700 + i * 2.3) * 1.6;
			}
			// The pointer running through the string drags it along.
			if (pointer.in && !reduce) {
				const dx = bx - ax;
				const dy = by - ay;
				const k = Math.max(
					0.15,
					Math.min(0.85, ((pointer.x - ax) * dx + (pointer.y - ay) * dy) / (len * len))
				);
				// Where the string hangs now at k, and how far the pointer is from it.
				const cx = mx + s.ox;
				const cy = my + s.oy;
				const hx = (1 - k) ** 2 * ax + 2 * k * (1 - k) * cx + k * k * bx;
				const hy = (1 - k) ** 2 * ay + 2 * k * (1 - k) * cy + k * k * by;
				const d = Math.hypot(pointer.x - hx, pointer.y - hy);
				const R = 46;
				if (d < R) {
					const f = (1 - d / R) ** 1.5;
					// The control point that would put the string under the pointer.
					const wx = (pointer.x - (1 - k) ** 2 * ax - k * k * bx) / (2 * k * (1 - k)) - mx;
					const wy = (pointer.y - (1 - k) ** 2 * ay - k * k * by) / (2 * k * (1 - k)) - my;
					gx += (wx - gx) * f;
					gy += (wy - gy) * f;
				}
			}
			if (reduce) {
				s.ox = gx;
				s.oy = gy;
			} else {
				s.vx = (s.vx + (gx - s.ox) * 0.085) * 0.88;
				s.vy = (s.vy + (gy - s.oy) * 0.085) * 0.88;
				s.ox += s.vx;
				s.oy += s.vy;
			}
			path.setAttribute(
				'd',
				`M${ax.toFixed(1)} ${ay.toFixed(1)} Q${(mx + s.ox).toFixed(1)} ${(my + s.oy).toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`
			);
			// A string pulled sideways swings the card hanging from it.
			swing[n.id] = Math.max(-7, Math.min(7, s.ox * 0.09 - s.vx * 0.6));
		});

		for (const n of nodes) {
			const el = nodeEls[n.id];
			if (!el) continue;
			const o = off(n.depth);
			el.style.translate = `${o.x.toFixed(2)}px ${o.y.toFixed(2)}px`;
			el.style.rotate = `${(swing[n.id] ?? 0).toFixed(2)}deg`;
		}
	}

	$effect(() => {
		const el = boardEl;
		if (!el) return;
		void nodes;
		const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
		still = mq.matches;
		const fit = () => {
			size = { w: el.clientWidth, h: el.clientHeight };
			measure();
			if (still) frame(0);
		};
		fit();
		const ro = new ResizeObserver(fit);
		ro.observe(el);
		let raf = 0;
		const loop = (t: number) => {
			frame(t);
			raf = requestAnimationFrame(loop);
		};
		if (!still) raf = requestAnimationFrame(loop);
		return () => {
			ro.disconnect();
			cancelAnimationFrame(raf);
		};
	});

	function onPointer(e: PointerEvent) {
		if (!boardEl || e.pointerType === 'touch') return;
		const r = boardEl.getBoundingClientRect();
		pointer.x = e.clientX - r.left;
		pointer.y = e.clientY - r.top;
		pointer.px = pointer.x / r.width;
		pointer.py = (e.clientY - Math.max(r.top, 0)) / Math.min(r.height, innerHeight);
		pointer.in = true;
		touched = true;
	}
	function onLeave() {
		pointer.in = false;
	}

	// ── The opening: once the site's intro has gone, the pins go in ──
	// Coming back from a page the board is already up, so the sheet can go
	// straight back to its card.
	let open = $state(
		typeof document !== 'undefined' && document.documentElement.dataset.nav === 'out'
	);
	$effect(() => {
		const root = document.documentElement;
		const mo = new MutationObserver(() => go());
		function go() {
			if (root.dataset.intro === 'on') return;
			setTimeout(() => (open = true), 40);
			mo.disconnect();
		}
		mo.observe(root, { attributes: true, attributeFilter: ['data-intro'] });
		go();
		return () => mo.disconnect();
	});
	let touched = $state(false);

	// ── Opening a card: it's lifted off the board as the rest falls back, then
	// it grows into the page (the "case-file" view transition in +layout.svelte) ──
	let diving = $state<{ x: number; y: number } | null>(null);
	function dive(e: MouseEvent, id: string, href: string) {
		if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
		if (still || !boardEl) return;
		e.preventDefault();
		const el = e.currentTarget as HTMLElement;
		el.classList.add('lifted');
		const card = el.getBoundingClientRect();
		const r = boardEl.getBoundingClientRect();
		diving = { x: card.left + card.width / 2 - r.left, y: card.top + card.height / 2 - r.top };
		hot = id;
		setTimeout(
			() =>
				// eslint-disable-next-line svelte/no-navigation-without-resolve -- static app path from site-nav
				goto(href).finally(() => {
					diving = null;
					el.classList.remove('lifted');
				}),
			280
		);
	}

	// ── Liam's card: search the files ──
	let query = $state('');
	let hits = $state<SearchHit[]>([]);
	let selected = $state(0);
	let searchInput: HTMLInputElement | undefined = $state();
	$effect(() => {
		const q = query.trim();
		if (!q) {
			hits = [];
			return;
		}
		let alive = true;
		loadIndex().then((docs) => {
			if (!alive) return;
			hits = runSearch(docs, q, 5);
			selected = 0;
		});
		return () => (alive = false);
	});
	function openHit() {
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- path from the search index
		if (hits[selected]) goto(hits[selected].doc.path);
	}
	function onSearchKey(e: KeyboardEvent) {
		if (e.isComposing) return;
		if (e.key === 'ArrowDown' && hits.length) {
			e.preventDefault();
			selected = (selected + 1) % hits.length;
		} else if (e.key === 'ArrowUp' && hits.length) {
			e.preventDefault();
			selected = (selected - 1 + hits.length) % hits.length;
		} else if (e.key === 'Enter') {
			e.preventDefault();
			openHit();
		} else if (e.key === 'Escape') {
			query = '';
			searchInput?.blur();
		}
	}
	const typeLabel: Record<string, string> = {
		article: '技術文章',
		blog: '文章',
		mood: '心情',
		thought: '筆記',
		page: '頁面'
	};
	// Type anywhere on the board and it lands in the search.
	function onKeydown(e: KeyboardEvent) {
		const el = e.target as HTMLElement | null;
		if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
		if (e.ctrlKey || e.metaKey || e.altKey || search.open) return;
		if ((e.key.length !== 1 && e.key !== 'Process') || e.key === ' ' || e.key === '/') return;
		searchInput?.focus({ preventScroll: true });
		if (e.key !== 'Process') {
			e.preventDefault();
			query += e.key;
		}
	}

	// ── The corner: the time, and how long the case has been open ──
	let now = $state<Date | null>(null);
	$effect(() => {
		now = new Date();
		const t = setInterval(() => (now = new Date()), 20_000);
		return () => clearInterval(t);
	});
	const clock = $derived(
		now
			? `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
			: '--:--'
	);
	const fmt = (d: Date) =>
		`${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
	const updated = $derived(board.latest[0] ? fmt(new Date(board.latest[0].date)) : '');
	const roman = ['01', '02', '03', '04', '05'];
</script>

<svelte:window onkeydown={onKeydown} />

<div
	bind:this={boardEl}
	class="board"
	class:open
	class:diving={!!diving}
	class:touched
	style={diving ? `--zx: ${diving.x}px; --zy: ${diving.y}px` : undefined}
	onpointermove={onPointer}
	onpointerleave={onLeave}
	role="presentation"
>
	<div class="backdrop" aria-hidden="true">
		<span class="ghost">LIAM</span>
	</div>

	<!-- eslint-disable svelte/no-navigation-without-resolve -- static app paths from site-nav, content and search-index paths, friends' own sites -->
	<div class="stage">
		<svg class="strings" width={size.w} height={size.h} aria-hidden="true">
			<defs>
				<filter id="string-shadow" x="-5%" y="-5%" width="110%" height="120%">
					<feDropShadow dx="0" dy="5" stdDeviation="2.5" flood-color="#000" flood-opacity="0.28" />
				</filter>
			</defs>
			{#each strings as n (n.id)}
				<path
					{@attach keep(pathEls, n.id)}
					class="string {n.kind}"
					class:hot={hot && hotChain.includes(n.id) && hotChain.includes(n.parent ?? '')}
					class:dim={hot && !(hotChain.includes(n.id) && hotChain.includes(n.parent ?? ''))}
					pathLength="1"
					style="--d: {n.delay}s"
					filter="url(#string-shadow)"
				/>
			{/each}
		</svg>

		{#each nodes as n (n.id)}
			<div
				{@attach keep(nodeEls, n.id)}
				class="node {n.kind}"
				class:dim={!lit(n)}
				style="--x: {n.at[0]}%; --y: {n.at[1]}%; --tx: {n.at[2]}%; --ty: {n
					.at[3]}%; --d: {n.delay}s"
			>
				<span class="pin" aria-hidden="true"></span>
				{#if n.kind === 'liam'}
					<section class="card liam-card" aria-label="調查對象：Liam">
						<p class="liam-top">
							<span>SUBJECT · No.001</span>
							<span class="live"><i></i>調查中</span>
						</p>
						<div class="liam-id">
							<img src={mark} alt="" width="64" height="64" />
							<div>
								<h1>Liam</h1>
								<p>{ev.badge.role} · {ev.badge.org}</p>
							</div>
						</div>
						<p class="liam-line">做完不算，好用才算。卡關會追到底，再寫成筆記。</p>
						<label class="liam-search">
							<span class="sr-only">搜尋全站</span>
							<svg viewBox="0 0 24 24" aria-hidden="true"
								><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg
							>
							<input
								bind:this={searchInput}
								bind:value={query}
								onkeydown={onSearchKey}
								type="search"
								placeholder="直接打字，開始調查…"
								autocomplete="off"
								spellcheck="false"
							/>
							<kbd>⏎</kbd>
						</label>
						{#if hits.length}
							<ul class="hits" transition:fly={{ y: -6, duration: 160 }}>
								{#each hits as h, i (h.doc.path)}
									<li>
										<a
											href={h.doc.path}
											class:sel={i === selected}
											onpointerenter={() => (selected = i)}
										>
											<span class="hit-kind">{typeLabel[h.doc.type] ?? h.doc.type}</span>
											<span class="hit-title">{h.doc.title}</span>
										</a>
									</li>
								{/each}
							</ul>
						{:else if query.trim()}
							<p class="no-hit">查無此案：「{query.trim()}」</p>
						{/if}
					</section>
				{:else if n.kind === 'chapter'}
					{@const c = chapters.find((x) => x.id === n.id)!}
					{@const i = chapters.indexOf(c)}
					<a
						href={c.href}
						class="card chapter-card"
						style="--c: {c.color}"
						onpointerenter={() => (hot = n.id)}
						onpointerleave={() => (hot = null)}
						onfocus={() => (hot = n.id)}
						onblur={() => (hot = null)}
						onclick={(e) => dive(e, n.id, c.href)}
					>
						<span class="ch-meta"><span class="ch-tab"></span>CH.{roman[i]} · {c.no}</span>
						<strong class="ch-title">{c.label}</strong>
						<span class="ch-sub"
							>{c.cards.length ? c.cards.map((x) => x.label).join(' · ') : c.blurb}</span
						>
						<span class="ch-go" aria-hidden="true">打開 →</span>
					</a>
				{:else if n.kind === 'file'}
					{@const f = latest[Number(n.id.slice(5))]}
					<a
						href={f.href}
						class="card file-card"
						onpointerenter={() => (hot = n.id)}
						onpointerleave={() => (hot = null)}
						onfocus={() => (hot = n.id)}
						onblur={() => (hot = null)}
						onclick={(e) => dive(e, n.id, f.href)}
					>
						<span class="file-meta">{f.kind} · {fmt(new Date(f.date))}</span>
						<span class="file-title">{f.title}</span>
					</a>
				{:else}
					{@const fr = pinned[Number(n.id.slice(7))]}
					{#if fr}
						<a
							href={fr.url}
							target="_blank"
							rel="noopener"
							class="friend-card"
							class:lost={fr.lost}
							title={fr.description}
							onpointerenter={() => (hot = n.id)}
							onpointerleave={() => (hot = null)}
							onfocus={() => (hot = n.id)}
							onblur={() => (hot = null)}
						>
							<span class="face">
								{#if fr.avatar}<img src={fr.avatar} alt="" loading="lazy" />{:else}{fr.name.slice(
										0,
										1
									)}{/if}
							</span>
							<span class="friend-name">{fr.name}</span>
						</a>
					{:else}
						<a
							href={resolve('/friends')}
							class="friend-card unknown"
							onpointerenter={() => (hot = n.id)}
							onpointerleave={() => (hot = null)}
							onfocus={() => (hot = n.id)}
							onblur={() => (hot = null)}
						>
							<span class="face">?</span>
							<span class="friend-name">待查</span>
						</a>
					{/if}
				{/if}
			</div>
		{/each}
	</div>

	<!-- eslint-enable svelte/no-navigation-without-resolve -->

	<footer class="foot" aria-hidden="true">
		<span>{clock} · 最後更新 {updated}</span>
		<span class="hint">用滑鼠劃過紅線 · 點卡片翻開</span>
	</footer>
</div>

<style>
	/* ── The board: its colours are the site's board tokens (layout.css) ── */
	.board {
		--bg: var(--b-bg);
		--ghost: var(--b-ghost);
		--card: var(--b-card);
		--card-2: var(--b-card-2);
		--ink: var(--b-ink);
		--muted: var(--b-muted);
		--hair: var(--b-hair);
		--red: var(--b-red);
		--red-glow: var(--b-red-glow);
		--shadow: var(--b-shadow);
		position: relative;
		min-height: max(100svh, 720px);
		overflow: hidden;
		color: var(--ink);
		font-family: 'LXGW WenKai TC', ui-sans-serif, system-ui, sans-serif;
		isolation: isolate;
	}

	/* ── Behind the cards ── */
	.backdrop,
	.backdrop > span {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}
	.ghost {
		display: grid;
		place-items: center;
		color: transparent;
		font-family: var(--font-display);
		font-size: clamp(10rem, 34vw, 34rem);
		line-height: 1;
		letter-spacing: -0.02em;
		-webkit-text-stroke: 1.5px var(--ghost);
		translate: calc(var(--bgx, 0px) * -0.6) calc(var(--bgy, 0px) * -0.6);
		user-select: none;
	}
	.card:focus-visible,
	.friend-card:focus-visible {
		outline: 2px solid var(--red);
		outline-offset: 3px;
	}
	kbd {
		padding: 0.05rem 0.35rem;
		border: 1px solid var(--hair);
		border-radius: 4px;
		color: var(--muted);
		font-family: var(--font-mono-hack);
		font-size: 0.68rem;
	}

	/* ── The board itself ── */
	.stage {
		position: absolute;
		inset: 0;
		transform-origin: var(--zx, 50%) var(--zy, 50%);
		transition:
			transform 0.5s cubic-bezier(0.7, 0, 0.84, 0),
			opacity 0.45s ease-in;
	}
	.diving .stage {
		transform: scale(1.04);
	}
	/* Everything but the card being opened falls back out of focus. */
	.diving :global(:is(.card, .friend-card, .file-card):not(.lifted)),
	.diving .strings {
		opacity: 0.35;
		filter: blur(1.5px);
		transition:
			opacity 0.25s,
			filter 0.25s;
	}
	.stage :global(.lifted) {
		z-index: 20;
		scale: 1.06;
		translate: 0 -8px;
		box-shadow: 0 30px 50px -20px rgb(20 10 0 / 0.55);
		transition:
			scale 0.28s cubic-bezier(0.34, 1.56, 0.64, 1),
			translate 0.28s cubic-bezier(0.34, 1.56, 0.64, 1),
			box-shadow 0.28s;
	}
	.strings {
		position: absolute;
		inset: 0;
		overflow: visible;
		pointer-events: none;
	}
	.string {
		fill: none;
		stroke: var(--red);
		stroke-width: 2;
		stroke-linecap: round;
		stroke-dasharray: 1;
		stroke-dashoffset: 1;
		transition:
			stroke-width 0.25s,
			opacity 0.3s;
	}
	.string.file,
	.string.friend {
		stroke-width: 1.5;
	}
	.open .string {
		stroke-dashoffset: 0;
		transition:
			stroke-dashoffset 0.7s cubic-bezier(0.65, 0, 0.35, 1) var(--d),
			stroke-width 0.25s,
			opacity 0.3s;
	}
	.string.hot {
		stroke-width: 3;
		filter: drop-shadow(0 0 6px var(--red-glow));
	}
	.string.dim {
		opacity: 0.22;
	}

	/* A node is its pin: the card hangs below it and swings around it. */
	.node {
		position: absolute;
		left: clamp(var(--half) + 1rem, var(--x), 100% - var(--half) - 1rem);
		top: var(--y);
		width: 0;
		height: 0;
		--half: 7rem;
		transform-origin: 0 0;
		transition: opacity 0.3s;
	}
	.node.liam {
		--half: 12rem;
		z-index: 5;
	}
	.node.file {
		--half: 6.5rem;
	}
	.node.friend {
		--half: 2.5rem;
	}
	.node.dim {
		opacity: 0.38;
	}
	.node > :not(.pin) {
		position: absolute;
		top: -5px;
		left: 0;
		translate: -50% 0;
		opacity: 0;
		transform: translateY(-18px) scale(0.96);
	}
	.open .node > :not(.pin) {
		opacity: 1;
		transform: none;
		transition:
			opacity 0.5s ease-out calc(var(--d) + 0.45s),
			transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) calc(var(--d) + 0.45s);
	}
	.node.liam > :not(.pin) {
		transform: translateY(24px) scale(0.94);
	}
	.open .node.liam > :not(.pin) {
		transition-delay: 0.05s, 0.05s;
	}

	/* The pin: pushed in from above when its card arrives. */
	.pin {
		position: absolute;
		z-index: 3;
		left: 0;
		top: 0;
		width: 14px;
		height: 14px;
		margin: -7px 0 0 -7px;
		border-radius: 50%;
		background: radial-gradient(circle at 35% 30%, #ff8b80, var(--red) 45%, #6d0b0b);
		box-shadow:
			0 3px 4px rgb(0 0 0 / 0.35),
			inset 0 -1px 2px rgb(0 0 0 / 0.3);
		opacity: 0;
		transform: translateY(-26px) scale(1.6);
	}
	.open .pin {
		opacity: 1;
		transform: none;
		transition:
			opacity 0.2s calc(var(--d) + 0.35s),
			transform 0.45s cubic-bezier(0.34, 1.7, 0.64, 1) calc(var(--d) + 0.35s);
	}
	.node.liam .pin {
		width: 18px;
		height: 18px;
		margin: -9px 0 0 -9px;
	}

	/* ── Cards ── */
	.card {
		display: block;
		border: 1px solid var(--hair);
		border-radius: 10px;
		background: linear-gradient(180deg, var(--card), var(--card-2));
		box-shadow: var(--shadow);
	}
	a.card,
	.friend-card {
		transition:
			transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1),
			box-shadow 0.35s,
			border-color 0.3s;
	}
	.open .node > a.card,
	.open .node > .friend-card {
		transition:
			opacity 0.5s ease-out calc(var(--d) + 0.45s),
			transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) calc(var(--d) + 0.45s),
			box-shadow 0.35s,
			border-color 0.3s;
	}
	.board.open.touched .node > a.card,
	.board.open.touched .node > .friend-card {
		transition:
			opacity 0.3s,
			transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1),
			box-shadow 0.35s,
			border-color 0.3s;
	}
	.open .node > a.card:hover,
	.open .node > a.card:focus-visible {
		transform: translateY(-6px) scale(1.035);
		border-color: color-mix(in srgb, var(--red) 45%, var(--hair));
		box-shadow:
			var(--shadow),
			0 26px 50px -20px var(--red-glow);
	}

	/* Liam */
	.liam-card {
		width: 24rem;
		padding: 1.3rem 1.25rem 1.2rem;
	}
	.liam-top {
		display: flex;
		justify-content: space-between;
		color: var(--muted);
		font-family: var(--font-mono-hack);
		font-size: 0.72rem;
		letter-spacing: 0.14em;
	}
	.live {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		color: var(--red);
		letter-spacing: 0.06em;
	}
	.live i {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--red);
		animation: live 1.8s ease-in-out infinite;
	}
	@keyframes live {
		50% {
			opacity: 0.25;
			transform: scale(0.7);
		}
	}
	.liam-id {
		display: flex;
		align-items: center;
		gap: 0.95rem;
		margin-top: 0.9rem;
	}
	.liam-id img {
		width: 64px;
		height: 64px;
		border-radius: 12px;
		box-shadow: 0 6px 14px -6px rgb(0 0 0 / 0.45);
	}
	.liam-id h1 {
		font-family: var(--font-display);
		font-size: 2.6rem;
		line-height: 1;
		letter-spacing: 0.02em;
	}
	.liam-id p {
		margin-top: 0.35rem;
		color: var(--muted);
		font-size: 0.88rem;
	}
	.liam-line {
		margin-top: 0.9rem;
		padding-top: 0.8rem;
		border-top: 1px dashed var(--hair);
		font-size: 0.95rem;
		line-height: 1.6;
	}
	.liam-search {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		margin-top: 0.95rem;
		padding: 0 0.75rem;
		height: 2.75rem;
		border: 1px solid var(--hair);
		border-radius: 8px;
		background: color-mix(in srgb, var(--bg) 55%, transparent);
		transition:
			border-color 0.2s,
			box-shadow 0.2s;
	}
	.liam-search:focus-within {
		border-color: var(--red);
		box-shadow: 0 0 0 4px color-mix(in srgb, var(--red) 15%, transparent);
	}
	.liam-search svg {
		width: 18px;
		height: 18px;
		flex: none;
		fill: none;
		stroke: var(--muted);
		stroke-width: 2;
		stroke-linecap: round;
	}
	.liam-search input {
		flex: 1;
		min-width: 0;
		border: 0;
		padding: 0;
		background: transparent;
		color: var(--ink);
		font: inherit;
		font-size: 0.95rem;
	}
	.liam-search input:focus {
		outline: none;
		box-shadow: none;
	}
	.liam-search input::placeholder {
		color: var(--muted);
	}
	.liam-search input::-webkit-search-cancel-button {
		display: none;
	}
	.hits {
		margin-top: 0.5rem;
	}
	.hits a {
		display: flex;
		align-items: baseline;
		gap: 0.65rem;
		padding: 0.45rem 0.6rem;
		border-radius: 6px;
		transition: background-color 0.15s;
	}
	.hits a.sel {
		background: var(--hair);
	}
	.hit-kind {
		flex: none;
		color: var(--red);
		font-family: var(--font-mono-hack);
		font-size: 0.72rem;
	}
	.hit-title {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.92rem;
	}
	.no-hit {
		margin-top: 0.6rem;
		color: var(--muted);
		font-size: 0.85rem;
	}

	/* Chapters */
	.chapter-card {
		width: 14rem;
		padding: 1.05rem 1rem 0.95rem;
	}
	.ch-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--muted);
		font-family: var(--font-mono-hack);
		font-size: 0.7rem;
		letter-spacing: 0.14em;
	}
	/* The chapter's bookmark colour, same ribbon as inside the book. */
	.ch-tab {
		width: 14px;
		height: 4px;
		border-radius: 2px;
		background: var(--c);
	}
	.ch-title {
		display: block;
		margin-top: 0.45rem;
		font-size: 1.55rem;
		font-weight: 700;
		line-height: 1.15;
	}
	.ch-sub {
		display: -webkit-box;
		margin-top: 0.35rem;
		overflow: hidden;
		color: var(--muted);
		font-size: 0.8rem;
		line-height: 1.5;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}
	.ch-go {
		display: block;
		margin-top: 0.55rem;
		color: var(--red);
		font-family: var(--font-mono-hack);
		font-size: 0.72rem;
		letter-spacing: 0.1em;
		opacity: 0;
		transform: translateX(-6px);
		transition:
			opacity 0.25s,
			transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.chapter-card:hover .ch-go,
	.chapter-card:focus-visible .ch-go {
		opacity: 1;
		transform: none;
	}

	/* Newest files: index cards */
	.file-card {
		width: 13rem;
		padding: 0.7rem 0.85rem 0.8rem;
		border-radius: 4px;
		background: var(--card);
		background-image: repeating-linear-gradient(
			180deg,
			transparent 0 1.35rem,
			color-mix(in srgb, #2b4c9b 14%, transparent) 1.35rem calc(1.35rem + 1px)
		);
		background-position: 0 1.4rem;
	}
	.file-meta {
		display: block;
		color: var(--red);
		font-family: var(--font-mono-hack);
		font-size: 0.68rem;
		letter-spacing: 0.06em;
	}
	.file-title {
		display: -webkit-box;
		margin-top: 0.3rem;
		overflow: hidden;
		font-size: 0.92rem;
		line-height: 1.35rem;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}

	/* Friends: polaroid faces */
	.friend-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
		width: 5rem;
	}
	.face {
		display: grid;
		place-items: center;
		width: 56px;
		height: 56px;
		overflow: hidden;
		border: 3px solid var(--card);
		border-radius: 50%;
		background: var(--card-2);
		box-shadow: var(--shadow);
		color: var(--muted);
		font-family: var(--font-display);
		font-size: 1.3rem;
		transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.face img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.friend-card:hover .face,
	.friend-card:focus-visible .face {
		transform: scale(1.12);
	}
	.unknown .face {
		border-style: dashed;
		border-color: var(--muted);
		background: transparent;
		box-shadow: none;
	}
	.lost .face {
		filter: grayscale(1);
		opacity: 0.6;
	}
	.friend-name {
		max-width: 100%;
		overflow: hidden;
		color: var(--muted);
		font-size: 0.76rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* ── The corner notes ── */
	.foot {
		position: absolute;
		inset: auto 0 0;
		z-index: 10;
		display: flex;
		justify-content: space-between;
		padding: 0.9rem clamp(1rem, 3vw, 2.2rem);
		color: var(--muted);
		font-family: var(--font-mono-hack);
		font-size: 0.72rem;
		letter-spacing: 0.08em;
		pointer-events: none;
	}
	.hint {
		transition: opacity 0.6s;
	}
	.touched .hint {
		opacity: 0;
	}

	/* ── Phones and narrow windows: a tall board ── */
	@media (max-width: 719px) {
		.board {
			min-height: 1340px;
		}
		.node {
			left: clamp(var(--half) + 0.75rem, var(--tx), 100% - var(--half) - 0.75rem);
			top: var(--ty);
			--half: 5rem;
		}
		.node.liam {
			--half: 10.5rem;
			top: calc(var(--ty) + 3.5rem);
		}
		.node.file {
			display: none;
		}
		.node.friend {
			--half: 2.4rem;
		}
		.liam-card {
			width: 21rem;
		}
		.chapter-card {
			width: 10rem;
			padding: 0.8rem 0.85rem;
		}
		.ch-title {
			font-size: 1.3rem;
		}
		.ch-sub {
			font-size: 0.74rem;
		}
		.hint {
			display: none;
		}
		.ghost {
			align-items: start;
			padding-top: 16rem;
			writing-mode: vertical-rl;
			font-size: 14rem;
		}
	}
	@media (max-width: 719px) and (max-width: 360px) {
		.liam-card {
			width: 19rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.string,
		.open .string {
			stroke-dashoffset: 0;
			transition: none;
		}
		.node > :not(.pin),
		.pin {
			opacity: 1;
			transform: none;
		}
		.open .node > *,
		.open .node > a.card,
		.open .node > .friend-card {
			transition: none;
		}
		.live i {
			animation: none;
		}
	}
</style>
