<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import { enhance } from '$app/forms';
	import { mermaidDiagrams } from '$lib/actions/mermaid';
	import { reveal } from '$lib/actions/reveal';
	import ReadingSidebar from '$lib/components/ReadingSidebar.svelte';
	import ContributionGraph from '$lib/components/ContributionGraph.svelte';
	import CaseReport from '$lib/components/CaseReport.svelte';
	import Star from '@lucide/svelte/icons/star';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let readmeEl: HTMLElement | undefined = $state();
</script>

<Seo title={data.project.githubRepo} description={data.project.description} />

<div class="mx-auto max-w-[90rem] px-6 pt-28 pb-16">
	<div class="grid gap-10 lg:grid-cols-[1fr_220px]">
		<article class="min-w-0">
			<div use:reveal>
				<h1 class="font-display text-3xl text-ink sm:text-4xl">{data.project.githubRepo}</h1>
				{#if data.project.description}
					<p class="mt-2 text-ink-muted">{data.project.description}</p>
				{/if}
			</div>

			{#if data.project.collaborators.length}
				<div class="mt-5 flex flex-wrap gap-3">
					<!-- eslint-disable svelte/no-navigation-without-resolve -- external GitHub profile URL -->
					{#each data.project.collaborators as collaborator (collaborator.id)}
						<a
							href={collaborator.profileUrl ?? '#'}
							target="_blank"
							rel="noreferrer"
							class="flex items-center gap-2 rounded-full border border-border-case py-1 pr-3 pl-1 text-sm text-ink-muted transition hover:bg-surface-alt hover:text-ink"
						>
							{#if collaborator.avatarUrl}
								<img
									src={collaborator.avatarUrl}
									alt={collaborator.githubUsername}
									class="size-6 rounded-full"
								/>
							{/if}
							{collaborator.githubUsername}
							{#if collaborator.role === 'owner'}
								<span class="text-xs text-ink-muted">owner</span>
							{/if}
						</a>
					{/each}
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				</div>
			{/if}

			{#if data.report}
				<CaseReport {...data.report} />
				{#if data.project.readmeHtml}
					<h2 class="mt-10 section-title">附件：README</h2>
				{/if}
			{/if}

			{#if data.project.readmeHtml}
				<section
					bind:this={readmeEl}
					use:reveal={{ delay: 100 }}
					class="readme-content prose prose-sm mt-8 max-w-none rounded-xl border border-border-case bg-surface-alt p-6 shadow-sm sm:prose-base dark:prose-invert"
					use:mermaidDiagrams={data.project.readmeHtml}
				>
					<!-- eslint-disable-next-line svelte/no-at-html-tags -- readmeHtml is rendered via renderMarkdown() + rehype-sanitize at sync time, never raw user input -->
					{@html data.project.readmeHtml}
				</section>
			{/if}

			<section class="mt-8 rounded-xl border border-border-case bg-surface-alt p-5 shadow-sm">
				<h2 class="section-title">Commit 熱力圖</h2>
				<div class="mt-3">
					<ContributionGraph data={data.project.commitDaily} />
				</div>
			</section>

			<section id="comments" class="mt-8">
				<h2 class="section-title">留言（{data.comments.length}）</h2>

				<ul class="mt-4 space-y-3">
					{#each data.comments as comment, i (comment.id)}
						<li
							use:reveal={{ delay: i * 50, y: 8 }}
							class="rounded-xl border border-border-case bg-surface-alt p-4 shadow-sm"
						>
							<span class="font-medium text-ink">{comment.author.name}</span>
							<p class="mt-1 text-sm text-ink-muted">{comment.body}</p>
						</li>
					{/each}
				</ul>

				<form method="post" action="?/comment" use:enhance class="mt-4 space-y-2">
					<textarea
						name="body"
						required
						rows="3"
						placeholder="留下你的想法..."
						class="w-full rounded-lg border border-border-case bg-surface p-3 text-sm text-ink focus:border-accent focus:ring-2 focus:ring-accent focus:outline-none"
					></textarea>
					<button
						type="submit"
						class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-strong"
					>
						送出留言
					</button>
				</form>
				{#if form?.message}
					<p class="mt-2 text-sm text-stamp-500 dark:text-stamp-300">{form.message}</p>
				{/if}
			</section>
		</article>

		<ReadingSidebar containerEl={readmeEl} extraLinks={[{ label: '留言', href: '#comments' }]}>
			<span
				class="flex items-center gap-1 rounded-full border border-border-case px-3 py-1 text-sm text-ink-muted"
			>
				<Star class="size-3.5 fill-brass text-brass" />
				{data.project.starCount}
			</span>
			<!-- eslint-disable svelte/no-navigation-without-resolve -- external GitHub/homepage URLs -->
			<a
				href="https://github.com/{data.project.githubOwner}/{data.project.githubRepo}"
				target="_blank"
				rel="noreferrer"
				class="flex items-center gap-1 rounded-full border border-border-case px-3 py-1 text-sm text-ink-muted transition hover:bg-surface-alt hover:text-ink"
			>
				<ExternalLink class="size-3.5" />
				GitHub
			</a>
			{#if data.project.homepageUrl}
				<a
					href={data.project.homepageUrl}
					target="_blank"
					rel="noreferrer"
					class="flex items-center gap-1 rounded-full border border-border-case px-3 py-1 text-sm text-ink-muted transition hover:bg-surface-alt hover:text-ink"
				>
					<ExternalLink class="size-3.5" />
					官方網站
				</a>
			{/if}
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		</ReadingSidebar>
	</div>
</div>

<style>
	/*
	 * Tailwind's Preflight sets img { display: block } site-wide (sensible for normal content
	 * images), but GitHub profile READMEs rely on the browser's native inline <img> flow to lay
	 * badges/stat cards out side by side and wrap them like text. Restore that just for README
	 * content so it matches how GitHub itself renders these — scoped here, not globally, so
	 * article/mood post images keep the normal block treatment.
	 */
	.readme-content :global(img) {
		display: inline;
		vertical-align: middle;
		margin: 0.2em 0.3em;
	}
</style>
