<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { reveal } from '$lib/actions/reveal';
	import { timeAgo } from '$lib/format';
	import Globe from '@lucide/svelte/icons/globe';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Seo title="現場筆記" description="想到什麼寫什麼，看完什麼順手丟上來。" />

<div class="mx-auto max-w-2xl px-6 pb-16">
	<PageHeader title="現場筆記" stamp="速記" description="想到什麼寫什麼，看完什麼順手丟上來。" />

	{#if data.thoughts.length === 0}
		<p class="py-16 text-center text-sm text-ink-muted">還沒有碎念。安靜也是一種狀態。</p>
	{:else}
		<ol class="relative border-l border-border-case/70 pl-6">
			{#each data.thoughts as t, i (t.id)}
				<li class="relative pb-8 last:pb-0" use:reveal={{ delay: Math.min(i, 8) * 50, y: 10 }}>
					<span
						aria-hidden="true"
						class="absolute top-1.5 -left-[1.82rem] size-2.5 rounded-full border-2 border-surface bg-accent ring-4 ring-accent/15"
					></span>
					<p class="flex items-center gap-2 text-xs text-ink-muted">
						<span class="font-medium text-ink">Liam</span>
						<time datetime={t.createdAt.toISOString()} title={t.createdAt.toLocaleString('zh-TW')}>
							{timeAgo(t.createdAt)}
						</time>
					</p>
					<div
						class="mt-2 rounded-2xl rounded-tl-sm border border-border-case/70 bg-surface-alt/60 px-4 py-3 backdrop-blur-sm"
					>
						<p class="leading-relaxed whitespace-pre-line text-ink">{t.body}</p>
						{#if t.linkUrl}
							<!-- eslint-disable svelte/no-navigation-without-resolve -- external link the author attached -->
							<a
								href={t.linkUrl}
								target="_blank"
								rel="noopener"
								class="group mt-3 flex items-center gap-2 rounded-xl border border-border-case/70 bg-surface px-3 py-2 text-sm text-ink-muted transition hover:border-accent hover:text-ink"
							>
								<Globe class="size-4 shrink-0" />
								<span class="truncate">{t.linkHost}</span>
								<ArrowUpRight
									class="ml-auto size-4 shrink-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
								/>
							</a>
							<!-- eslint-enable svelte/no-navigation-without-resolve -->
						{/if}
					</div>
				</li>
			{/each}
		</ol>
		<p class="mt-12 text-center text-sm text-ink-muted/80 italic">更多時候，只是想說給空氣聽。</p>
	{/if}
</div>
