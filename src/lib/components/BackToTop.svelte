<!--
	A paper tab at the bottom corner once you're a couple of screens into a
	page: back to the top in one click, and out of the way until then.
-->
<script lang="ts">
	let shown = $state(false);

	$effect(() => {
		const onScroll = () => (shown = scrollY > innerHeight * 1.8);
		onScroll();
		addEventListener('scroll', onScroll, { passive: true });
		return () => removeEventListener('scroll', onScroll);
	});

	function toTop() {
		const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
		scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' });
		// Keyboard users land at the start of the page, not left on a button that's gone.
		document.getElementById('main')?.focus({ preventScroll: true });
	}
</script>

<button
	type="button"
	class="to-top"
	class:shown
	onclick={toTop}
	aria-label="回到頁面頂端"
	tabindex={shown ? 0 : -1}
>
	<span aria-hidden="true">↑</span>回頂端
</button>

<style>
	.to-top {
		position: fixed;
		right: clamp(0.75rem, 2.5vw, 1.75rem);
		bottom: calc(clamp(0.75rem, 2.5vw, 1.75rem) + env(safe-area-inset-bottom));
		z-index: 50;
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.45rem 0.8rem;
		border: 1px solid rgb(60 40 20 / 0.18);
		border-radius: 3px;
		background: linear-gradient(175deg, #fbf0b6, #f5e49a);
		box-shadow: 0 8px 18px -10px rgb(0 0 0 / 0.5);
		color: #3d2f16;
		font-size: 0.8rem;
		opacity: 0;
		pointer-events: none;
		translate: 0 12px;
		rotate: 2deg;
		transition:
			opacity 0.25s,
			translate 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
			rotate 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.to-top.shown {
		opacity: 1;
		pointer-events: auto;
		translate: 0 0;
	}
	.to-top:hover,
	.to-top:focus-visible {
		rotate: 0deg;
		color: #8e1d12;
	}
	@media print {
		.to-top {
			display: none;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.to-top {
			transition: opacity 0.2s;
		}
	}
</style>
