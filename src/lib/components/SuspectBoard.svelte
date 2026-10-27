<!--
	The homepage: 〈調查 Liam〉, an evidence board. Everything readable at a glance: each
	piece of evidence is pinned with a hand-written red-ink note saying what it
	tells you about Liam, grouped into 工作 / 思考 / 生活, strung to his photo.
	Clicking only takes you deeper (to the real page). A desk lamp follows the
	pointer; the case report folder opens a shareable dossier.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { contactEmail } from '$lib/social-links';
	import mark from '$lib/assets/logo-mark.jpg';
	import Download from '@lucide/svelte/icons/download';
	import X from '@lucide/svelte/icons/x';
	import type { SuspectBoardData } from '$lib/suspect-board';

	let { board: boardData }: { board: SuspectBoardData } = $props();
	const ev = $derived(boardData.evidence);

	type Id = 'badge' | 'project' | 'notes' | 'thinking' | 'gear' | 'diary' | 'tapes';

	interface Item {
		id: Id;
		letter: string;
		zone: '工作' | '思考' | '生活';
		/** Dossier field. */
		field: string;
		/** The red-ink note pinned beside it — the whole point, readable without clicking. */
		note: string;
		/** Longer line for the dossier. */
		finding: string;
		href: string;
		/** Board placement (desktop), centre of the item in %, width in px. */
		x: number;
		y: number;
		w: number;
		r: number;
		/** Where the note sits relative to the item. */
		noteAt: 'below' | 'right' | 'left' | 'above';
	}

	const SUSPECT = { x: 50, y: 46 };

	const items = $derived.by<Item[]>(() => [
		{
			id: 'badge',
			letter: 'A',
			zone: '工作',
			field: '職業',
			note: '2024 起在 MSI 做前端',
			finding: `在 ${ev.badge.org}當${ev.badge.role}，2024 年 8 月起。`,
			href: resolve('/about'),
			x: 17,
			y: 27,
			w: 220,
			r: -4,
			noteAt: 'below'
		},
		{
			id: 'project',
			letter: 'B',
			zone: '工作',
			field: '作風',
			note: '做完不算，好用才算',
			finding: '東西做完不算數，在意的是好不好用。',
			href: ev.project?.href ?? resolve('/portfolio'),
			x: 16,
			y: 66,
			w: 210,
			r: 3,
			noteAt: 'below'
		},
		{
			id: 'notes',
			letter: 'C',
			zone: '思考',
			field: '解題方式',
			note: '卡關會追到底，再寫成筆記',
			finding: '卡關時不猜，自己量測、追到根源，再把過程寫下來。',
			href: boardData.notes[0]?.href ?? resolve('/blog'),
			x: 82,
			y: 29,
			w: 250,
			r: 2.5,
			noteAt: 'below'
		},
		{
			id: 'thinking',
			letter: 'D',
			zone: '思考',
			field: '最近在想',
			note: '腦袋裡轉的事',
			finding: ev.note.thinking || '最近在想的事，都寫在近況裡。',
			href: resolve('/now'),
			x: 84,
			y: 68,
			w: 190,
			r: -3,
			noteAt: 'left'
		},
		{
			id: 'gear',
			letter: 'E',
			zone: '生活',
			field: '工作習慣',
			note: '手感派 ✓',
			finding: '手感派：鍵盤、滑鼠都挑過，桌上什麼都講究手感。',
			href: resolve('/setup'),
			x: 33,
			y: 86,
			w: 180,
			r: -2,
			noteAt: 'above'
		},
		{
			id: 'diary',
			letter: 'F',
			zone: '生活',
			field: '個性',
			note: '也會寫生活和心情',
			finding: '會把生活和心情老實寫下來，不只寫技術。',
			href: ev.mood?.href ?? resolve('/blog'),
			x: 52,
			y: 88,
			w: 200,
			r: 1.5,
			noteAt: 'above'
		},
		{
			id: 'tapes',
			letter: 'G',
			zone: '生活',
			field: '下班後',
			note: ev.tapes[0] ? `最近在看《${ev.tapes[0].title}》` : '下班追劇中',
			finding: ev.tapes[0]
				? `下班會追劇，最近在看《${ev.tapes[0].title}》。`
				: '下班會追劇，看過的都有紀錄。',
			href: resolve('/watch'),
			x: 70,
			y: 86,
			w: 220,
			r: 3,
			noteAt: 'above'
		}
	]);

	const zones = [
		{ name: '工作', x: 17, y: 7 },
		{ name: '思考', x: 82, y: 7 },
		{ name: '生活', x: 12, y: 87 }
	] as const;

	// ── Lamp + tilt, following the pointer over the board ──
	let board: HTMLElement | undefined = $state();
	let inner: HTMLElement | undefined = $state();

	// Where each string attaches, in % of the board: the pin on top of each item
	// and on the suspect photo. Measured from layout (offset sizes ignore the
	// tilt and drop-in transforms), re-measured when the board resizes.
	let anchors = $state<Record<string, { x: number; y: number }>>({});
	$effect(() => {
		const el = inner;
		if (!el) return;
		const measure = () => {
			const H = el.offsetHeight;
			// Hidden (the phone layout shows the thread view instead): nothing to measure.
			if (H === 0) return;
			const next: Record<string, { x: number; y: number }> = {};
			for (const node of el.querySelectorAll<HTMLElement>('[data-anchor]')) {
				const top = parseFloat(node.style.top);
				const left = parseFloat(node.style.left);
				next[node.dataset.anchor!] = { x: left, y: top - ((node.offsetHeight / 2 - 4) / H) * 100 };
			}
			anchors = next;
		};
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		return () => ro.disconnect();
	});
	let hovered = $state<Id | null>(null);
	let frame = 0;
	function onPointer(e: PointerEvent) {
		if (!board || e.pointerType !== 'mouse') return;
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(() => {
			const r = board!.getBoundingClientRect();
			const px = (e.clientX - r.left) / r.width;
			const py = (e.clientY - r.top) / r.height;
			board!.style.setProperty('--mx', `${px * 100}%`);
			board!.style.setProperty('--my', `${py * 100}%`);
			board!.style.setProperty('--tx', `${(px - 0.5) * 2.4}deg`);
			board!.style.setProperty('--ty', `${(0.5 - py) * 2}deg`);
		});
	}
	function onLeave() {
		board?.style.setProperty('--tx', '0deg');
		board?.style.setProperty('--ty', '0deg');
		hovered = null;
	}

	// ── Dossier ──
	let dossierOpen = $state(false);
	const caseNo = 'CASE № 0819';

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Escape') dossierOpen = false;
	}

	async function downloadDossier() {
		const W = 1080;
		const H = 1350;
		const canvas = document.createElement('canvas');
		canvas.width = W;
		canvas.height = H;
		const ctx = canvas.getContext('2d')!;
		const load = (src: string) =>
			new Promise<HTMLImageElement>((ok, fail) => {
				const img = new Image();
				img.onload = () => ok(img);
				img.onerror = fail;
				img.src = src;
			});
		await document.fonts.ready;
		const sans = "'LXGW WenKai TC', 'PingFang TC', 'Microsoft JhengHei', sans-serif";
		const mono = "'Share Tech Mono', ui-monospace, monospace";

		ctx.fillStyle = '#efe3c4';
		ctx.fillRect(0, 0, W, H);
		ctx.fillStyle = '#f8f1df';
		ctx.fillRect(48, 48, W - 96, H - 96);
		ctx.strokeStyle = 'rgba(90,130,170,0.18)';
		for (let y = 300; y < H - 120; y += 56) {
			ctx.beginPath();
			ctx.moveTo(48, y);
			ctx.lineTo(W - 48, y);
			ctx.stroke();
		}
		ctx.fillStyle = '#b3362b';
		ctx.fillRect(48, 48, W - 96, 10);
		ctx.fillStyle = '#8a6d45';
		ctx.font = `26px ${mono}`;
		ctx.fillText(`${caseNo} · 結案報告`, 96, 120);
		ctx.fillStyle = '#2c2118';
		ctx.font = `bold 64px ${sans}`;
		ctx.fillText('嫌疑人：Liam', 96, 200);
		ctx.fillStyle = '#6b5336';
		ctx.font = `32px ${sans}`;
		ctx.fillText('本名 李俊逸 · 前端工程師', 96, 252);

		try {
			const photo = await load(mark);
			const size = 220;
			ctx.save();
			ctx.translate(W - 96 - size, 110);
			ctx.rotate(0.04);
			ctx.fillStyle = '#fff';
			ctx.fillRect(-12, -12, size + 24, size + 60);
			ctx.drawImage(photo, 0, 0, size, size);
			ctx.restore();
		} catch {
			// No photo; the report is still valid.
		}

		let y = 440;
		for (const c of items) {
			ctx.fillStyle = '#b3362b';
			ctx.font = `24px ${mono}`;
			ctx.fillText(`證物 ${c.letter} · ${c.field}`, 96, y);
			ctx.fillStyle = '#2c2118';
			ctx.font = `34px ${sans}`;
			let line = '';
			let ly = y + 46;
			for (const ch of c.finding) {
				if (ctx.measureText(line + ch).width > W - 220) {
					ctx.fillText(line, 96, ly);
					line = ch;
					ly += 44;
				} else line += ch;
			}
			ctx.fillText(line, 96, ly);
			y = ly + 70;
		}
		ctx.fillStyle = '#8a6d45';
		ctx.font = `26px ${mono}`;
		ctx.fillText('blog.doraeyi.com', 96, H - 96);
		try {
			const seal = await load('/favicon.svg');
			ctx.save();
			ctx.translate(W - 270, H - 280);
			ctx.rotate(-0.16);
			ctx.globalAlpha = 0.92;
			ctx.drawImage(seal, 0, 0, 170, 170);
			ctx.restore();
		} catch {
			// No seal; still downloads.
		}
		const a = document.createElement('a');
		a.download = 'liam-case-report.png';
		a.href = canvas.toDataURL('image/png');
		a.click();
	}
