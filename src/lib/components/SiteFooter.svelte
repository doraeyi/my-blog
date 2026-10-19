<!--
	The cabinet's bottom drawer: a brass label holder with the drawer handle,
	and every drawer's index cards typed out underneath as a contents list.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { drawers, SITE_LAUNCHED_AT } from '$lib/site-nav';
	import { socialLinks, contactEmail } from '$lib/social-links';
	import BrandIcon from '$lib/components/icons/BrandIcon.svelte';
	import Mail from '@lucide/svelte/icons/mail';
	import Rss from '@lucide/svelte/icons/rss';

	const opened = SITE_LAUNCHED_AT.toLocaleDateString('zh-TW', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	});
	const year = new Date().getFullYear();
	const sections = drawers.filter((d) => d.cards.length);
</script>

<footer class="drawer-front relative mt-24 pb-16 lg:pb-0">
	<div class="mx-auto max-w-5xl px-6 pt-10 pb-12">
		<div class="flex flex-col items-center gap-3">
			<div class="label-holder">
				<span class="font-mono-hack text-[0.65rem] tracking-[0.3em] text-case-600">
					DRAWER · 檔案總覽
				</span>
				<span class="font-display text-lg text-case-900">Liam 偵探手記</span>
			</div>
			<span aria-hidden="true" class="handle"></span>
		</div>

		<div class="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
			{#each sections as d (d.id)}
				<div>
					<!-- eslint-disable svelte/no-navigation-without-resolve -- static app paths from site-nav -->
					<a href={d.href} class="font-display text-base text-ink hover:text-accent">{d.label}</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
					<ul class="mt-3 space-y-1.5">
						{#each d.cards as c (c.href)}
							<li>
								<!-- eslint-disable svelte/no-navigation-without-resolve -- static app paths from site-nav -->
								<a href={c.href} class="typed-link text-sm text-ink-muted hover:text-ink">
									{c.label}
								</a>
								<!-- eslint-enable svelte/no-navigation-without-resolve -->
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>

		<div
			class="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-border-case pt-6"
		>
			<p class="font-mono-hack text-xs text-ink-muted">
				本案於 {opened} 立案 · © {year} Liam
			</p>
			<div class="flex items-center gap-1.5">
				{#each socialLinks as link (link.name)}
					<!-- eslint-disable svelte/no-navigation-without-resolve -- external social link -->
					<a
						href={link.href}
						aria-label={link.name}
						target="_blank"
						rel="noopener"
						class="icon-btn size-9"
					>
						<BrandIcon name={link.icon} class="size-3.5" />
					</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				{/each}
				<a href="mailto:{contactEmail}" aria-label="Email" class="icon-btn size-9">
					<Mail class="size-3.5" />
				</a>
				<a href={resolve('/rss.xml')} aria-label="RSS" class="icon-btn size-9">
					<Rss class="size-3.5" />
				</a>
			</div>
		</div>
	</div>
</footer>

<style>
	.drawer-front {
		border-top: 1px solid var(--color-border-case);
		background:
			linear-gradient(to bottom, rgba(0, 0, 0, 0.06), transparent 18px), var(--color-surface-alt);
	}

	.label-holder {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		padding: 0.6rem 1.6rem;
		border-radius: 4px;
		background: #f8f1df;
		/* brass frame */
		box-shadow:
			0 0 0 3px #b8904f,
			0 0 0 4px #8a6a36,
			0 8px 16px -8px rgba(0, 0, 0, 0.5);
	}

	.handle {
		width: 7rem;
		height: 0.7rem;
		border-radius: 0 0 999px 999px;
		background: linear-gradient(to bottom, #d9b26a, #8a6a36);
		box-shadow: 0 6px 10px -4px rgba(0, 0, 0, 0.45);
	}

	.typed-link {
		background-image: linear-gradient(currentColor, currentColor);
		background-size: 0 1px;
		background-repeat: no-repeat;
		background-position: 0 100%;
		transition: background-size 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.typed-link:hover {
		background-size: 100% 1px;
	}
</style>
