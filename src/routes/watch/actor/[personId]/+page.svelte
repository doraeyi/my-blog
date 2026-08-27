<script lang="ts">
	import { resolve } from '$app/paths';
	import Clapperboard from '@lucide/svelte/icons/clapperboard';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="mx-auto max-w-4xl px-6 pt-28 pb-16">
	<div class="flex flex-col gap-6 sm:flex-row">
		{#if data.person.profileUrl}
			<img
				src={data.person.profileUrl}
				alt={data.person.name}
				class="h-72 w-auto shrink-0 self-start rounded-xl object-cover shadow-md"
			/>
		{/if}
		<div class="min-w-0">
			<h1 class="text-3xl font-bold text-ink">{data.person.name}</h1>
			{#if data.person.birthday || data.person.placeOfBirth}
				<p class="mt-1 text-sm text-ink-muted">
					{#if data.person.birthday}{data.person.birthday}{/if}
					{#if data.person.placeOfBirth}
						{data.person.birthday ? ' · ' : ''}{data.person.placeOfBirth}
					{/if}
				</p>
			{/if}
			{#if data.person.biography}
				<p class="mt-4 text-sm leading-relaxed whitespace-pre-line text-ink-muted">
					{data.person.biography}
				</p>
			{/if}
		</div>
	</div>

	{#if data.credits.length}
		<section class="mt-10">
			<h2 class="text-lg font-semibold text-ink">作品</h2>
			<ul class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
				{#each data.credits as credit (credit.mediaType + credit.tmdbId)}
					<li>
						{#if credit.localId}
							<a
								href={resolve('/watch/[id]', { id: credit.localId })}
								class="group flex flex-col overflow-hidden rounded-xl border border-border-case bg-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
							>
								{#if credit.posterUrl}
									<img
										src={credit.posterUrl}
										alt={credit.title}
										class="aspect-[2/3] w-full object-cover"
									/>
								{:else}
									<div class="flex aspect-[2/3] w-full items-center justify-center bg-surface-alt">
										<Clapperboard class="size-6 text-ink-muted" />
									</div>
								{/if}
								<div class="p-2.5">
									<p class="line-clamp-2 text-xs font-medium text-ink group-hover:underline">
										{credit.title}
									</p>
									<p class="mt-0.5 text-[11px] text-ink-muted">
										{credit.year ?? ''}{#if credit.character}
											· {credit.character}{/if}
									</p>
									<span
										class="mt-1 inline-block rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] text-accent"
									>
										已看過
									</span>
								</div>
							</a>
						{:else}
							<div
								class="flex flex-col overflow-hidden rounded-xl border border-border-case bg-surface opacity-70"
							>
								{#if credit.posterUrl}
									<img
										src={credit.posterUrl}
										alt={credit.title}
										class="aspect-[2/3] w-full object-cover"
									/>
								{:else}
									<div class="flex aspect-[2/3] w-full items-center justify-center bg-surface-alt">
										<Clapperboard class="size-6 text-ink-muted" />
									</div>
								{/if}
								<div class="p-2.5">
									<p class="line-clamp-2 text-xs font-medium text-ink">{credit.title}</p>
									<p class="mt-0.5 text-[11px] text-ink-muted">
										{credit.year ?? ''}{#if credit.character}
											· {credit.character}{/if}
									</p>
								</div>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</div>
