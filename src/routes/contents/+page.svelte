<!--
	目錄: the contents page of Liam's book — the first bookmark. Every chapter
	with its number and a dotted leader, and the pages inside it.
-->
<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { reveal } from '$lib/actions/reveal';
	import { chapters } from '$lib/site-nav';
</script>

<Seo title="目錄" description="這本調查檔案裡有什麼：關於、作品收藏、文章、筆記和留言。" />

<div class="mx-auto max-w-4xl px-6 pb-16">
	<PageHeader
		title="目錄"
		stamp="索引"
		description="這本調查檔案裡有什麼，從這裡翻到想看的那一章。"
	/>

	<ol class="chapters">
		{#each chapters as d, i (d.id)}
			<li class="chapter" use:reveal={{ delay: i * 70, y: 10 }} style="--c: {d.color}">
				<!-- eslint-disable svelte/no-navigation-without-resolve -- static app paths (some with a query) from site-nav -->
				<a href={d.href} class="chapter-line">
					<span class="chapter-no">{d.no}</span>
					<span class="chapter-name">{d.label}</span>
					<span class="leader" aria-hidden="true"></span>
				</a>
				{#if d.cards.length}
					<ul class="entries">
						{#each d.cards as c (c.href)}
							<li>
								<a href={c.href} class="entry">
									<span class="entry-name">{c.label}</span>
									<span class="entry-note">{c.note}</span>
								</a>
							</li>
						{/each}
					</ul>
				{:else if d.blurb}
					<p class="entry-note blurb">{d.blurb}</p>
				{/if}
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			</li>
		{/each}
	</ol>
</div>

<style>
	.chapters {
		display: grid;
		gap: 2rem 3rem;
		padding-top: 1.4rem;
		border-top: 2px solid #2c2118;
	}
	@media (min-width: 720px) {
		.chapters {
			grid-template-columns: 1fr 1fr;
		}
	}
	.chapter-line {
		display: flex;
		align-items: baseline;
		gap: 0.8rem;
	}
	.chapter-no {
		position: relative;
		width: 1.8rem;
		color: #8e1d12;
		font-family: var(--font-display);
		font-size: 1.15rem;
	}
	/* The chapter's bookmark colour, as a short ribbon beside its number */
	.chapter-no::before {
		content: '';
		position: absolute;
		top: 0.1em;
		left: -0.85rem;
		width: 0.3rem;
		height: 1.2em;
		border-radius: 1px;
		background: var(--c);
	}
	.chapter-name {
		font-family: var(--font-display);
		font-size: 1.4rem;
		transition: color 0.15s;
	}
	.chapter-line:hover .chapter-name {
		color: #8e1d12;
	}
	.leader {
		flex: 1;
		border-bottom: 2px dotted #b9a682;
	}
	.entries {
		margin-top: 0.45rem;
		padding-left: 2.6rem;
	}
	.entry {
		display: flex;
		align-items: baseline;
		gap: 0.8rem;
		padding: 0.28rem 0;
		transition: transform 0.2s ease;
	}
	.entry:hover {
		transform: translateX(4px);
	}
	.entry-name {
		flex: none;
	}
	.entry:hover .entry-name {
		color: #8e1d12;
	}
	.entry-note {
		overflow: hidden;
		color: #8a7458;
		font-size: 0.8rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.blurb {
		margin-top: 0.45rem;
		padding-left: 2.6rem;
		white-space: normal;
	}
	@media (prefers-reduced-motion: reduce) {
		.entry {
			transition: none;
		}
	}
</style>
