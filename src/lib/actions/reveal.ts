import type { Action } from 'svelte/action';

interface RevealOptions {
	/** ms to wait before starting, used to stagger sections */
	delay?: number;
	/** px to rise from */
	y?: number;
}

const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
// The items of a list inside the section follow it in one after another.
const ITEMS = ':scope > ul > li, :scope > ol > li, :scope > .grid > *, :scope > dl > *';

/**
 * A section comes up out of the paper the first time it enters the viewport:
 * it rises, leans back to straight and comes into focus, and the items of a
 * list inside it follow one after another. A `.section-title` rule draws
 * across once it's in (`.rv-wait` in layout.css). Runs on the Web Animations
 * API with `fill: backwards`, so nothing is left behind to fight later
 * transforms (hover lifts, tilt). Nothing moves for reduced motion.
 */
export const reveal: Action<HTMLElement, RevealOptions | undefined> = (node, options = {}) => {
	const { delay = 0, y = 18 } = options;
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return {};
	// Already on screen when the page comes up: leave it be. Hiding what's been
	// painted to fade it back in only makes it flicker (and arrive later).
	if (node.getBoundingClientRect().top < innerHeight) return {};

	node.classList.add('rv-wait');
	node.dataset.rv = '';

	const io = new IntersectionObserver(
		([entry]) => {
			if (!entry.isIntersecting) return;
			io.disconnect();
			node.classList.remove('rv-wait');
			// Coming into focus is the costly part; light-effects mode just rises.
			const blur = document.documentElement.dataset.lite ? 'none' : 'blur(4px)';
			node.animate(
				[
					{ opacity: 0, transform: `translateY(${y}px) rotate(-0.4deg)`, filter: blur },
					{ opacity: 1, transform: 'none', filter: 'none' }
				],
				{ duration: 800, delay, easing: EASE, fill: 'backwards' }
			);
			// Items with their own reveal, and cards pinned to the board (`pinned`), come in by themselves.
			const items = [...node.querySelectorAll<HTMLElement>(ITEMS)].filter(
				(el) => !el.matches('[data-rv], .pin-card') && !el.querySelector('.pin-card')
			);
			items.forEach((item, i) => {
				item.animate(
					[
						{ opacity: 0, transform: 'translateY(14px) scale(0.98)' },
						{ opacity: 1, transform: 'none' }
					],
					{
						duration: 650,
						delay: delay + 120 + Math.min(i, 12) * 55,
						easing: EASE,
						fill: 'backwards'
					}
				);
			});
		},
		// Any visible pixel counts: a ratio threshold can never be met by an element
		// taller than the viewport (a long article body would stay invisible forever).
		{ threshold: 0, rootMargin: '0px 0px -40px 0px' }
	);
	io.observe(node);

	return { destroy: () => io.disconnect() };
};
