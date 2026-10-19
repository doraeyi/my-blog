import type { Action } from 'svelte/action';

interface RevealOptions {
	/** ms to wait before starting, used to stagger lists */
	delay?: number;
	/** px to rise from */
	y?: number;
}

/**
 * Fades + rises an element into place the first time it enters the viewport.
 * No-ops (element stays fully visible) when the user prefers reduced motion.
 */
export const reveal: Action<HTMLElement, RevealOptions | undefined> = (node, options = {}) => {
	const { delay = 0, y = 16 } = options;

	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		return {};
	}

	node.style.opacity = '0';
	node.style.transform = `translateY(${y}px)`;
	node.style.transition = `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`;

	// Once the reveal finishes, drop the inline styles entirely so they stop
	// overriding later CSS (e.g. the .case-card hover lift) — inline styles
	// beat stylesheet rules regardless of specificity.
	function clearInlineStyles() {
		node.style.removeProperty('opacity');
		node.style.removeProperty('transform');
		node.style.removeProperty('transition');
	}

	const observer = new IntersectionObserver(
		([entry]) => {
			if (!entry.isIntersecting) return;
			node.style.opacity = '1';
			node.style.transform = 'translateY(0)';
			node.addEventListener('transitionend', clearInlineStyles, { once: true });
			observer.unobserve(node);
		},
		{ threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
	);

	observer.observe(node);

	return {
		destroy() {
			observer.disconnect();
		}
	};
};
