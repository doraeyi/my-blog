import type { Action } from 'svelte/action';

/**
 * An article's text comes up block by block as you read down to it, like ink
 * coming through: paragraphs rise in, a heading's rule draws across, a photo
 * develops, an evidence bag slides onto the page. Blocks that arrive together
 * follow one another. Pass the rendered HTML (or anything that changes with
 * it) so a new article starts over. Styles: `.ink-wait` / `.ink-in` in layout.css.
 */
export const inkReveal: Action<HTMLElement, unknown> = (node) => {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return {};

	let io: IntersectionObserver | undefined;
	function start() {
		io?.disconnect();
		const blocks = [...node.children] as HTMLElement[];
		const below = blocks.filter((b) => b.getBoundingClientRect().top > innerHeight * 0.9);
		for (const b of below) b.classList.add('ink-wait');
		io = new IntersectionObserver(
			(entries) => {
				let n = 0;
				for (const e of entries) {
					if (!e.isIntersecting) continue;
					const b = e.target as HTMLElement;
					io?.unobserve(b);
					b.style.setProperty('--ink-delay', `${n++ * 90}ms`);
					b.classList.replace('ink-wait', 'ink-in');
				}
			},
			{ rootMargin: '0px 0px -12% 0px' }
		);
		for (const b of below) io.observe(b);
	}
	start();

	return {
		update: () => requestAnimationFrame(start),
		destroy: () => io?.disconnect()
	};
};
