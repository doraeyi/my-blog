<script lang="ts">
	import { tilt } from '$lib/actions/tilt';
	import { resolve } from '$app/paths';
	import Seo from '$lib/components/Seo.svelte';
	import ParticlePortrait from '$lib/components/ParticlePortrait.svelte';
	import Typewriter from '$lib/components/Typewriter.svelte';
	import BrandIcon from '$lib/components/icons/BrandIcon.svelte';
	import { reveal } from '$lib/actions/reveal';
	import { socialLinks, contactEmail } from '$lib/social-links';
	import { experience, education } from '$lib/profile';
	import PenTool from '@lucide/svelte/icons/pen-tool';
	import Paperclip from '@lucide/svelte/icons/paperclip';
	import Mail from '@lucide/svelte/icons/mail';
	import Timer from '@lucide/svelte/icons/timer';
	import Hand from '@lucide/svelte/icons/hand';
	import MoonStar from '@lucide/svelte/icons/moon-star';
	import seal from '$lib/assets/brand/seal.svg';
	import logo from '$lib/assets/logo-mark.jpg';
	import {
		siSvelte,
		siTypescript,
		siTailwindcss,
		siThreedotjs,
		siDrizzle,
		siBetterauth,
		siSqlite,
		siNodedotjs,
		siVite,
		siPnpm,
		siEslint,
		siPrettier
	} from 'simple-icons';

	const tagline = '前端工程師 · MSI 微星科技';

	const profile = [
		{ key: 'ROLE', label: '職稱', value: '前端工程師' },
		{ key: 'AGENCY', label: '所屬', value: 'MSI 微星科技' },
		{ key: 'SPECIALTY', label: '專長', value: 'Svelte · TypeScript · 互動設計' },
		{ key: 'STATUS', label: '狀態', value: 'ACTIVE' }
	];

	// Draft copy — swap this for your own wording.
	const notes = [
		'我是李俊逸，目前在 MSI 微星科技擔任前端工程師，平常的工作是把想法變成使用者真的願意點下去的介面。',
		'比起把功能做完，我更在意做完之後好不好用——動畫的時機、卡片的手感、深色模式底下顏色還準不準，都算數。',
		'這個網站本身也是實驗場：翻頁時的過場、背景裡漂浮的案件卷宗、還有這頁的粒子效果，都是自己動手做的，不是套模板。'
	];

	const focus = [
		{
			icon: Timer,
			title: '動畫的時機',
			body: '快一點太躁、慢一點拖沓，過場要剛好落在眼睛跟得上的節奏。'
		},
		{
			icon: Hand,
			title: '操作的手感',
			body: 'hover、按壓、回饋——每個互動都該讓人知道「有東西回應了我」。'
		},
		{
			icon: MoonStar,
			title: '兩種主題都準',
			body: '深色模式不是把顏色反過來，而是重新確認每個對比與層次。'
		}
	];

	// 經歷 and 學歷 as one case history, newest first, each tagged with its kind.
	const history = [
		...experience.map((e, i) => ({ ...e, kind: i === 0 ? '現職' : '專案' })),
		...education.map((e) => ({ ...e, kind: '學歷' }))
	];

	// SvelteKit has no distinct logo in simple-icons, so it's left out here —
	// Svelte itself already stands in for the framework.
	const techGroups = [
		{
			label: 'FRONTEND',
			labelZh: '前端開發',
			items: [siSvelte, siTypescript, siTailwindcss, siThreedotjs]
		},
		{
			label: 'BACKEND',
			labelZh: '後端開發',
			items: [siDrizzle, siBetterauth, siSqlite, siNodedotjs]
		},
		{ label: 'TOOLING', labelZh: '工具鏈', items: [siVite, siPnpm, siEslint, siPrettier] }
	];

	// A couple of brand colors (Three.js's is pure black) vanish on dark
	// surfaces — draw those in the ink color instead of their brand hex.
	function isNearBlack(hex: string) {
		const r = parseInt(hex.slice(0, 2), 16);
		const g = parseInt(hex.slice(2, 4), 16);
		const b = parseInt(hex.slice(4, 6), 16);
		return 0.2126 * r + 0.7152 * g + 0.0722 * b < 40;
	}
