<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import PinString from '$lib/components/PinString.svelte';
	import { pinned } from '$lib/actions/pinned';
	import { resolve } from '$app/paths';
	import Star from '@lucide/svelte/icons/star';
	import FolderGit2 from '@lucide/svelte/icons/folder-git-2';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Seo title="作品集" description="做過的專案與 GitHub 上的作品。" />

<div class="mx-auto max-w-5xl px-6 pb-16">
	<PageHeader title="作品集" stamp="作品" description="精選的 GitHub 專案。" />

	{#if data.projects.length === 0}
		<p class="mt-8 text-sm text-ink-muted">還沒有作品，去後台加一個吧。</p>
	{/if}

	<!-- Each project is a piece of evidence pinned to the board, all on one string. -->
	<PinString class="evidence">
		{#each data.projects as project, index (project.id)}
			<a
				href={resolve('/portfolio/[id]', { id: project.id })}
				class="exhibit"
				use:pinned={{ delay: (index % 3) * 110, tilt: [-1.2, 0.8, -0.4][index % 3] }}
			>
				<span class="exhibit-no font-mono-hack">EXHIBIT {String(index + 1).padStart(2, '0')}</span>
				<span class="owner font-mono-hack"
					><FolderGit2 class="size-3.5" />{project.githubOwner}</span
				>
				<h2 class="exhibit-title font-display">
					<span class="ink-line">{project.githubRepo}</span>
				</h2>
				{#if project.description}
					<p class="exhibit-desc">{project.description}</p>
				{/if}
				<span class="exhibit-foot font-mono-hack">
					<span class="flex items-center gap-1"><Star class="size-3.5" />{project.starCount}</span>
					{#if project.caseReport}<span class="report">附結案報告</span>{/if}
					<span class="exhibit-go" aria-hidden="true">檢視 →</span>
				</span>
			</a>
		{/each}
	</PinString>
</div>

<style>
	:global(.evidence) {
		display: grid;
		gap: 3rem 2rem;
		margin-top: 3rem;
	}
	@media (min-width: 640px) {
		:global(.evidence) {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	@media (min-width: 960px) {
		:global(.evidence) {
			grid-template-columns: repeat(3, 1fr);
		}
	}
	/* An evidence card: the exhibit number along the top. */
	.exhibit {
		display: flex;
		flex-direction: column;
		min-height: 13rem;
		padding: 1.5rem 1.3rem 1.1rem;
		border: 1px solid rgb(60 40 20 / 0.1);
		border-radius: 3px;
		background: linear-gradient(180deg, rgb(255 255 255 / 0.7), transparent 45%), #fffcf5;
		box-shadow:
			0 1px 2px rgb(40 25 10 / 0.08),
			0 14px 28px -14px rgb(40 25 10 / 0.38);
		transition: box-shadow 0.35s;
	}
	.exhibit:hover {
		box-shadow:
			0 1px 2px rgb(40 25 10 / 0.08),
			0 28px 46px -18px rgb(40 25 10 / 0.48),
			0 0 0 1px color-mix(in srgb, var(--color-accent) 30%, transparent);
	}
	.exhibit-no {
		color: var(--color-accent);
		font-size: 0.68rem;
		letter-spacing: 0.2em;
	}
	.owner {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		margin-top: 0.9rem;
		color: var(--color-ink-muted);
		font-size: 0.72rem;
	}
	.exhibit-title {
		margin-top: 0.3rem;
		color: var(--color-ink);
		font-size: 1.6rem;
		line-height: 1.2;
		word-break: break-word;
	}
	.exhibit-desc {
		display: -webkit-box;
		margin-top: 0.5rem;
		overflow: hidden;
		color: var(--color-ink-muted);
		font-size: 0.88rem;
		line-height: 1.7;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}
	.exhibit-foot {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		margin-top: auto;
		padding-top: 1rem;
		color: var(--color-ink-muted);
		font-size: 0.72rem;
	}
	.report {
		padding: 0.05rem 0.4rem;
		border: 1px solid var(--color-accent);
		border-radius: 3px;
		color: var(--color-accent);
		rotate: -3deg;
	}
	.exhibit-go {
		margin-left: auto;
		color: var(--color-accent);
		letter-spacing: 0.1em;
		opacity: 0;
		transform: translateX(-8px);
		transition:
			opacity 0.25s,
			transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.exhibit:hover .exhibit-go,
	.exhibit:focus-visible .exhibit-go {
		opacity: 1;
		transform: none;
	}
	@media (prefers-reduced-motion: reduce) {
		.exhibit-go {
			transition: none;
		}
	}
</style>
