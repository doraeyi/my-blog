<!--
	The English profile: one page an international recruiter can read end to
	end — who Liam is, what he cares about, his tools, selected projects (with
	case reports where written) and his writing (which is in Traditional
	Chinese, and says so). Same case-file look as the rest of the site.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import Seo from '$lib/components/Seo.svelte';
	import BrandIcon from '$lib/components/icons/BrandIcon.svelte';
	import { reveal } from '$lib/actions/reveal';
	import { tilt } from '$lib/actions/tilt';
	import { socialLinks, contactEmail } from '$lib/social-links';
	import { resumeUrl, experience } from '$lib/profile';
	import Mail from '@lucide/svelte/icons/mail';
	import FileDown from '@lucide/svelte/icons/file-down';
	import Timer from '@lucide/svelte/icons/timer';
	import Hand from '@lucide/svelte/icons/hand';
	import MoonStar from '@lucide/svelte/icons/moon-star';
	import Star from '@lucide/svelte/icons/star';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import {
		siSvelte,
		siTypescript,
		siTailwindcss,
		siThreedotjs,
		siDrizzle,
		siSqlite,
		siNodedotjs,
		siDocker,
		siVite,
		siPnpm,
		siEslint,
		siPrettier
	} from 'simple-icons';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const focus = [
		{
			icon: Timer,
			title: 'Timing',
			body: 'Too fast feels jittery, too slow drags. Transitions should land where the eye can follow.'
		},
		{
			icon: Hand,
			title: 'Feel',
			body: 'Hover, press, feedback — every interaction should tell you something answered.'
		},
		{
			icon: MoonStar,
			title: 'Both themes, right',
			body: 'Dark mode is not inverted colours; every contrast and layer gets checked again.'
		}
	];

	const tools = [
		{ label: 'Frontend', items: [siSvelte, siTypescript, siTailwindcss, siThreedotjs] },
		{ label: 'Backend', items: [siNodedotjs, siDrizzle, siSqlite, siDocker] },
		{ label: 'Tooling', items: [siVite, siPnpm, siEslint, siPrettier] }
	];

	function isNearBlack(hex: string) {
		const r = parseInt(hex.slice(0, 2), 16);
		const g = parseInt(hex.slice(2, 4), 16);
		const b = parseInt(hex.slice(4, 6), 16);
		return 0.2126 * r + 0.7152 * g + 0.0722 * b < 40;
	}
</script>

<Seo
	title="Frontend Engineer"
	description="Liam (李俊逸) is a frontend engineer at MSI who cares about animation timing, interaction feel and colours that hold up in both themes. This site is his portfolio piece."
	locale="en_US"
	alternates={[
		{ hreflang: 'en', href: '/english' },
		{ hreflang: 'zh-Hant', href: '/about' }
	]}
/>

