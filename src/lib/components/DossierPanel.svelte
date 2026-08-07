<script lang="ts">
	import Typewriter from './Typewriter.svelte';
	import ParticlePortrait from './ParticlePortrait.svelte';

	let {
		fields,
		photoSrc,
		photoAlt = '',
		logoSrc
	}: {
		fields: { label: string; value: string }[];
		photoSrc?: string;
		photoAlt?: string;
		logoSrc?: string;
	} = $props();

	const speed = 28;
	const baseDelay = 700;
	const rowGap = 260;

	function delayFor(index: number) {
		let delay = baseDelay;
		for (let i = 0; i < index; i++) {
			delay += fields[i].value.length * speed + rowGap;
		}
		return delay;
	}
</script>

<section id="about" class="relative overflow-hidden bg-case-950 px-6 py-24">
	<div
		aria-hidden="true"
		class="pointer-events-none absolute inset-0 opacity-[0.15] [background:repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(240,180,41,0.4)_3px)]"
	></div>

	<div class="relative mx-auto max-w-4xl">
		<div class="mb-8 flex items-center gap-3">
			<span class="size-2 animate-pulse rounded-full bg-emerald-400"></span>
			<p class="font-mono-hack text-xs tracking-[0.3em] text-phosphor-400/90 uppercase">
				Subject Profile // Access Granted
			</p>
		</div>

		<div
			class="grid gap-10 rounded-lg border border-phosphor-400/20 bg-black/40 p-6 shadow-[0_0_60px_-15px_rgba(240,180,41,0.35)] backdrop-blur-sm sm:grid-cols-[220px_1fr] sm:p-10"
		>
			<div
				class="relative mx-auto aspect-[3/4] w-full max-w-[220px] overflow-hidden rounded border border-stamp-500/50 bg-gradient-to-br from-case-900 to-black"
			>
				<span class="absolute top-0 left-0 size-4 border-t-2 border-l-2 border-stamp-400"></span>
				<span class="absolute top-0 right-0 size-4 border-t-2 border-r-2 border-stamp-400"></span>
				<span class="absolute bottom-0 left-0 size-4 border-b-2 border-l-2 border-stamp-400"></span>
				<span class="absolute right-0 bottom-0 size-4 border-r-2 border-b-2 border-stamp-400"
				></span>

				{#if photoSrc && logoSrc}
					<ParticlePortrait {photoSrc} {logoSrc} />
				{:else if photoSrc}
					<img src={photoSrc} alt={photoAlt} class="h-full w-full object-cover opacity-90" />
				{:else}
					<div class="flex h-full items-center justify-center">
						<span class="font-mono-hack text-sm tracking-widest text-phosphor-600/70">
							NO SIGNAL
						</span>
					</div>
				{/if}

				<div class="scanline pointer-events-none absolute inset-x-0 h-10"></div>
			</div>

			<div class="space-y-4 font-mono-hack">
				{#each fields as field, i (field.label)}
					<div
						class="flex flex-col gap-0.5 border-b border-phosphor-400/10 pb-2 sm:flex-row sm:items-baseline sm:gap-3"
					>
						<span class="w-32 shrink-0 text-xs tracking-widest text-case-500 uppercase">
							{field.label}
						</span>
						<span class="text-sm text-phosphor-300">
							<Typewriter text={field.value} {speed} startDelay={delayFor(i)} />
						</span>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>

<style>
	.scanline {
		background: linear-gradient(to bottom, transparent, rgba(240, 180, 41, 0.35), transparent);
		animation: scan 3.2s linear infinite;
	}

	@keyframes scan {
		0% {
			top: -10%;
		}
		100% {
			top: 100%;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.scanline {
			animation: none;
			opacity: 0;
		}
	}
</style>
