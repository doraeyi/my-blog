<script lang="ts">
	import { resolve } from '$app/paths';
	import Star from '@lucide/svelte/icons/star';
	import FolderGit2 from '@lucide/svelte/icons/folder-git-2';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="mx-auto max-w-5xl px-6 pt-28 pb-16">
	<h1 class="text-3xl font-bold text-ink">作品集</h1>
	<p class="mt-2 text-ink-muted">精選的 GitHub 專案</p>

	{#if data.projects.length === 0}
		<p class="mt-8 text-sm text-ink-muted">還沒有作品，去後台加一個吧。</p>
	{/if}

	<ul class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.projects as project, index (project.id)}
			<li>
				<a
					href={resolve('/portfolio/[id]', { id: project.id })}
					class="group relative flex h-full flex-col rounded-lg border border-border-case bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
				>
					<span
						aria-hidden="true"
						class="absolute -top-2 left-4 h-2 w-10 rounded-t-sm border border-b-0 border-border-case bg-surface-alt"
					></span>

					<span
						aria-hidden="true"
						class="absolute top-3 right-3 rotate-3 rounded border-2 border-accent/70 px-1.5 py-0.5 font-display text-[0.65rem] tracking-wider text-accent"
					>
						CASE #{String(index + 1).padStart(3, '0')}
					</span>

					<div class="flex items-center gap-2 text-ink-muted">
						<FolderGit2 class="size-4" />
						<span class="text-xs">{project.githubOwner}</span>
					</div>
					<h2 class="mt-2 font-display font-semibold text-ink group-hover:underline">
						{project.githubRepo}
					</h2>
					{#if project.description}
						<p class="mt-1.5 line-clamp-2 flex-1 text-sm text-ink-muted">{project.description}</p>
					{/if}
					<div class="mt-3 flex items-center gap-1 text-xs text-ink-muted">
						<Star class="size-3.5 text-accent" />
						{project.starCount}
					</div>
				</a>
			</li>
		{/each}
	</ul>
</div>
