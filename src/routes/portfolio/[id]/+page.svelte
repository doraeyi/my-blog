<script lang="ts">
	import { enhance } from '$app/forms';
	import ReadingSidebar from '$lib/components/ReadingSidebar.svelte';
	import ContributionGraph from '$lib/components/ContributionGraph.svelte';
	import Star from '@lucide/svelte/icons/star';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let readmeEl: HTMLElement | undefined = $state();
</script>

<div class="mx-auto max-w-6xl px-6 pt-28 pb-16">
	<div class="grid gap-10 lg:grid-cols-[1fr_220px]">
		<article class="min-w-0">
			<h1 class="text-3xl font-bold text-gray-900">{data.project.githubRepo}</h1>
			{#if data.project.description}
				<p class="mt-2 text-gray-600">{data.project.description}</p>
			{/if}

			{#if data.project.collaborators.length}
				<div class="mt-5 flex flex-wrap gap-3">
					<!-- eslint-disable svelte/no-navigation-without-resolve -- external GitHub profile URL -->
					{#each data.project.collaborators as collaborator (collaborator.id)}
						<a
							href={collaborator.profileUrl ?? '#'}
							target="_blank"
							rel="noreferrer"
							class="flex items-center gap-2 rounded-full border border-gray-200 py-1 pr-3 pl-1 text-sm text-gray-700 transition hover:bg-gray-50"
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
								<span class="text-xs text-gray-400">owner</span>
							{/if}
						</a>
					{/each}
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				</div>
			{/if}

			{#if data.project.readmeHtml}
				<section
					bind:this={readmeEl}
					class="prose prose-sm mt-8 max-w-none rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:prose-base"
				>
					<!-- eslint-disable-next-line svelte/no-at-html-tags -- readmeHtml is rendered via renderMarkdown() + rehype-sanitize at sync time, never raw user input -->
					{@html data.project.readmeHtml}
				</section>
			{/if}

			<section class="mt-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
				<h2 class="text-base font-semibold text-gray-900">Commit 熱力圖</h2>
				<div class="mt-3">
					<ContributionGraph data={data.project.commitDaily} />
				</div>
			</section>

			<section id="comments" class="mt-8">
				<h2 class="text-lg font-semibold text-gray-900">留言（{data.comments.length}）</h2>

				<ul class="mt-4 space-y-3">
					{#each data.comments as comment (comment.id)}
						<li class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
							<span class="font-medium text-gray-900">{comment.author.name}</span>
							<p class="mt-1 text-sm text-gray-700">{comment.body}</p>
						</li>
					{/each}
				</ul>

				<form method="post" action="?/comment" use:enhance class="mt-4 space-y-2">
					<textarea
						name="body"
						required
						rows="3"
						placeholder="留下你的想法..."
						class="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					></textarea>
					<button
						type="submit"
						class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
					>
						送出留言
					</button>
				</form>
				{#if form?.message}
					<p class="mt-2 text-sm text-red-600">{form.message}</p>
				{/if}
			</section>
		</article>

		<ReadingSidebar containerEl={readmeEl} extraLinks={[{ label: '留言', href: '#comments' }]}>
			<span
				class="flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600"
			>
				<Star class="size-3.5 text-yellow-500" />
				{data.project.starCount}
			</span>
			<!-- eslint-disable svelte/no-navigation-without-resolve -- external GitHub/homepage URLs -->
			<a
				href="https://github.com/{data.project.githubOwner}/{data.project.githubRepo}"
				target="_blank"
				rel="noreferrer"
				class="flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600 transition hover:bg-gray-50"
			>
				<ExternalLink class="size-3.5" />
				GitHub
			</a>
			{#if data.project.homepageUrl}
				<a
					href={data.project.homepageUrl}
					target="_blank"
					rel="noreferrer"
					class="flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600 transition hover:bg-gray-50"
				>
					<ExternalLink class="size-3.5" />
					官方網站
				</a>
			{/if}
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		</ReadingSidebar>
	</div>
</div>
