import type { Action } from 'svelte/action';

/**
 * Pulls a button a few px toward the pointer while it hovers nearby, then
 * springs back. Mouse only; off for reduced motion.
 */
export const magnetic: Action<HTMLElement, number | undefined> = (node, strength = 0.3) => {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return {};

	let frame = 0;
	function move(e: PointerEvent) {
		if (e.pointerType !== 'mouse') return;
		const r = node.getBoundingClientRect();
		const dx = e.clientX - (r.left + r.width / 2);
		const dy = e.clientY - (r.top + r.height / 2);
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(() => {
			node.style.transition = 'transform 0.12s ease-out';
			node.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
		});
	}
	function leave() {
		cancelAnimationFrame(frame);
		node.style.transition = 'transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)';
		node.style.transform = '';
	}

	node.addEventListener('pointermove', move);
	node.addEventListener('pointerleave', leave);
	return {
		destroy() {
			cancelAnimationFrame(frame);
			node.removeEventListener('pointermove', move);
			node.removeEventListener('pointerleave', leave);
		}
	};
};
