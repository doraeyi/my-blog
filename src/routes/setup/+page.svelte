<script lang="ts">
	import { fade } from 'svelte/transition';
	import { SvelteSet } from 'svelte/reactivity';
	import { tilt } from '$lib/actions/tilt';
	import Seo from '$lib/components/Seo.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { reveal } from '$lib/actions/reveal';
	import { gear, type GearItem, type GearModel } from '$lib/collections';
	import { SPIN_FRAMES, gearSlug, posterUrl, spinUrl } from '$lib/gear-shots';
	import GearModelView from '$lib/components/GearModelView.svelte';
	import Monitor from '@lucide/svelte/icons/monitor';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	type Modelled = GearItem & { model: GearModel };

	const total = gear.reduce((n, g) => n + g.items.length, 0);
	let active = $state<string>('all');
	const shown = $derived(active === 'all' ? gear : gear.filter((g) => g.name === active));

	// Only one item is ever live in 3D: the one on the stand. Everything in the
	// list is a pre-rendered still (see /dev/gear-shots).
	const exhibits = gear.flatMap((g) => g.items).filter((i): i is Modelled => !!i.model);
	// Raw state: the item stays the same object, so indexOf finds it.
	let onStand = $state.raw<Modelled | undefined>(exhibits[0]);
	const standNo = $derived(onStand ? exhibits.indexOf(onStand) : -1);
	let stand: HTMLElement | undefined = $state();

	// Turntable strips are fetched on first hover, and only shown once loaded.
	const spinRequested = new SvelteSet<string>();
	const spinLoaded = new SvelteSet<string>();

	function show(item: Modelled) {
		onStand = item;
		const top = stand?.getBoundingClientRect().top ?? 0;
		if (top < 0 || top > window.innerHeight * 0.5) {
			stand?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}
	function step(dir: 1 | -1) {
		onStand = exhibits[(standNo + dir + exhibits.length) % exhibits.length];
	}
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
		{#if onStand}
			{@const wide = onStand.model.kind === 'gpro-x-tkl'}
			<!-- The stand: the single live 3D exhibit. -->
			<section
				bind:this={stand}
				use:reveal
				aria-label="展示台"
				class="exhibit mb-12 grid scroll-mt-6 overflow-hidden rounded-sm border border-border-case md:grid-cols-[1.5fr_1fr]"
			>
				<div class="stage relative h-[22rem] md:h-[30rem]">
					<span aria-hidden="true" class="plinth" class:wide></span>
					{#key onStand}
						<div class="absolute inset-0" in:fade={{ duration: 250 }}>
							<GearModelView model={onStand.model} label={onStand.name} />
						</div>
					{/key}
				</div>
				<div class="flex flex-col justify-center gap-3 px-7 py-8">
					<p class="font-mono-hack text-xs tracking-[0.3em] text-ink-muted">
						EXHIBIT {String(standNo + 1).padStart(2, '0')}
						<span class="opacity-60">/ {String(exhibits.length).padStart(2, '0')}</span>
					</p>
					{#key onStand}
						<div class="flex flex-col gap-3" in:fade={{ duration: 250 }}>
							<p class="font-display text-3xl text-ink sm:text-4xl">{onStand.name}</p>
							{#if onStand.spec}
								<p class="font-mono-hack text-sm text-ink-muted">{onStand.spec}</p>
							{/if}
							{#if onStand.note}
								<p class="text-sm leading-relaxed text-ink-muted">{onStand.note}</p>
							{/if}
							<span class="date-stamp mt-2 self-start">已登記</span>
						</div>
					{/key}
					{#if exhibits.length > 1}
						<div class="mt-4 flex gap-2">
							<button type="button" class="icon-btn" aria-label="上一件" onclick={() => step(-1)}>
								<ChevronLeft class="size-4" />
							</button>
							<button type="button" class="icon-btn" aria-label="下一件" onclick={() => step(1)}>
								<ChevronRight class="size-4" />
							</button>
						</div>
					{/if}
				</div>
			</section>
		{/if}

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
								{@const slug = gearSlug(item.name)}
								{@const current = onStand?.name === item.name}
								<li use:reveal={{ delay: i * 40, y: 8 }}>
									<button
										type="button"
										aria-pressed={current}
										onclick={() => show(item as Modelled)}
										onpointerenter={() => spinRequested.add(slug)}
										onfocus={() => spinRequested.add(slug)}
										class="gear-card group relative block w-full overflow-hidden rounded-sm border text-left transition {current
											? 'border-accent'
											: 'border-border-case hover:border-ink-muted/60'}"
										class:spin-ready={spinLoaded.has(slug)}
									>
										<div class="shot stage relative aspect-[4/3] overflow-hidden">
											<img
												src={posterUrl(slug)}
												alt=""
												loading="lazy"
												decoding="async"
												class="poster absolute inset-0 size-full object-contain"
											/>
											{#if spinRequested.has(slug)}
												<img
													src={spinUrl(slug)}
													alt=""
													decoding="async"
													onload={() => spinLoaded.add(slug)}
													class="strip absolute top-0 left-0 h-full"
													style:width="{SPIN_FRAMES * 100}%"
													style:--frames={SPIN_FRAMES}
												/>
											{/if}
										</div>
										<div class="flex items-start justify-between gap-3 bg-surface-alt px-4 py-3">
											<div class="min-w-0">
												<p class="font-medium text-ink">{item.name}</p>
												{#if item.spec}
													<p class="mt-1 truncate font-mono-hack text-xs text-ink-muted">{item.spec}</p>
												{/if}
											</div>
											{#if current}
												<span class="date-stamp shrink-0" in:fade={{ duration: 200 }}>檢視中</span>
											{/if}
										</div>
									</button>
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
	.plinth.wide {
		width: 80%;
		bottom: 14%;
	}

	/* List cards: a still, and on hover a turntable strip stepped frame by frame. */
	.gear-card .poster {
		transition: transform 0.4s cubic-bezier(0.2, 0.7, 0.2, 1);
	}
	.gear-card:hover .poster {
		transform: scale(1.03);
	}
	.strip {
		max-width: none;
		opacity: 0;
	}
	@media (hover: hover) and (prefers-reduced-motion: no-preference) {
		.gear-card.spin-ready:is(:hover, :focus-visible) .poster {
			opacity: 0;
		}
		.gear-card.spin-ready:is(:hover, :focus-visible) .strip {
			opacity: 1;
			animation: turntable 2s steps(var(--frames)) infinite;
		}
	}
	@keyframes turntable {
		to {
			transform: translateX(-100%);
		}
	}
</style>
