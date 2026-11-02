<!--
	Where something should be pinned but nothing is yet: the outline of the
	missing card, the pin still in the board with a loose end of string hanging
	from it, and a slip saying what's due here. Used for empty lists.
-->
<script lang="ts">
	import { reveal } from '$lib/actions/reveal';

	let { title, note = '', tag = '待補' }: { title: string; note?: string; tag?: string } = $props();
</script>

<div class="empty" use:reveal>
	<span class="pin" aria-hidden="true"></span>
	<svg class="loose" viewBox="0 0 40 70" aria-hidden="true">
		<path d="M20 2 C 16 22, 28 34, 20 50 S 12 64, 17 68" />
	</svg>
	<p class="tag font-mono-hack">證物 · {tag}</p>
	<p class="title font-display">{title}</p>
	{#if note}<p class="note">{note}</p>{/if}
</div>

<style>
	.empty {
		position: relative;
		max-width: 26rem;
		margin: 1.5rem auto 0;
		padding: 3.4rem 1.75rem 2.4rem;
		border: 2px dashed color-mix(in srgb, var(--color-ink-muted) 45%, transparent);
		border-radius: 4px;
		background: color-mix(in srgb, var(--color-ink-muted) 5%, transparent);
		text-align: center;
		rotate: -0.6deg;
	}
	.pin {
		position: absolute;
		top: -8px;
		left: 50%;
		width: 16px;
		height: 16px;
		margin-left: -8px;
		border-radius: 50%;
		background: radial-gradient(circle at 35% 30%, #ff8b80, var(--b-red, #b3261e) 45%, #6d0b0b);
		box-shadow: 0 3px 4px rgb(0 0 0 / 0.35);
	}
	/* The end of string that used to lead to whatever was here. */
	.loose {
		position: absolute;
		top: 2px;
		left: 50%;
		width: 20px;
		height: 35px;
		margin-left: -10px;
		overflow: visible;
		transform-origin: 50% 0;
		animation: sway 4.5s ease-in-out infinite alternate;
	}
	.loose path {
		fill: none;
		stroke: var(--b-red, #b3261e);
		stroke-width: 2;
		stroke-linecap: round;
		opacity: 0.85;
	}
	@keyframes sway {
		from {
			rotate: -7deg;
		}
		to {
			rotate: 6deg;
		}
	}
	.tag {
		display: inline-block;
		padding: 0.2rem 0.6rem;
		background: #f3e6c2;
		color: #6b5336;
		font-size: 0.66rem;
		letter-spacing: 0.18em;
		rotate: 1.2deg;
	}
	.title {
		margin-top: 0.9rem;
		color: var(--color-ink);
		font-size: 1.2rem;
	}
	.note {
		margin-top: 0.4rem;
		color: var(--color-ink-muted);
		font-size: 0.875rem;
		line-height: 1.6;
	}
	@media (prefers-reduced-motion: reduce) {
		.loose {
			animation: none;
		}
	}
</style>