<div class="mx-auto max-w-4xl px-6 pt-28 pb-24">
	<p class="text-right text-sm">
		<a
			href={resolve('/about')}
			class="text-ink-muted underline-offset-4 hover:text-accent hover:underline"
			>中文版人物檔案 →</a
		>
	</p>

	<!-- ── Hero ── -->
	<section use:reveal class="mt-6">
		<p class="font-mono-hack text-xs tracking-[0.3em] text-ink-muted">SUBJECT PROFILE · ENGLISH</p>
		<h1 class="mt-3 font-display text-5xl text-ink sm:text-6xl">Liam</h1>
		<p class="mt-2 text-ink-muted">李俊逸 · Frontend Engineer at MSI · Taiwan</p>
		<div class="mt-6 max-w-2xl space-y-3 text-[1.02rem] leading-relaxed text-ink">
			<p>I build interfaces at MSI, turning ideas into screens people actually want to click.</p>
			<p>
				Shipping the feature is only half of it. I care about what happens after: the timing of an
				animation, the feel of a card, whether colours still hold up in dark mode.
			</p>
			<p>
				This site is my workbench. The page transitions, the 3D case desk on the cover and the
				evidence board were all built by hand — no templates.
			</p>
		</div>

		<div class="mt-7 flex flex-wrap items-center gap-3">
			<a
				href="mailto:{contactEmail}"
				class="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-white transition hover:bg-accent-strong"
			>
				<Mail class="size-4" /> Contact me
			</a>
			{#if resumeUrl}
				<!-- eslint-disable svelte/no-navigation-without-resolve -- static file -->
				<a
					href={resumeUrl}
					download
					class="inline-flex h-10 items-center gap-2 rounded-full border border-border-case px-5 text-sm text-ink transition hover:border-accent hover:text-accent"
				>
					<FileDown class="size-4" /> Résumé (PDF)
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			{/if}
			{#each socialLinks as link (link.name)}
				<!-- eslint-disable svelte/no-navigation-without-resolve -- external profiles -->
				<a
					href={link.href}
					aria-label={link.name}
					target="_blank"
					rel="noopener noreferrer"
					class="flex size-10 items-center justify-center rounded-full border border-border-case text-ink-muted transition hover:border-accent hover:text-accent"
				>
					<BrandIcon name={link.icon} class="size-4" />
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			{/each}
		</div>
	</section>

	{#if experience.length}
		<section class="mt-20">
			<h2 class="section-title">Experience</h2>
			<ol class="mt-6 space-y-4">
				{#each experience as job (job.period + job.org)}
					<li use:reveal class="index-card rounded-sm px-5 py-4">
						<p class="font-mono-hack text-xs tracking-widest text-case-700">{job.period}</p>
						<p class="mt-1 font-display text-lg text-case-900">{job.role} · {job.org}</p>
						<ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-case-800">
							{#each job.points as point (point)}<li>{point}</li>{/each}
						</ul>
					</li>
				{/each}
			</ol>
		</section>
	{/if}

	<!-- ── What I care about ── -->
	<section class="mt-20">
		<h2 class="section-title">What I care about</h2>
		<div class="mt-6 grid gap-5 sm:grid-cols-3">
			{#each focus as item, i (item.title)}
				<article
					use:reveal={{ delay: i * 100 }}
					use:tilt
					class="case-card rounded-md border border-border-case bg-surface/75 p-6"
				>
					<item.icon class="size-5 text-accent" />
					<h3 class="mt-3 font-display text-lg text-ink">{item.title}</h3>
					<p class="mt-2 text-sm leading-relaxed text-ink-muted">{item.body}</p>
				</article>
			{/each}
		</div>
	</section>

	<!-- ── Toolbox ── -->
	<section class="mt-20">
		<h2 class="section-title">Toolbox</h2>
		<div class="mt-6 grid gap-5 md:grid-cols-3">
			{#each tools as group (group.label)}
				<div use:reveal class="rounded-md border border-border-case bg-surface/75 p-5">
					<p class="font-mono-hack text-xs tracking-[0.25em] text-ink-muted">{group.label}</p>
					<ul class="mt-4 grid grid-cols-2 gap-2">
						{#each group.items as icon (icon.slug)}
							<li
								class="flex items-center gap-2 rounded-md bg-surface-alt/70 px-3 py-2 text-sm text-ink"
							>
								<svg
									viewBox="0 0 24 24"
									class="size-4 shrink-0 {isNearBlack(icon.hex) ? 'fill-ink' : ''}"
									fill={isNearBlack(icon.hex) ? undefined : `#${icon.hex}`}
									aria-hidden="true"><path d={icon.path} /></svg
								>
								<span class="truncate">{icon.title}</span>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	</section>

	<!-- ── Projects ── -->
	{#if data.projects.length}
		<section class="mt-20">
			<h2 class="section-title">Selected projects</h2>
			<ul class="mt-6 grid gap-4 sm:grid-cols-2">
				{#each data.projects as p (p.id)}
					<li use:reveal>
						<a
							href={resolve('/portfolio/[id]', { id: p.id })}
							class="case-card flex h-full flex-col rounded-lg border border-border-case bg-surface p-5"
						>
							<span class="font-mono-hack text-xs text-ink-muted">{p.owner}</span>
							<span class="mt-1 font-display text-lg text-ink">{p.name}</span>
							{#if p.description}
								<span class="mt-1.5 line-clamp-2 flex-1 text-sm text-ink-muted"
									>{p.description}</span
								>
							{/if}
							<span class="mt-3 flex items-center gap-3 text-xs text-ink-muted">
								<span class="flex items-center gap-1"
									><Star class="size-3.5 text-accent" />{p.stars}</span
								>
								{#if p.hasReport}<span class="date-stamp">case report</span>{/if}
							</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<!-- ── Writing ── -->
	{#if data.articles.length}
		<section class="mt-20">
			<h2 class="section-title">Writing</h2>
			<p class="mt-2 text-sm text-ink-muted">
				Posts are written in Traditional Chinese; titles below link to the originals.
			</p>
			<ul class="mt-5 divide-y divide-dashed divide-border-case">
				{#each data.articles as a (a.path)}
					<li class="py-3">
						<!-- eslint-disable svelte/no-navigation-without-resolve -- paths come from the content index -->
						<a
							href={a.path}
							class="group flex items-baseline justify-between gap-4"
							hreflang="zh-Hant"
						>
							<span class="text-ink group-hover:text-accent">{a.title}</span>
							<time class="shrink-0 font-mono-hack text-xs text-ink-muted">{a.date}</time>
						</a>
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
					</li>
				{/each}
			</ul>
			<a
				href={resolve('/board')}
				class="mt-5 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-accent"
			>
				See every post on the evidence board <ArrowRight class="size-4" />
			</a>
		</section>
	{/if}

	<!-- ── Contact ── -->
	<section use:reveal class="mt-20 rounded-md bg-case-950 px-8 py-12 text-center">
		<p class="font-mono-hack text-xs tracking-[0.3em] text-phosphor-400/90">OPEN A NEW CASE</p>
		<p class="mt-3 font-display text-2xl text-cream-100 sm:text-3xl">
			Have something in mind? Write to me.
		</p>
		<a
			href="mailto:{contactEmail}"
			class="mt-6 inline-flex items-center gap-2 rounded-full border border-phosphor-400/40 px-5 py-2 font-mono-hack text-sm text-phosphor-300 transition hover:border-phosphor-400 hover:bg-phosphor-400/10"
		>
			<Mail class="size-4" />
			{contactEmail}
		</a>
	</section>
</div>
