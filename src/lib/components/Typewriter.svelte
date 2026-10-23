<script lang="ts">
	let {
		text,
		speed = 70,
		startDelay = 300
	}: { text: string; speed?: number; startDelay?: number } = $props();

	let visibleChars = $state(0);

	$effect(() => {
		visibleChars = 0;

		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			visibleChars = text.length;
			return;
		}

		let interval: ReturnType<typeof setInterval> | undefined;
		const startTimeout = setTimeout(() => {
			interval = setInterval(() => {
				visibleChars += 1;
				if (visibleChars >= text.length && interval) clearInterval(interval);
			}, speed);
		}, startDelay);

		return () => {
			clearTimeout(startTimeout);
			if (interval) clearInterval(interval);
		};
	});
</script>

<span>
	<span class="sr-only">{text}</span>
	<span aria-hidden="true">{text.slice(0, visibleChars)}</span>
	<span
		class="ml-0.5 inline-block h-[0.9em] w-[2px] translate-y-[0.1em] animate-pulse bg-current align-middle"
		aria-hidden="true"
	></span>
</span>
