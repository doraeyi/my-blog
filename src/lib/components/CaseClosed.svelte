<!--
	The end of an article: when you read down to it, a 結案 stamp comes down
	hard on the sheet (the sheet takes the knock) with the day you closed it.
-->
<script lang="ts">
	let el: HTMLElement | undefined = $state();
	let down = $state(false);
	let today = $state('');

	$effect(() => {
		const d = new Date();
		today = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
		if (!el) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			down = true;
			return;
		}
		const io = new IntersectionObserver(
			([e]) => {
				if (!e.isIntersecting) return;
				io.disconnect();
				down = true;
				// The sheet takes the knock as the stamp lands.
				setTimeout(() => {
					const sheet = el?.closest<HTMLElement>('.case-paper');
					sheet?.animate(
						[
							{ transform: 'translateY(0)' },
							{ transform: 'translateY(3px)' },
							{ transform: 'translateY(-1px)' },
							{ transform: 'translateY(0)' }
						],
						{ duration: 260, easing: 'ease-out' }
					);
				}, 330);
			},
			{ rootMargin: '0px 0px -25% 0px' }
		);
		io.observe(el);
		return () => io.disconnect();
	});
</script>

<div bind:this={el} class="closed" class:down>
	<span class="line" aria-hidden="true"></span>
	<span class="seal" aria-hidden="true">
		<span class="seal-word">結案</span>
		<span class="seal-date font-mono-hack">{today || 'CLOSED'}</span>
	</span>
	<span class="ring" aria-hidden="true"></span>
	<p class="note">這宗案件，讀到這裡結案。</p>
</div>

<style>
	.closed {
		position: relative;
		display: grid;
		justify-items: center;
		margin-top: 4rem;
		padding-top: 2.5rem;
	}
	.line {
		position: absolute;
		top: 0;
		left: 50%;
		width: min(70%, 28rem);
		height: 1px;
		translate: -50% 0;
		background: linear-gradient(90deg, transparent, var(--color-border-case), transparent);
	}
	.seal {
		display: grid;
		justify-items: center;
		gap: 0.15rem;
		padding: 0.55rem 1.4rem 0.45rem;
		border: 3px solid var(--color-accent);
		border-radius: 6px;
		outline: 1px solid var(--color-accent);
		outline-offset: 3px;
		color: var(--color-accent-strong);
		mix-blend-mode: multiply;
		mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.7' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -2.2 1.6'/%3E%3C/filter%3E%3Crect width='160' height='80' filter='url(%23n)'/%3E%3C/svg%3E");
		rotate: -6deg;
		opacity: 0;
	}
	.seal-word {
		font-family: 'LXGW WenKai TC', var(--font-display);
		font-size: 2.2rem;
		font-weight: 700;
		letter-spacing: 0.4em;
		margin-right: -0.4em;
		line-height: 1.1;
	}
	.seal-date {
		font-size: 0.7rem;
		letter-spacing: 0.2em;
	}
	.down .seal {
		animation: slam 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.15) both;
	}
	@keyframes slam {
		0% {
			opacity: 0;
			transform: scale(2.6) rotate(6deg);
		}
		62% {
			opacity: 1;
			transform: scale(0.93);
		}
		100% {
			opacity: 0.92;
			transform: none;
		}
	}
	/* The ink spreads out where it hit. */
	.ring {
		position: absolute;
		top: calc(2.5rem + 2.4rem);
		left: 50%;
		width: 9rem;
		height: 9rem;
		margin: -4.5rem 0 0 -4.5rem;
		border-radius: 50%;
		background: radial-gradient(
			circle,
			color-mix(in srgb, var(--color-accent) 22%, transparent),
			transparent 65%
		);
		opacity: 0;
		pointer-events: none;
	}
	.down .ring {
		animation: ring 0.9s ease-out 0.3s both;
	}
	@keyframes ring {
		from {
			opacity: 1;
			transform: scale(0.4);
		}
		to {
			opacity: 0;
			transform: scale(1.4);
		}
	}
	.note {
		margin-top: 1.1rem;
		color: var(--color-ink-muted);
		font-size: 0.85rem;
		opacity: 0;
	}
	.down .note {
		animation: rise 0.6s ease-out 0.55s both;
	}
	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.down .seal,
		.down .note {
			animation: none;
			opacity: 1;
		}
		.down .ring {
			display: none;
		}
	}
</style>
