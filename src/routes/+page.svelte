<script lang="ts">
	import Typewriter from '$lib/components/Typewriter.svelte';
	import BrandIcon from '$lib/components/icons/BrandIcon.svelte';
	import DossierPanel from '$lib/components/DossierPanel.svelte';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Mail from '@lucide/svelte/icons/mail';
	import Rss from '@lucide/svelte/icons/rss';
	import profilePhoto from '$lib/assets/profile.png';
	import logo from '$lib/assets/logo.png';

	// Placeholder content — swap tagline/description/links in once finalized.
	const name = 'Liam';
	const tagline = 'meaningful products';
	const description = 'A FULL-STACK ENGINEER BUILDING THINGS FOR THE WEB.';

	// Placeholder profile fields — swap in real bio + photo later.
	const profileFields = [
		{ label: 'Name', value: 'LIAM CHEN' },
		{ label: 'Role', value: 'FULL-STACK ENGINEER' },
		{ label: 'Location', value: 'TAIPEI, TW' },
		{ label: 'Status', value: 'ACTIVE // OPEN TO WORK' },
		{ label: 'Specialty', value: 'SVELTE / TYPESCRIPT / SYSTEM DESIGN' }
	];

	const socialLinks = [
		{ name: 'GitHub', href: '#', icon: 'github' as const },
		{ name: 'LinkedIn', href: '#', icon: 'linkedin' as const },
		{ name: 'Instagram', href: '#', icon: 'instagram' as const },
		{ name: 'Facebook', href: '#', icon: 'facebook' as const }
	];

	const greeting = `Hi, I'm ${name}`;
	const waveDelay = 300 + greeting.length * 70 + 200;
</script>

<section
	class="relative flex min-h-[calc(100vh-2rem)] items-center overflow-hidden bg-surface px-6"
>
	<div
		aria-hidden="true"
		class="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
	>
		<span
			class="text-[16vw] leading-none font-black tracking-tighter text-case-200 uppercase dark:text-case-900"
		>
			{name}
		</span>
	</div>

	<div
		aria-hidden="true"
		class="dark:from-stamp-900 pointer-events-none absolute top-1/2 right-[-8%] size-[32rem] -translate-y-1/2 rounded-full bg-gradient-to-br from-stamp-200 via-case-200 to-case-100 opacity-70 blur-3xl dark:via-case-800 dark:to-case-950"
	></div>
	<div
		aria-hidden="true"
		class="pointer-events-none absolute top-1/2 right-[8%] hidden size-36 -translate-y-1/2 items-center justify-center rounded-full border border-border-case bg-surface shadow-xl sm:flex"
	>
		<span class="text-4xl font-black text-ink">{name.charAt(0)}</span>
	</div>

	<div class="relative mx-auto w-full max-w-2xl">
		<h1
			class="flex flex-wrap items-center gap-2 font-display text-4xl font-bold text-ink sm:text-5xl"
		>
			<Typewriter text={greeting} />
			<span
				class="wave inline-block opacity-0"
				style="animation-delay: {waveDelay}ms"
				aria-hidden="true">👋</span
			>
		</h1>

		<p class="mt-5 flex flex-wrap items-center gap-2 text-lg text-ink-muted sm:text-xl">
			I turn ideas into
			<span
				class="inline-flex items-center gap-1.5 rounded-full border border-border-case bg-surface-alt px-3 py-1 text-base font-medium text-ink"
			>
				<Sparkles class="size-4 text-accent" />
				{tagline}
			</span>
			.
		</p>

		<p
			class="mt-6 font-display text-sm font-medium tracking-widest text-accent uppercase dark:text-accent-strong"
		>
			{description}
		</p>

		<div class="mt-8 flex gap-3">
			{#each socialLinks as link (link.name)}
				<!-- eslint-disable svelte/no-navigation-without-resolve -- placeholder external social links, not app routes -->
				<a
					href={link.href}
					aria-label={link.name}
					class="flex size-10 items-center justify-center rounded-full border border-border-case text-ink-muted transition hover:border-case-400 hover:bg-surface-alt hover:text-ink"
				>
					<BrandIcon name={link.icon} class="size-4" />
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			{/each}
			<a
				href="mailto:you@example.com"
				aria-label="Email"
				class="flex size-10 items-center justify-center rounded-full border border-border-case text-ink-muted transition hover:border-case-400 hover:bg-surface-alt hover:text-ink"
			>
				<Mail class="size-4" />
			</a>
			<!-- eslint-disable svelte/no-navigation-without-resolve -- placeholder until the RSS feed route exists -->
			<a
				href="/rss.xml"
				aria-label="RSS"
				class="flex size-10 items-center justify-center rounded-full border border-border-case text-ink-muted transition hover:border-case-400 hover:bg-surface-alt hover:text-ink"
			>
				<Rss class="size-4" />
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		</div>
	</div>
</section>

<DossierPanel fields={profileFields} photoSrc={profilePhoto} logoSrc={logo} />

<style>
	.wave {
		animation: wave-in 0.6s ease-out forwards;
	}

	@keyframes wave-in {
		0% {
			opacity: 0;
			transform: rotate(0deg);
		}
		30% {
			opacity: 1;
			transform: rotate(18deg);
		}
		60% {
			transform: rotate(-10deg);
		}
		100% {
			opacity: 1;
			transform: rotate(0deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.wave {
			animation: none;
			opacity: 1;
		}
	}
</style>