</script>

<Seo
	title="關於我"
	description="李俊逸，MSI 微星科技前端工程師。在意動畫的時機、操作的手感，以及兩種主題下都準確的顏色。"
	alternates={[
		{ hreflang: 'zh-Hant', href: '/about' },
		{ hreflang: 'en', href: '/english' }
	]}
/>

<!--
	Panels use a translucent surface + blur rather than a solid fill, so the
	sitewide 3D depth layer still reads behind them without the floating
	folders colliding with the text.
-->
<div class="relative mx-auto max-w-5xl px-6 pt-28 pb-24">
	<p class="mb-6 text-right text-sm">
		<a
			href={resolve('/english')}
			class="text-ink-muted underline-offset-4 hover:text-accent hover:underline"
			>English profile →</a
		>
	</p>
	<!-- ── Hero: ID card + profile sheet ─────────────────────────────── -->
	<section class="grid items-center gap-10 md:grid-cols-[260px_1fr] md:gap-14">
		<div use:reveal class="relative mx-auto w-full max-w-[260px]">
			<div
				class="relative rotate-[-2deg] rounded-md border border-border-case bg-surface p-3 pb-4 shadow-[0_18px_40px_-18px_rgba(44,33,24,0.45)]"
			>
				<Paperclip
					aria-hidden="true"
					class="absolute -top-4 left-8 size-8 -rotate-12 text-case-500 drop-shadow"
				/>
				<div class="relative aspect-[3/4] overflow-hidden rounded-sm bg-case-950">
					<ParticlePortrait photoSrc={logo} logoSrc={seal} />
				</div>
				<div
					class="mt-3 flex items-center justify-between font-mono-hack text-[0.7rem] text-ink-muted"
				>
					<span>FILE NO. 001</span>
					<span class="tracking-widest">LI · C · Y</span>
				</div>
			</div>
			<span
				aria-hidden="true"
				class="absolute -right-4 -bottom-3 rotate-[-8deg] rounded border-2 border-accent/80 bg-surface/90 px-2 py-0.5 font-display text-xs tracking-[0.2em] text-accent"
			>
				CLASSIFIED
			</span>
		</div>

		<div use:reveal={{ delay: 100 }}>
			<p class="font-mono-hack text-xs tracking-[0.3em] text-accent uppercase">
				Subject Profile // Access Granted
			</p>
			<h1 class="mt-3 font-display text-5xl tracking-wide text-ink sm:text-6xl">李俊逸</h1>
			<p class="mt-3 h-6 font-mono-hack text-base text-ink-muted">
				<Typewriter text={tagline} speed={40} />
			</p>

			<dl
				class="mt-8 divide-y divide-dashed divide-border-case rounded-md border border-border-case bg-surface/70 backdrop-blur-sm"
			>
				{#each profile as row (row.key)}
					<div class="grid grid-cols-[7.5rem_1fr] items-center gap-4 px-4 py-2.5">
						<dt class="font-mono-hack text-[0.7rem] tracking-[0.2em] text-ink-muted">
							{row.key}
							<span class="ml-1 tracking-normal text-ink-muted/70">{row.label}</span>
						</dt>
						<dd class="text-sm text-ink">
							{#if row.key === 'STATUS'}
								<span class="inline-flex items-center gap-2 font-mono-hack text-accent">
									<span class="relative flex size-2">
										<span
											class="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60 motion-reduce:animate-none"
										></span>
										<span class="relative inline-flex size-2 rounded-full bg-accent"></span>
									</span>
									{row.value}
								</span>
							{:else}
								{row.value}
							{/if}
						</dd>
					</div>
				{/each}
			</dl>

			<div class="mt-6 flex flex-wrap items-center gap-3">
				{#each socialLinks as link (link.name)}
					<!-- eslint-disable svelte/no-navigation-without-resolve -- external social links, not app routes -->
					<a
						href={link.href}
						aria-label={link.name}
						target="_blank"
						rel="noopener noreferrer"
						class="flex size-10 items-center justify-center rounded-full border border-border-case bg-surface/70 text-ink-muted transition hover:border-accent hover:text-accent"
					>
						<BrandIcon name={link.icon} class="size-4" />
					</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				{/each}
				<a
					href="mailto:{contactEmail}"
					class="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-white transition hover:bg-accent-strong"
				>
					<Mail class="size-4" />
					聯絡我
				</a>
			</div>
		</div>
	</section>

	<!-- ── 01 Field notes ───────────────────────────────────────────── -->
	<section class="mt-24">
		<header use:reveal class="flex items-baseline gap-4">
			<span class="font-display text-3xl text-accent/80">01</span>
			<h2 class="font-mono-hack text-xs tracking-[0.3em] text-ink-muted uppercase">
				Field Notes // 調查筆記
			</h2>
			<span class="h-px flex-1 bg-border-case"></span>
		</header>

		<!--
			A physical prop, not a UI panel — fixed parchment tones regardless of site
			theme (kraft paper doesn't have a "dark mode").
		-->
		<div
			use:reveal={{ delay: 120 }}
			class="relative mt-8 rounded-sm bg-gradient-to-br from-[#f5e7c4] to-[#e8d5a6] px-7 py-8 shadow-[0_24px_50px_-24px_rgba(44,33,24,0.55)] sm:px-12"
		>
			<!-- ruled-paper lines + red margin line -->
			<div
				aria-hidden="true"
				class="pointer-events-none absolute inset-0 rounded-sm opacity-40 [background:repeating-linear-gradient(transparent,transparent_31px,rgba(107,83,54,0.25)_32px)]"
			></div>
			<div
				aria-hidden="true"
				class="pointer-events-none absolute inset-y-0 left-4 w-px bg-stamp-400/50 sm:left-8"
			></div>

			<div class="relative flex items-center gap-2 text-case-700">
				<PenTool class="size-4" />
				<p class="font-display text-xs font-semibold tracking-[0.2em] uppercase">
					Case notes — handwritten
				</p>
			</div>
			<div class="relative mt-5 space-y-4 text-[1.02rem] leading-8 text-case-900">
				{#each notes as note, i (i)}
					<p use:reveal={{ delay: 250 + i * 140, y: 10 }}>{note}</p>
				{/each}
			</div>
		</div>
	</section>

	<!-- ── 02 Case history ────────────────────────────────────────── -->
	<section class="mt-24">
		<header use:reveal class="flex items-baseline gap-4">
			<span class="font-display text-3xl text-accent/80">02</span>
			<h2 class="font-mono-hack text-xs tracking-[0.3em] text-ink-muted uppercase">
				Case History // 經歷
			</h2>
			<span class="h-px flex-1 bg-border-case"></span>
		</header>

		<!-- A string of index cards pinned along a timeline thread. -->
		<ol class="relative mt-8 space-y-6 border-l border-dashed border-stamp-400/50 pl-6 sm:pl-10">
			{#each history as entry, i (entry.period + entry.org)}
				<li use:reveal={{ delay: i * 120 }} class="relative">
					<span
						aria-hidden="true"
						class="absolute top-6 -left-[29px] size-2.5 rounded-full bg-stamp-500 ring-4 ring-surface sm:-left-[45px]"
					></span>
					<article
						use:tilt={{ max: 3 }}
						class="index-card rounded-sm px-6 pt-5 pb-6 sm:px-8"
						style="transform: rotate({i % 2 ? 0.4 : -0.5}deg)"
					>
						<div class="flex flex-wrap items-center justify-between gap-2">
							<p class="font-mono-hack text-xs tracking-widest text-case-700">{entry.period}</p>
							<span class="date-stamp">{entry.kind}</span>
						</div>
						<h3 class="mt-2 font-display text-xl text-case-900">{entry.role}</h3>
						<p class="text-sm text-case-700">{entry.org}</p>
						<ul class="mt-3 space-y-1.5 text-[0.95rem] leading-7 text-case-800">
							{#each entry.points as point (point)}
								<li class="flex gap-2"><span class="text-stamp-500">▸</span>{point}</li>
							{/each}
						</ul>
					</article>
				</li>
			{/each}
		</ol>
	</section>

	<!-- ── 03 Focus ─────────────────────────────────────────────────── -->
	<section class="mt-24">
		<header use:reveal class="flex items-baseline gap-4">
			<span class="font-display text-3xl text-accent/80">03</span>
			<h2 class="font-mono-hack text-xs tracking-[0.3em] text-ink-muted uppercase">
				Modus Operandi // 在意的事
			</h2>
			<span class="h-px flex-1 bg-border-case"></span>
		</header>

		<div class="mt-8 grid gap-5 sm:grid-cols-3">
			{#each focus as item, i (item.title)}
				<article
					use:reveal={{ delay: i * 110 }}
					use:tilt
					class="case-card rounded-md border border-border-case bg-surface/75 p-6 backdrop-blur-sm"
				>
					<div
						class="flex size-10 items-center justify-center rounded-full border border-accent/40 text-accent"
					>
						<item.icon class="size-5" />
					</div>
					<h3 class="mt-4 font-display text-lg text-ink">{item.title}</h3>
					<p class="mt-2 text-sm leading-relaxed text-ink-muted">{item.body}</p>
				</article>
			{/each}
		</div>
	</section>

	<!-- ── 04 Tools ─────────────────────────────────────────────────── -->
	<section class="mt-24">
		<header use:reveal class="flex items-baseline gap-4">
			<span class="font-display text-3xl text-accent/80">04</span>
			<h2 class="font-mono-hack text-xs tracking-[0.3em] text-ink-muted uppercase">
				Known Tools // 技術牆
			</h2>
			<span class="h-px flex-1 bg-border-case"></span>
		</header>

		<div class="mt-8 grid gap-5 md:grid-cols-3">
			{#each techGroups as group, gi (group.label)}
				<div
					use:reveal={{ delay: gi * 110 }}
					class="rounded-md border border-border-case bg-surface/75 p-5 backdrop-blur-sm"
				>
					<p class="font-mono-hack text-xs tracking-[0.25em] text-ink-muted">
						{group.label}
						<span class="ml-2 tracking-normal text-ink/70">{group.labelZh}</span>
					</p>
					<ul class="mt-4 grid grid-cols-2 gap-2">
						{#each group.items as icon (icon.slug)}
							<li
								class="flex items-center gap-2.5 rounded-md border border-transparent bg-surface-alt/70 px-3 py-2 text-sm text-ink transition hover:border-border-case"
							>
								<svg
									viewBox="0 0 24 24"
									class="size-4 shrink-0 {isNearBlack(icon.hex) ? 'fill-ink' : ''}"
									fill={isNearBlack(icon.hex) ? undefined : `#${icon.hex}`}
									aria-hidden="true"
								>
									<path d={icon.path} />
								</svg>
								<span class="truncate">{icon.title}</span>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	</section>

	<!-- ── Closing ──────────────────────────────────────────────────── -->
	<section
		use:reveal
		class="relative mt-24 overflow-hidden rounded-md bg-case-950 px-8 py-12 text-center"
	>
		<div
			aria-hidden="true"
			class="pointer-events-none absolute inset-0 opacity-[0.12] [background:repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(240,180,41,0.4)_3px)]"
		></div>
		<p class="relative font-mono-hack text-xs tracking-[0.3em] text-phosphor-400/90 uppercase">
			Open a new case
		</p>
		<p class="relative mt-3 font-display text-2xl text-cream-100 sm:text-3xl">
			有想法想聊聊？寄封信給我。
		</p>
		<a
			href="mailto:{contactEmail}"
			class="relative mt-6 inline-flex items-center gap-2 rounded-full border border-phosphor-400/40 px-5 py-2 font-mono-hack text-sm text-phosphor-300 transition hover:border-phosphor-400 hover:bg-phosphor-400/10"
		>
			<Mail class="size-4" />
			{contactEmail}
		</a>
	</section>
</div>