</script>

<svelte:window onkeydown={onKey} />

{#snippet art(c: Item)}
	{#if c.id === 'badge'}
		<div class="art badge">
			<div class="badge-top font-mono-hack">MSI · STAFF</div>
			<div class="flex items-center gap-3 p-3">
				<img src={mark} alt="" class="size-14 rounded-sm object-cover" />
				<div class="min-w-0 text-left">
					<p class="font-display text-base text-case-900">Liam</p>
					<p class="text-[11px] text-case-700">{ev.badge.role}</p>
					<p class="font-mono-hack text-[10px] text-case-600">SINCE {ev.badge.since}</p>
				</div>
			</div>
			<div class="barcode" aria-hidden="true"></div>
		</div>
	{:else if c.id === 'project'}
		<div class="art bag">
			<div class="bag-zip" aria-hidden="true"></div>
			<div class="bag-label">
				<p class="font-mono-hack text-[10px] tracking-widest text-stamp-600">EVIDENCE · 作品</p>
				<p class="mt-1 truncate font-display text-base text-case-900">
					{ev.project?.name ?? '作品集'}
				</p>
				{#if ev.project?.description}
					<p class="mt-0.5 line-clamp-2 text-[11px] leading-4 text-case-700">
						{ev.project.description}
					</p>
				{/if}
			</div>
		</div>
	{:else if c.id === 'notes'}
		<div class="art paper">
			<p class="font-mono-hack text-[10px] tracking-widest text-case-600">
				FIELD NOTES · 最近的筆記
			</p>
			<ol class="mt-2 space-y-1.5">
				{#each boardData.notes as n, i (n.href)}
					<li class="flex gap-2 text-[13px] leading-snug text-case-900">
						<span class="font-mono-hack text-[10px] text-stamp-600">0{i + 1}</span>
						<span class="line-clamp-2">{n.title}</span>
					</li>
				{/each}
			</ol>
		</div>
	{:else if c.id === 'thinking'}
		<div class="art sticky">
			<p class="hand text-[15px] leading-snug text-case-900">{ev.note.thinking || '……'}</p>
		</div>
	{:else if c.id === 'gear'}
		<div class="art polaroid-art">
			{#if ev.gear[0]}
				<img src={ev.gear[0].photo} alt="" class="aspect-[4/3] w-full object-contain p-1.5" />
				<p class="mt-1 truncate text-center font-display text-xs text-case-800">
					{ev.gear[0].name}
				</p>
			{/if}
		</div>
	{:else if c.id === 'diary'}
		<div class="art diary">
			<p class="font-mono-hack text-[10px] tracking-widest text-case-600">
				{ev.mood ? ev.mood.date.toLocaleDateString('zh-TW') : 'DIARY'}
			</p>
			<p class="hand mt-1 line-clamp-3 text-[14px] leading-6 text-case-900">
				{ev.mood?.excerpt || ev.mood?.title || '今天……'}
			</p>
		</div>
	{:else}
		<div class="art tapes">
			<p class="font-mono-hack text-[10px] tracking-widest text-red-300">● REC · CAM 02</p>
			<div class="mt-1.5 grid grid-cols-3 gap-1">
				{#each ev.tapes.length ? ev.tapes : [{ title: '?', poster: null }] as t (t.title)}
					{#if t.poster}
						<img
							src={t.poster}
							alt=""
							class="aspect-[2/3] w-full object-cover contrast-125 grayscale"
						/>
					{:else}
						<span
							class="flex aspect-[2/3] items-center justify-center bg-black/40 text-[10px] text-white/60"
							>{t.title}</span
						>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
{/snippet}

<div class="page relative">
	<h1 class="sr-only">Liam — 前端工程師的偵探手記：在 MSI 做前端，在意細節、卡關會追到底</h1>
	<section class="mx-auto max-w-[1240px] px-4 pt-24 pb-16 sm:px-6">
		<!-- ════ Desktop: the board ════ -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			bind:this={board}
			class="board"
			onpointermove={onPointer}
			onpointerleave={onLeave}
			style="--mx: 50%; --my: 40%; --tx: 0deg; --ty: 0deg"
		>
			<div class="board-inner" bind:this={inner}>
				<!-- Title strip -->
				<div class="title-strip" style="left: 50%; top: 7%">
					<p class="font-mono-hack text-[10px] tracking-[0.35em] text-case-700">{caseNo}</p>
					<p class="font-display text-lg text-case-900">調查對象：LIAM</p>
				</div>

				<!-- Zone labels -->
				{#each zones as z, i (z.name)}
					<span class="zone font-display" style="left: {z.x}%; top: {z.y}%; --i: {i}">{z.name}</span
					>
				{/each}

				<!-- Strings -->
				<svg class="strings" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
					{#each items as c, i (c.id)}
						<line
							x1={anchors[c.id]?.x ?? c.x}
							y1={anchors[c.id]?.y ?? c.y - 8}
							x2={anchors.suspect?.x ?? SUSPECT.x}
							y2={anchors.suspect?.y ?? SUSPECT.y - 19}
							class="string"
							class:lit={hovered === c.id}
							class:dim={hovered !== null && hovered !== c.id}
							style="--i: {i}"
							vector-effect="non-scaling-stroke"
						/>
					{/each}
				</svg>

				<!-- Suspect -->
				<div class="suspect" data-anchor="suspect" style="left: {SUSPECT.x}%; top: {SUSPECT.y}%">
					<span class="pin" aria-hidden="true"></span>
					<div class="suspect-photo">
						<img src={mark} alt="Liam 的 L 字標誌" class="size-full object-cover" />
					</div>
					<div class="suspect-tag">
						<span class="font-display text-xl text-case-900">Liam</span>
						<span class="font-mono-hack text-[10px] tracking-[0.2em] text-case-700"
							>前端工程師 · MSI</span
						>
					</div>
					<p class="summary hand">在意細節、卡關會追到底，<br />也會老實寫下生活的人。</p>
				</div>

				<!-- Evidence -->
				{#each items as c, i (c.id)}
					<!-- eslint-disable svelte/no-navigation-without-resolve -- hrefs are resolved when the items are built -->
					<a
						href={c.href}
						class="evidence note-{c.noteAt}"
						data-anchor={c.id}
						style="left: {c.x}%; top: {c.y}%; width: {c.w}px; --r: {c.r}deg; --i: {i}"
						onpointerenter={() => (hovered = c.id)}
						onpointerleave={() => (hovered = null)}
						onfocus={() => (hovered = c.id)}
						onblur={() => (hovered = null)}
						aria-label="證物 {c.letter}（{c.zone}）：{c.note}"
					>
						<span class="evidence-body">
							<span class="tack" aria-hidden="true"></span>
							<span class="tag font-mono-hack">證物 {c.letter}</span>
							{@render art(c)}
						</span>
						<span class="ink hand">{c.note}</span>
					</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				{/each}

				<!-- Case report folder -->
				<button
					type="button"
					class="folder-btn"
					style="left: 89%; top: 88%"
					onclick={() => (dossierOpen = true)}
				>
					<span class="folder-tab font-mono-hack">REPORT</span>
					<span class="font-display text-sm text-case-900">結案報告</span>
					<span class="font-mono-hack text-[10px] text-case-700">點開・可下載</span>
				</button>

				<div class="lamp" aria-hidden="true"></div>
			</div>
		</div>

		<!-- ════ Mobile: the same board, as one thread down the page ════ -->
		<div class="thread-view">
			<div class="m-suspect">
				<div class="suspect-photo mx-auto">
					<img src={mark} alt="Liam 的 L 字標誌" class="size-full object-cover" />
				</div>
				<div class="mt-3 text-center">
					<span class="block font-display text-2xl text-ink">Liam</span>
					<span class="font-mono-hack text-[11px] tracking-[0.2em] text-ink-muted"
						>前端工程師 · MSI</span
					>
				</div>
				<p class="hand mt-2 text-center text-[15px] text-stamp-500">
					在意細節、卡關會追到底，也會老實寫下生活的人。
				</p>
			</div>
			{#each ['工作', '思考', '生活'] as zone (zone)}
				<p class="m-zone font-display">{zone}</p>
				<ul class="m-list">
					{#each items.filter((c) => c.zone === zone) as c (c.id)}
						<li>
							<!-- eslint-disable svelte/no-navigation-without-resolve -- hrefs are resolved when the items are built -->
							<a href={c.href} class="m-item" style="--r: {c.r / 2}deg">
								<span class="m-art">{@render art(c)}</span>
								<span class="hand m-ink">{c.note}</span>
							</a>
							<!-- eslint-enable svelte/no-navigation-without-resolve -->
						</li>
					{/each}
				</ul>
			{/each}
			<button type="button" class="m-report" onclick={() => (dossierOpen = true)}
				>打開結案報告</button
			>
		</div>

		<!-- Ways out -->
		<nav
			class="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm"
			aria-label="繼續調查"
		>
			<a
				href={resolve('/blog')}
				class="rounded-full bg-accent px-5 py-2 text-white transition hover:bg-accent-strong"
				>翻他的案件簿</a
			>
			<a
				href={resolve('/about')}
				class="rounded-full border border-border-case px-5 py-2 text-ink transition hover:border-accent hover:text-accent"
				>完整人物檔案</a
			>
			<a
				href="mailto:{contactEmail}"
				class="rounded-full border border-border-case px-5 py-2 text-ink transition hover:border-accent hover:text-accent"
				>聯絡他</a
			>
		</nav>
	</section>

	<!-- ════ Dossier ════ -->
	{#if dossierOpen}
		<div class="fixed inset-0 z-50 overflow-y-auto px-4 py-10" transition:fade={{ duration: 200 }}>
			<button
				type="button"
				class="fixed inset-0 bg-case-950/80 backdrop-blur-sm"
				aria-label="關閉"
				onclick={() => (dossierOpen = false)}
			></button>
			<div
				class="dossier relative mx-auto max-w-2xl rounded-sm px-6 pt-8 pb-8 sm:px-10"
				role="dialog"
				aria-modal="true"
				aria-label="結案報告"
				in:fly={{ y: 30, duration: 450, easing: cubicOut }}
			>
				<button
					type="button"
					class="absolute top-3 right-3 rounded-full p-1.5 text-case-700 hover:bg-black/5"
					aria-label="關閉"
					onclick={() => (dossierOpen = false)}
				>
					<X class="size-5" />
				</button>
				<div class="flex items-start gap-5">
					<div class="min-w-0 flex-1">
						<p class="font-mono-hack text-[11px] tracking-[0.3em] text-case-700">
							{caseNo} · 結案報告
						</p>
						<h2 class="mt-2 font-display text-3xl text-case-900">嫌疑人：Liam</h2>
						<p class="mt-1 text-sm text-case-700">本名李俊逸 · 前端工程師</p>
					</div>
					<div class="polaroid shrink-0">
						<img src={mark} alt="" class="size-24 object-cover" />
					</div>
				</div>
				<dl class="mt-6 space-y-3">
					{#each items as c (c.id)}
						<div
							class="grid grid-cols-[5.5rem_1fr] gap-3 border-b border-dashed border-case-300 pb-3 text-sm"
						>
							<dt class="font-mono-hack text-[11px] tracking-widest text-stamp-600">{c.field}</dt>
							<dd class="leading-6 text-case-900">{c.finding}</dd>
						</div>
					{/each}
				</dl>
				<div class="mt-7 flex flex-wrap gap-2.5">
					<button
						type="button"
						onclick={downloadDossier}
						class="inline-flex items-center gap-1.5 rounded-full bg-stamp-500 px-4 py-2 text-sm text-white hover:bg-stamp-600"
					>
						<Download class="size-4" /> 下載結案報告
					</button>
					<a
						href="mailto:{contactEmail}"
						class="rounded-full border border-case-400 px-4 py-2 text-sm text-case-900 hover:border-stamp-500"
						>聘用這位嫌疑人</a
					>
					<a
						href="{resolve('/friends')}#apply"
						class="rounded-full border border-case-400 px-4 py-2 text-sm text-case-900 hover:border-stamp-500"
						>成為線人</a
					>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.hand {
		font-family: 'LXGW WenKai TC', var(--font-display);
	}

	/* ════ Board ════ */
	.board {
		display: none;
		perspective: 1800px;
	}
	.board-inner {
		position: relative;
		height: 820px;
		border-radius: 6px;
		transform: rotateX(var(--ty)) rotateY(var(--tx));
		transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
		background:
			radial-gradient(circle at 20% 30%, rgba(0, 0, 0, 0.13) 0 1px, transparent 2px) 0 0 / 9px 9px,
			radial-gradient(circle at 70% 60%, rgba(255, 255, 255, 0.07) 0 1px, transparent 2px) 0 0 /
				13px 13px,
			linear-gradient(135deg, #bb905f, #a77d4e 55%, #b58b5b);
		box-shadow:
			inset 0 0 0 12px #6b4f33,
			inset 0 0 0 14px #3a2b1d,
			inset 0 14px 50px rgba(0, 0, 0, 0.35),
			0 40px 80px -40px rgba(0, 0, 0, 0.7);
	}
	@media (min-width: 1024px) {
		.board {
			display: block;
		}
		.thread-view {
			display: none;
		}
	}

	/* The desk lamp: darkens the board away from the pointer. */
	.lamp {
		position: absolute;
		inset: 0;
		border-radius: 6px;
		pointer-events: none;
		background: radial-gradient(
			circle 520px at var(--mx) var(--my),
			rgba(255, 220, 160, 0.1),
			transparent 45%,
			rgba(20, 12, 6, 0.38) 100%
		);
		mix-blend-mode: multiply;
		transition: background-position 0.2s;
	}

	.title-strip {
		position: absolute;
		z-index: 3;
		translate: -50% -50%;
		rotate: -1deg;
		padding: 6px 22px 8px;
		text-align: center;
		background: #f4ead2;
		box-shadow: 0 6px 14px -6px rgba(0, 0, 0, 0.5);
		animation: drop 0.6s 0.05s cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
	}
	.title-strip::before,
	.title-strip::after {
		/* masking tape */
		content: '';
		position: absolute;
		top: -9px;
		width: 46px;
		height: 18px;
		background: rgba(240, 225, 180, 0.75);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
	}
	.title-strip::before {
		left: -14px;
		rotate: -18deg;
	}
	.title-strip::after {
		right: -14px;
		rotate: 16deg;
	}

	.zone {
		position: absolute;
		z-index: 3;
		translate: -50% -50%;
		padding: 2px 14px;
		background: #2c2118;
		color: #f4ead2;
		font-size: 0.95rem;
		letter-spacing: 0.4em;
		box-shadow: 0 4px 10px -4px rgba(0, 0, 0, 0.6);
		rotate: -2deg;
		animation: drop 0.5s calc(0.15s + var(--i) * 0.08s) cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
	}

	/* Strings */
	.strings {
		position: absolute;
		inset: 0;
		z-index: 1;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}
	.string {
		stroke: #b8261b;
		stroke-width: 1.6;
		stroke-dasharray: 1600;
		stroke-dashoffset: 1600;
		filter: drop-shadow(0 1.5px 1px rgba(0, 0, 0, 0.35));
		animation: string 0.9s calc(0.75s + var(--i) * 0.09s) cubic-bezier(0.5, 0, 0.2, 1) forwards;
		transition:
			stroke-width 0.2s,
			opacity 0.2s,
			stroke 0.2s;
	}
	.string.lit {
		stroke: #e3402f;
		stroke-width: 2.6;
	}
	.string.dim {
		opacity: 0.35;
	}
	@keyframes string {
		to {
			stroke-dashoffset: 0;
		}
	}

	/* Suspect */
	.suspect {
		position: absolute;
		z-index: 2;
		width: 230px;
		margin: 0;
		translate: -50% -50%;
		animation: drop 0.6s 0.1s cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
	}
	.suspect-photo {
		width: 200px;
		height: 230px;
		overflow: hidden;
		margin: 0 auto;
		border: 10px solid #fbf7ee;
		border-bottom-width: 12px;
		background: radial-gradient(circle at 50% 35%, #f6ecd6, #e2d2ad);
		box-shadow: 0 18px 34px -12px rgba(0, 0, 0, 0.65);
		rotate: -1.5deg;
	}
	.suspect .pin,
	.tack {
		position: absolute;
		z-index: 4;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: radial-gradient(circle at 35% 30%, #ff8f80, #b3362b 60%, #6a1d16);
		box-shadow: 0 3px 3px rgba(0, 0, 0, 0.45);
	}
	.suspect .pin {
		top: -6px;
		left: 50%;
		translate: -50% 0;
	}
	.suspect-tag {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		width: fit-content;
		margin: -14px auto 0;
		padding: 4px 18px 6px;
		background: #f4ead2;
		box-shadow: 0 6px 12px -6px rgba(0, 0, 0, 0.5);
		rotate: 1.5deg;
	}
	.summary {
		width: fit-content;
		margin: 12px auto 0;
		padding: 6px 14px 8px;
		text-align: center;
		font-size: 15px;
		line-height: 1.6;
		color: #6a1d16;
		background:
			repeating-linear-gradient(to bottom, transparent 0 23px, rgba(90, 130, 170, 0.18) 23px 24px),
			#f8f1df;
		box-shadow: 0 8px 14px -8px rgba(0, 0, 0, 0.5);
		rotate: -1deg;
		clip-path: inset(0 100% 0 0);
		animation: write 1.1s 1.6s steps(24, end) forwards;
	}

	/* Evidence */
	.evidence {
		position: absolute;
		z-index: 2;
		display: block;
		translate: -50% -50%;
		animation: drop 0.55s calc(0.25s + var(--i) * 0.07s) cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
	}
	.evidence-body {
		position: relative;
		display: block;
		rotate: var(--r);
		filter: drop-shadow(0 9px 10px rgba(0, 0, 0, 0.38));
		transition:
			transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
			filter 0.3s;
	}
	.evidence:hover .evidence-body,
	.evidence:focus-visible .evidence-body {
		transform: translateY(-8px) scale(1.04) rotate(calc(var(--r) * -0.8));
		filter: drop-shadow(0 20px 18px rgba(0, 0, 0, 0.42));
	}
	.evidence:focus-visible {
		outline: none;
	}
	.evidence:focus-visible .art {
		box-shadow: 0 0 0 3px #e3402f;
	}
	.tack {
		top: -6px;
		left: 50%;
		translate: -50% 0;
	}
	.tag {
		position: absolute;
		z-index: 3;
		top: 10px;
		right: -10px;
		padding: 1px 7px;
		background: #f4ead2;
		color: #74211a;
		font-size: 9px;
		letter-spacing: 0.2em;
		rotate: 6deg;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
		white-space: nowrap;
	}

	/* The red-ink note: written in once the strings are up. */
	/* A torn scrap of paper with the note in red ink. */
	.ink {
		position: absolute;
		z-index: 3;
		width: max-content;
		white-space: nowrap;
		padding: 3px 10px 4px;
		background: #f6eedb;
		color: #8e1d12;
		font-size: 15px;
		line-height: 1.35;
		box-shadow: 0 4px 8px -4px rgba(0, 0, 0, 0.45);
		clip-path: inset(0 100% 0 0);
		animation: write 0.8s calc(1.5s + var(--i) * 0.12s) steps(14, end) forwards;
	}
	.ink::before {
		content: '↖ ';
		color: #b3362b;
	}
	.note-below .ink {
		top: calc(100% + 8px);
		left: 14px;
		rotate: -2deg;
	}
	.note-above .ink {
		bottom: calc(100% + 10px);
		left: 10px;
		rotate: -2deg;
	}
	.note-above .ink::before {
		content: '↙ ';
	}
	.note-right .ink {
		top: 30%;
		left: calc(100% + 12px);
		rotate: 3deg;
	}
	.note-right .ink::before {
		content: '← ';
	}
	.note-left .ink {
		top: 30%;
		right: calc(100% + 12px);
		rotate: -3deg;
		text-align: right;
	}
	.note-left .ink::before {
		content: '';
	}
	.note-left .ink::after {
		content: ' →';
		color: #b3362b;
	}

	.folder-btn {
		position: absolute;
		z-index: 2;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 2px;
		width: 150px;
		padding: 18px 14px 12px;
		translate: -50% -50%;
		rotate: 4deg;
		border-radius: 2px 6px 6px 6px;
		background: linear-gradient(160deg, #ecdcae, #d9c38d);
		box-shadow: 0 12px 18px -8px rgba(0, 0, 0, 0.55);
		transition: transform 0.25s;
		animation: drop 0.55s 0.8s cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
	}
	.folder-btn:hover {
		transform: translateY(-6px) rotate(-3deg);
	}
	.folder-tab {
		position: absolute;
		top: -14px;
		left: 10px;
		padding: 2px 10px;
		border-radius: 5px 5px 0 0;
		background: #d9c38d;
		color: #6b5336;
		font-size: 9px;
		letter-spacing: 0.2em;
	}

	@keyframes drop {
		from {
			opacity: 0;
			transform: translateY(-26px) scale(1.04);
		}
	}
	@keyframes write {
		to {
			clip-path: inset(0 0 0 0);
		}
	}

	/* ════ Evidence art (shared by both layouts) ════ */
	.art {
		position: relative;
		display: block;
		text-align: left;
	}
	.badge {
		overflow: hidden;
		border-radius: 8px;
		background: #fbfaf6;
	}
	.badge-top {
		padding: 4px 10px;
		background: #b3362b;
		color: #fff;
		font-size: 10px;
		letter-spacing: 0.25em;
	}
	.barcode {
		height: 14px;
		margin: 0 12px 10px;
		background: repeating-linear-gradient(
			90deg,
			#2c2118 0 2px,
			transparent 2px 4px,
			#2c2118 4px 5px,
			transparent 5px 8px
		);
		opacity: 0.7;
	}
	.bag {
		padding: 18px 12px 14px;
		border-radius: 4px;
		background: linear-gradient(160deg, rgba(255, 255, 255, 0.6), rgba(220, 230, 235, 0.38));
		border: 1px solid rgba(255, 255, 255, 0.65);
	}
	.bag-zip {
		position: absolute;
		top: 6px;
		left: 6px;
		right: 6px;
		height: 4px;
		border-radius: 2px;
		background: #c0392b;
		opacity: 0.8;
	}
	.bag-label {
		padding: 8px 10px;
		background: #fbfaf6;
		border: 1px dashed #c2a877;
	}
	.paper {
		padding: 14px 14px 16px;
		background:
			repeating-linear-gradient(to bottom, transparent 0 21px, rgba(90, 130, 170, 0.18) 21px 22px),
			#fbf6e8;
	}
	.sticky {
		padding: 16px 14px 20px;
		background: linear-gradient(180deg, #f9e27d, #f2d257);
	}
	.polaroid-art {
		padding: 8px 8px 10px;
		background: #fbfaf6;
	}
	.diary {
		padding: 12px 14px 22px;
		background: #f6ecd2;
		clip-path: polygon(
			0 0,
			100% 0,
			100% 88%,
			92% 94%,
			84% 89%,
			74% 96%,
			63% 90%,
			52% 97%,
			41% 91%,
			30% 97%,
			19% 90%,
			9% 96%,
			0 90%
		);
	}
	.tapes {
		padding: 8px;
		background: #1d1714;
		border: 1px solid #000;
	}

	/* ════ Mobile thread ════ */
	.thread-view {
		position: relative;
		padding: 8px 0 8px 22px;
	}
	.thread-view::before {
		/* the red string running down the page */
		content: '';
		position: absolute;
		top: 120px;
		bottom: 40px;
		left: 7px;
		width: 2px;
		background: #b8261b;
		box-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
	}
	.m-suspect {
		margin: 0 0 8px -22px;
	}
	.m-zone {
		position: relative;
		width: fit-content;
		margin: 28px 0 12px;
		padding: 2px 12px;
		background: var(--color-ink);
		color: var(--color-surface);
		letter-spacing: 0.4em;
	}
	.m-zone::before {
		content: '';
		position: absolute;
		left: -21px;
		top: 50%;
		width: 12px;
		height: 12px;
		translate: 0 -50%;
		border-radius: 50%;
		background: radial-gradient(circle at 35% 30%, #ff8f80, #b3362b 60%, #6a1d16);
	}
	.m-list {
		display: grid;
		gap: 22px;
	}
	.m-item {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 0.8fr);
		align-items: center;
		gap: 14px;
	}
	.m-art {
		display: block;
		rotate: var(--r);
		filter: drop-shadow(0 8px 10px rgba(0, 0, 0, 0.3));
	}
	.m-ink {
		color: var(--color-accent);
		font-size: 16px;
		line-height: 1.4;
	}
	.m-ink::before {
		content: '← ';
	}
	.m-report {
		margin-top: 28px;
		width: 100%;
		padding: 12px;
		border: 1px dashed var(--color-border-case);
		border-radius: 6px;
		color: var(--color-ink);
		font-family: var(--font-display);
	}

	/* ════ Dossier ════ */
	.dossier {
		background:
			repeating-linear-gradient(to bottom, transparent 0 27px, rgba(90, 130, 170, 0.16) 27px 28px),
			#f8f1df;
		color: #2c2118;
		box-shadow: 0 40px 80px -30px rgba(0, 0, 0, 0.7);
	}
	.polaroid {
		padding: 6px 6px 18px;
		background: #fff;
		box-shadow: 0 8px 18px -8px rgba(0, 0, 0, 0.5);
		rotate: 3deg;
	}

	@media (prefers-reduced-motion: reduce) {
		.board-inner {
			transform: none;
		}
		.title-strip,
		.zone,
		.suspect,
		.evidence,
		.folder-btn {
			animation: none;
		}
		.string {
			animation: none;
			stroke-dashoffset: 0;
		}
		.ink,
		.summary {
			animation: none;
			clip-path: none;
		}
	}
</style>
