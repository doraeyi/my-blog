<!--
	A project written up as a closed case file: the brief and Liam's role typed
	on the folder, then four numbered index cards — the case, the investigation,
	the solution, the outcome — and a red 結案 stamp at the end.
-->
<script lang="ts">
	import { reveal } from '$lib/actions/reveal';
	import { proseEnhance } from '$lib/actions/prose';

	let {
		brief,
		role,
		sections
	}: {
		brief: string;
		role: string;
		sections: { key: string; html: string }[];
	} = $props();

	const LABELS: Record<string, [string, string]> = {
		problem: ['案件背景', 'THE CASE'],
		investigation: ['調查過程', 'INVESTIGATION'],
		solution: ['破案手法', 'SOLUTION'],
		result: ['結案成果', 'OUTCOME']
	};
</script>

<section class="report" aria-labelledby="case-report-title">
	<header use:reveal class="report-head">
		<p class="font-mono-hack text-xs tracking-[0.3em] text-case-700">CASE REPORT</p>
		<h2 id="case-report-title" class="font-display text-2xl text-case-900">結案報告</h2>
		{#if brief}
			<p class="mt-2 text-case-800">{brief}</p>
		{/if}
		{#if role}
			<p class="mt-3 font-mono-hack text-xs tracking-widest text-case-700">
				承辦人角色 · <span class="text-case-900">{role}</span>
			</p>
		{/if}
	</header>

	<ol class="mt-6 space-y-5">
		{#each sections as s, i (s.key)}
			<li use:reveal={{ delay: i * 80, y: 10 }} class="index-card report-card rounded-sm">
				<p class="report-label">
					<span class="report-no">{String(i + 1).padStart(2, '0')}</span>
					{LABELS[s.key]?.[0] ?? s.key}
					<span class="font-mono-hack text-[0.7rem] tracking-[0.25em] text-case-700"
						>{LABELS[s.key]?.[1] ?? ''}</span
					>
				</p>
				<div class="prose prose-sm max-w-none text-case-900" use:proseEnhance={s.html}>
					<!-- eslint-disable-next-line svelte/no-at-html-tags -- rendered via renderMarkdown() + rehype-sanitize from admin-written Markdown -->
					{@html s.html}
				</div>
			</li>
		{/each}
	</ol>

	<p class="closed" aria-label="已結案">結案</p>
</section>

<style>
	.report {
		position: relative;
		margin-top: 2rem;
		padding: 1.5rem 1.25rem 2.5rem;
		border-radius: 4px;
		background:
			url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='80' height='80' filter='url(%23n)' opacity='.08'/%3E%3C/svg%3E"),
			#d4ad6e;
		box-shadow: 0 24px 50px -28px rgba(30, 15, 5, 0.65);
	}
	@media (min-width: 640px) {
		.report {
			padding: 2rem 2.25rem 2.75rem;
		}
	}
	.report-head {
		padding-bottom: 0.75rem;
		border-bottom: 1px dashed rgba(44, 33, 24, 0.35);
	}
	.report-card {
		padding: 1rem 1.25rem 1.25rem;
		border-top: 2px solid color-mix(in srgb, #cf5a4c 65%, transparent);
	}
	.report-label {
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
		margin-bottom: 0.4rem;
		font-family: var(--font-display);
		font-size: 1.1rem;
		color: #2c2118;
	}
	.report-no {
		font-family: var(--font-mono-hack);
		font-size: 0.8rem;
		color: #b3362b;
	}
	/* The report's prose is ink on card stock in both themes. */
	.report-card :global(.prose) {
		--tw-prose-body: #2c2118;
		--tw-prose-headings: #2c2118;
		--tw-prose-bold: #2c2118;
		--tw-prose-links: #922a21;
		--tw-prose-code: #2c2118;
		--tw-prose-bullets: #8a6d45;
		--tw-prose-counters: #8a6d45;
	}
	.closed {
		position: absolute;
		right: 1.5rem;
		bottom: 0.75rem;
		padding: 0.1rem 0.7rem;
		border: 3px double #b3362b;
		border-radius: 4px;
		color: #b3362b;
		font-family: var(--font-display);
		font-size: 1.15rem;
		letter-spacing: 0.3em;
		transform: rotate(-8deg);
		opacity: 0.85;
	}
</style>
