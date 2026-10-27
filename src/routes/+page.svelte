<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import { resolve } from '$app/paths';
	import { reveal } from '$lib/actions/reveal';
	import { contactEmail } from '$lib/social-links';
	import { timeAgo } from '$lib/format';
	import SuspectBoard from '$lib/components/SuspectBoard.svelte';
	import { magnetic } from '$lib/actions/magnetic';
	import Mail from '@lucide/svelte/icons/mail';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const stampDate = (d: Date) =>
		`${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;

	// Case line: each post is a pin on a red thread, placed by how far into the year it landed.
	const yearStart = $derived(new Date(data.year, 0, 1).getTime());
	const yearLength = $derived(new Date(data.year + 1, 0, 1).getTime() - yearStart);
	const yearProgress = $derived(Math.min(1, (Date.now() - yearStart) / yearLength));
	const months = Array.from({ length: 12 }, (_, i) => i + 1);
	let hoveredPin = $state<number | null>(null);

	// Fanned cards: outer two lean out, the middle one stands straight.
	const fan = ['-4deg', '1.5deg', '5deg'];
	const noteTilt = ['-2deg', '1.5deg', '-1deg'];
</script>

<Seo />

<!-- The cover: an evidence board that says who Liam is at a glance. -->
<SuspectBoard board={data.board} />

<!-- Latest files: three index cards fanned out on the desk -->
<section id="latest" class="px-6 py-24">
	<div class="mx-auto max-w-5xl">
		<div class="flex items-end justify-between" use:reveal>
			<h2 class="font-display text-2xl text-ink sm:text-3xl">最新卷宗</h2>
			<a
				href={resolve('/blog')}
				class="group flex items-center gap-1 text-sm text-ink-muted hover:text-accent"
			>
				打開案件簿 <ArrowRight class="size-3.5 transition group-hover:translate-x-0.5" />
			</a>
		</div>

		{#if data.recent.length === 0}
			<p class="mt-8 font-mono-hack text-sm text-ink-muted">抽屜還是空的。</p>
		{:else}
			<ol class="fan mt-12 grid gap-6 md:grid-cols-3 md:gap-0">
				{#each data.recent.slice(0, 3) as item, i (item.path)}
					<li
						class="fan-slot"
						style="--tilt: {fan[i]}; --z: {3 - Math.abs(1 - i)}"
						use:reveal={{ delay: i * 90, y: 24 }}
					>
						<article class="index-card fan-card rounded-sm px-6 pt-5 pb-9">
							<div class="flex items-start justify-between gap-3">
								<span class="font-mono-hack text-[0.65rem] tracking-widest text-case-600">
									{item.kindLabel}
								</span>
								<span class="date-stamp">{stampDate(item.date)}</span>
							</div>
							<h3
								class="mt-3 border-b-2 border-stamp-400/60 pb-2 font-display text-lg leading-snug text-case-900"
							>
								<!-- eslint-disable svelte/no-navigation-without-resolve -- item.path is a full app path -->
								<a href={item.path} class="after:absolute after:inset-0">{item.title}</a>
								<!-- eslint-enable svelte/no-navigation-without-resolve -->
							</h3>
							<p class="mt-3 font-mono-hack text-xs text-case-600">建檔於 {timeAgo(item.date)}</p>
							<span aria-hidden="true" class="punch"></span>
						</article>
					</li>
				{/each}
			</ol>
		{/if}
	</div>
</section>

<!-- Field notes: sticky notes taped to the edge of the desk -->
<section class="px-6 pb-24">
	<div class="mx-auto max-w-5xl">
		<div class="flex items-end justify-between" use:reveal>
			<h2 class="font-display text-2xl text-ink sm:text-3xl">現場筆記</h2>
			<a
				href={resolve('/thinking')}
				class="group flex items-center gap-1 text-sm text-ink-muted hover:text-accent"
			>
				全部筆記 <ArrowRight class="size-3.5 transition group-hover:translate-x-0.5" />
			</a>
		</div>
		<ul class="mt-10 grid gap-8 sm:grid-cols-3">
			{#if data.thoughts.length === 0}
				<li class="note" style="--tilt: -2deg" use:reveal>
					<p class="font-display text-base text-case-900">最近很安靜。</p>
					<p class="mt-3 font-mono-hack text-[0.7rem] text-case-700">—— 沒有新的現場</p>
				</li>
			{:else}
				{#each data.thoughts as t, i (t.id)}
					<li class="note" style="--tilt: {noteTilt[i]}" use:reveal={{ delay: i * 80, y: 16 }}>
						<a href={resolve('/thinking')} class="block">
							<p class="line-clamp-4 text-[0.95rem] leading-relaxed text-case-900">{t.body}</p>
							<p class="mt-3 font-mono-hack text-[0.7rem] text-case-700">
								—— {timeAgo(t.createdAt)}
							</p>
						</a>
					</li>
				{/each}
			{/if}
		</ul>
	</div>
</section>

<!-- The year's case line: a red thread with a brass pin per filing -->
<section class="px-6 pb-24">
	<div class="mx-auto max-w-5xl" use:reveal>
		<div class="flex items-end justify-between">
			<h2 class="font-display text-2xl text-ink sm:text-3xl">{data.year} 案件線</h2>
			<p class="font-mono-hack text-xs text-ink-muted">
				本年度 {data.yearEntries.length} 件 ·
				<a href={resolve('/archive')} class="hover:text-accent">時間軸 →</a>
			</p>
		</div>

		<div class="relative mt-12 h-20">
			<svg
				class="thread absolute inset-x-0 top-6 h-4 w-full overflow-visible"
				preserveAspectRatio="none"
				viewBox="0 0 100 4"
				aria-hidden="true"
			>
				<path
					d="M0 2 Q 25 3.6 50 2 T 100 2"
					fill="none"
					stroke="#b3362b"
					stroke-width="0.35"
					vector-effect="non-scaling-stroke"
					style="stroke-width: 2px"
				/>
			</svg>
			<span
				class="absolute top-8 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent bg-surface"
				style="left: {yearProgress * 100}%"
				title="今天"
			></span>

			{#each data.yearEntries as entry, i (entry.path)}
				{@const pos = ((entry.date.getTime() - yearStart) / yearLength) * 100}
				<!-- eslint-disable svelte/no-navigation-without-resolve -- entry.path is a full app path -->
				<a
					href={entry.path}
					class="pin absolute top-8 -translate-x-1/2 -translate-y-full"
					style="left: {pos}%"
					aria-label={entry.title}
					onmouseenter={() => (hoveredPin = i)}
					onmouseleave={() => (hoveredPin = null)}
					onfocus={() => (hoveredPin = i)}
					onblur={() => (hoveredPin = null)}
				>
					<span class="pin-head"></span>
					<span class="pin-needle"></span>
					{#if hoveredPin === i}
						<span
							class="index-card pointer-events-none absolute bottom-full left-1/2 mb-2 w-max max-w-56 -translate-x-1/2 rounded-sm px-3 py-2 text-xs"
						>
							<span class="line-clamp-2 font-medium text-case-900">{entry.title}</span>
							<span class="mt-0.5 block font-mono-hack text-case-600">{stampDate(entry.date)}</span>
						</span>
					{/if}
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			{/each}

			<div
				class="absolute inset-x-0 top-12 flex justify-between font-mono-hack text-[0.65rem] text-ink-muted/70"
			>
				{#each months as m (m)}
					<span class="w-0 text-center">{String(m).padStart(2, '0')}</span>
				{/each}
			</div>
		</div>
	</div>
</section>

<!-- Testimony + an envelope for tips -->
<section id="contact" class="px-6 pb-8">
	<div class="mx-auto grid max-w-5xl gap-10 md:grid-cols-2">
		<div use:reveal>
			<h2 class="font-display text-2xl text-ink sm:text-3xl">最新證詞</h2>
			{#if data.featuredComment}
				<!-- eslint-disable svelte/no-navigation-without-resolve -- path rebuilt from the comment's thread key -->
				<a
					href="{data.featuredComment.path}#comments"
					class="index-card mt-6 block rounded-sm px-6 pt-5 pb-6 transition hover:-translate-y-1"
				>
					<p class="font-mono-hack text-[0.7rem] tracking-widest text-case-600">
						證人：{data.featuredComment.author}{#if data.featuredComment.on}
							· 案件《{data.featuredComment.on}》{/if}
					</p>
					<p class="mt-3 line-clamp-4 leading-7 text-case-900">「{data.featuredComment.body}」</p>
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			{:else}
				<p class="mt-6 font-mono-hack text-sm text-ink-muted">還沒有人留下證詞。</p>
			{/if}
		</div>

		<div class="envelope rounded-md px-7 pt-12 pb-8" use:reveal={{ delay: 100 }}>
			<p class="font-mono-hack text-[0.7rem] tracking-[0.25em] text-case-700">
				TO: Liam · 線索收件
			</p>
			<p class="mt-3 font-display text-xl text-case-900 sm:text-2xl">
				有線索、想合作，或只是想打聲招呼？
			</p>
			<div class="mt-6 flex flex-wrap gap-3">
				<a
					href="mailto:{contactEmail}"
					use:magnetic
					class="flex items-center gap-2 rounded-sm bg-case-900 px-5 py-2.5 text-sm font-medium text-cream-100 shadow-[0_10px_24px_-12px_rgba(0,0,0,0.6)]"
				>
					<Mail class="size-4" /> 寄信
				</a>
				<a
					href={resolve('/messages')}
					use:magnetic
					class="flex items-center gap-2 rounded-sm border border-case-700/50 px-5 py-2.5 text-sm font-medium text-case-900 hover:border-stamp-500 hover:text-stamp-600"
				>
					留下證詞
				</a>
			</div>
		</div>
	</div>
</section>

<style>
	/* Fanned index cards */
	.fan-slot {
		position: relative;
		z-index: var(--z);
	}
	.fan-card {
		transform: rotate(var(--tilt));
		transition:
			transform 0.45s cubic-bezier(0.16, 1, 0.3, 1),
			box-shadow 0.45s ease;
	}
	@media (min-width: 768px) {
		.fan-slot:first-child .fan-card {
			margin-right: -1.5rem;
		}
		.fan-slot:last-child .fan-card {
			margin-left: -1.5rem;
		}
	}
	.fan-slot:hover {
		z-index: 5;
	}
	.fan-card:hover {
		transform: rotate(0deg) translateY(-18px) scale(1.02);
		box-shadow:
			0 1px 0 rgba(255, 255, 255, 0.6) inset,
			0 36px 50px -24px rgba(20, 12, 6, 0.6);
	}

	/* Sticky notes with a strip of tape */
	.note {
		position: relative;
		padding: 1.6rem 1.25rem 1.25rem;
		background: #f3dc8a;
		box-shadow: 0 14px 24px -14px rgba(40, 25, 5, 0.55);
		transform: rotate(var(--tilt));
		transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.note::before {
		content: '';
		position: absolute;
		top: -0.6rem;
		left: 50%;
		width: 4.5rem;
		height: 1.3rem;
		background: rgba(240, 232, 210, 0.7);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
		transform: translateX(-50%) rotate(-3deg);
	}
	.note:hover {
		transform: rotate(0deg) translateY(-6px);
	}

	/* Pins on the thread */
	.pin {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0 6px;
	}
	.pin-head {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: radial-gradient(circle at 35% 30%, #f3d59a, #b8904f 55%, #6b4f22);
		box-shadow: 0 2px 3px rgba(0, 0, 0, 0.35);
		transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.pin-needle {
		width: 1.5px;
		height: 10px;
		background: #8a8a8a;
	}
	.pin:hover .pin-head,
	.pin:focus-visible .pin-head {
		transform: translateY(-4px) scale(1.25);
	}
	.thread path {
		stroke-dasharray: 2000;
		stroke-dashoffset: 2000;
		animation: draw-thread 1.6s 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}
	@keyframes draw-thread {
		to {
			stroke-dashoffset: 0;
		}
	}

	/* Manila envelope with a flap */
	.envelope {
		position: relative;
		overflow: hidden;
		background: #d4ad6e;
		box-shadow: 0 20px 40px -24px rgba(20, 12, 6, 0.6);
	}
	.envelope::before {
		content: '';
		position: absolute;
		inset: 0 0 auto 0;
		height: 2.2rem;
		background:
			linear-gradient(170deg, #c49b58 50%, transparent 50.5%),
			linear-gradient(190deg, #c49b58 50%, transparent 50.5%);
		background-size: 50% 100%;
		background-repeat: no-repeat;
		background-position: left, right;
		opacity: 0.9;
	}

	@media (prefers-reduced-motion: reduce) {
		.thread path {
			animation: none;
			stroke-dashoffset: 0;
		}
		.fan-card,
		.note,
		.pin-head {
			transition: none;
		}
	}
</style>
