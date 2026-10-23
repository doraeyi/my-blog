/**
 * Runs `fn` once the page has finished loading and the main thread is idle,
 * so decorative work (WebGL scenes, particles) never competes with first
 * paint or the first interaction. Returns a cancel function.
 */
export function whenIdle(fn: () => void, timeout = 2500): () => void {
	let cancelled = false;
	let idleId: number | undefined;
	let timer: ReturnType<typeof setTimeout> | undefined;

	const schedule = () => {
		if (cancelled) return;
		if ('requestIdleCallback' in window) {
			idleId = window.requestIdleCallback(() => !cancelled && fn(), { timeout });
		} else {
			timer = setTimeout(() => !cancelled && fn(), 300);
		}
	};

	if (document.readyState === 'complete') schedule();
	else window.addEventListener('load', schedule, { once: true });

	return () => {
		cancelled = true;
		window.removeEventListener('load', schedule);
		if (idleId !== undefined) window.cancelIdleCallback(idleId);
		if (timer) clearTimeout(timer);
	};
}

/** Phones and touch-first devices: where heavy decoration is opt-in, not automatic. */
export function isHandheld() {
	return window.matchMedia('(max-width: 767px), (pointer: coarse)').matches;
}
