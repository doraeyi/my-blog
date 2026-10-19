<!--
	Sitewide depth layer: a few slow-drifting blurred orbs (compositor-only,
	transform/opacity — cheap even on long content pages) plus a faint CRT
	scanline texture in dark mode, echoing the "phosphor" terminal accents
	used elsewhere. Frozen under prefers-reduced-motion.
-->
<div aria-hidden="true" class="ambient">
	<span class="orb orb-a"></span>
	<span class="orb orb-b"></span>
	<span class="orb orb-c"></span>
	<span class="scanlines"></span>
</div>

<style>
	.ambient {
		position: fixed;
		inset: 0;
		z-index: -10;
		overflow: hidden;
		pointer-events: none;
	}

	.orb {
		position: absolute;
		border-radius: 9999px;
		filter: blur(70px);
		opacity: 0.35;
		will-change: transform;
	}

	.orb-a {
		top: -10%;
		left: -8%;
		width: 26rem;
		height: 26rem;
		background: var(--color-stamp-300);
		animation: drift-a 50s ease-in-out infinite;
	}

	.orb-b {
		right: -12%;
		bottom: -15%;
		width: 30rem;
		height: 30rem;
		background: var(--color-case-300);
		animation: drift-b 60s ease-in-out infinite;
	}

	.orb-c {
		top: 40%;
		right: 20%;
		width: 18rem;
		height: 18rem;
		background: var(--color-accent);
		opacity: 0.12;
		animation: drift-c 45s ease-in-out infinite;
	}

	:global([data-theme='dark']) .orb {
		opacity: 0.16;
	}

	:global([data-theme='dark']) .orb-c {
		opacity: 0.1;
	}

	.scanlines {
		position: absolute;
		inset: 0;
		opacity: 0;
		background-image: repeating-linear-gradient(
			to bottom,
			rgb(255 255 255 / 3%) 0,
			rgb(255 255 255 / 3%) 1px,
			transparent 1px,
			transparent 3px
		);
	}

	:global([data-theme='dark']) .scanlines {
		opacity: 1;
	}

	@keyframes drift-a {
		0%,
		100% {
			transform: translate(0, 0);
		}
		50% {
			transform: translate(4%, 6%);
		}
	}

	@keyframes drift-b {
		0%,
		100% {
			transform: translate(0, 0);
		}
		50% {
			transform: translate(-5%, -4%);
		}
	}

	@keyframes drift-c {
		0%,
		100% {
			transform: translate(0, 0);
		}
		50% {
			transform: translate(-6%, 5%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.orb {
			animation: none;
		}
	}
</style>
