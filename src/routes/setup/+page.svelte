<script lang="ts">
	import { tilt } from '$lib/actions/tilt';
	import Seo from '$lib/components/Seo.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { reveal } from '$lib/actions/reveal';
	import { gear } from '$lib/collections';
	import Monitor from '@lucide/svelte/icons/monitor';
	import PhoneModel from '$lib/components/PhoneModel.svelte';

	const total = gear.reduce((n, g) => n + g.items.length, 0);
	let active = $state<string>('all');
	const shown = $derived(active === 'all' ? gear : gear.filter((g) => g.name === active));
</script>

<Seo title="裝備清單" description="每天在用的硬體與工具。" />

<div class="mx-auto max-w-5xl px-6 pb-16">
	<PageHeader title="裝備清單" stamp="清點" description="每天在用的硬體與工具，一覽。" />

	{#if gear.length === 0}
		<div
			class="mx-auto flex max-w-md flex-col items-center rounded-3xl border border-dashed border-border-case px-6 py-16 text-center"
			use:reveal
		>
			<span
				class="flex size-12 items-center justify-center rounded-2xl bg-surface-alt text-ink-muted"
			>
				<Monitor class="size-6" />
			</span>
			<p class="mt-4 font-medium text-ink">配備清單整理中</p>
			<p class="mt-1 text-sm text-ink-muted">桌上的東西太多，還在一樣一樣登記。</p>
		</div>
	{:else}
		<div class="mb-8 flex flex-wrap justify-center gap-2" use:reveal>
			{#each [{ name: 'all', count: total }, ...gear.map( (g) => ({ name: g.name, count: g.items.length }) )] as tab (tab.name)}
				<button
					type="button"
					onclick={() => (active = tab.name)}
					class="flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition {active ===
					tab.name
						? 'border-accent bg-accent/10 text-ink'
						: 'border-border-case text-ink-muted hover:text-ink'}"
				>
					{tab.name === 'all' ? '全部' : tab.name}
					<span class="font-mono-hack text-xs opacity-70">{tab.count}</span>
				</button>
			{/each}
		</div>

		<div class="space-y-12">
			{#each shown as group (group.name)}
				<section use:reveal>
					<div class="flex items-baseline gap-3 border-b border-border-case/60 pb-3">
						<h2 class="text-xl font-bold text-ink">{group.name}</h2>
						{#if group.tagline}
							<p class="text-sm text-ink-muted">{group.tagline}</p>
						{/if}
					</div>
					<ul class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{#each group.items as item, i (item.name)}
							{#if item.model}
								<li
									use:reveal={{ delay: i * 40, y: 8 }}
									class="exhibit grid overflow-hidden rounded-sm border border-border-case sm:col-span-2 md:grid-cols-[1.2fr_1fr] lg:col-span-3"
								>
									<div class="stage relative h-[26rem] md:h-[30rem]">
										<span aria-hidden="true" class="plinth"></span>
										<PhoneModel finish={item.model.finish} label={item.name} />
									</div>
									<div class="flex flex-col justify-center gap-3 px-7 py-8">
										<p class="font-mono-hack text-xs tracking-[0.3em] text-ink-muted">
											EXHIBIT {String(i + 1).padStart(2, '0')}
										</p>
										<p class="font-display text-3xl text-ink sm:text-4xl">{item.name}</p>
										{#if item.spec}
											<p class="font-mono-hack text-sm text-ink-muted">{item.spec}</p>
										{/if}
										{#if item.note}
											<p class="text-sm leading-relaxed text-ink-muted">{item.note}</p>
										{/if}
										<span class="date-stamp mt-2 self-start">已登記</span>
									</div>
								</li>
							{:else}
								<li
									use:reveal={{ delay: i * 40, y: 8 }}
									use:tilt
									class="case-card rounded-2xl border border-border-case/70 bg-surface-alt/50 p-4"
								>
									<p class="font-medium text-ink">{item.name}</p>
									{#if item.spec}
										<p class="mt-1 font-mono-hack text-xs text-ink-muted">{item.spec}</p>
									{/if}
									{#if item.note}
										<p class="mt-2 text-sm text-ink-muted">{item.note}</p>
									{/if}
								</li>
							{/if}
						{/each}
					</ul>
				</section>
			{/each}
		</div>
	{/if}
</div>

<style>
	.exhibit {
		background: var(--color-surface-alt);
	}
	/* Evidence pedestal: a pool of light under the object, darker toward the edges. */
	.stage {
		background:
			radial-gradient(ellipse 60% 45% at 50% 42%, rgba(255, 238, 200, 0.16), transparent 70%),
			linear-gradient(to bottom, rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.32));
	}
	.plinth {
		position: absolute;
		left: 50%;
		bottom: 9%;
		width: 46%;
		height: 9%;
		border-radius: 50%;
		transform: translateX(-50%);
		background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.45), transparent 70%);
		pointer-events: none;
	}
</style>
