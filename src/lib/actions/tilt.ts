import type { Action } from 'svelte/action';

interface TiltOptions {
	/** Max rotation in degrees at the card's edge. */
	max?: number;
	/** px the card lifts toward the viewer while hovered. */
	lift?: number;
}

/**
 * Cards lean toward the pointer like a file picked up off the desk, with a
 * lamp-light glare (`.tilt::after` in layout.css) tracking the pointer.
 * Mouse only — touch keeps its native scroll feel. Off for reduced motion.
 */
export const tilt: Action<HTMLElement, TiltOptions | undefined> = (node, options = {}) => {
	const { max = 6, lift = 6 } = options;
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return {};

	node.classList.add('tilt');
	let frame = 0;
	let rect: DOMRect | null = null;

	function apply(e: PointerEvent) {
		if (!rect) return;
		const x = (e.clientX - rect.left) / rect.width;
		const y = (e.clientY - rect.top) / rect.height;
		node.style.transform = `perspective(900px) rotateX(${(0.5 - y) * max}deg) rotateY(${(x - 0.5) * max}deg) translateZ(${lift}px)`;
		node.style.setProperty('--gx', `${x * 100}%`);
		node.style.setProperty('--gy', `${y * 100}%`);
	}

	function enter(e: PointerEvent) {
		if (e.pointerType !== 'mouse') return;
		rect = node.getBoundingClientRect();
		node.style.transition = 'transform 0.15s ease-out';
	}
	function move(e: PointerEvent) {
		if (e.pointerType !== 'mouse') return;
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(() => apply(e));
	}
	function leave() {
		cancelAnimationFrame(frame);
		rect = null;
		node.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
		node.style.transform = '';
	}

	node.addEventListener('pointerenter', enter);
	node.addEventListener('pointermove', move);
	node.addEventListener('pointerleave', leave);

	return {
		destroy() {
			cancelAnimationFrame(frame);
			node.removeEventListener('pointerenter', enter);
			node.removeEventListener('pointermove', move);
			node.removeEventListener('pointerleave', leave);
		}
	};
};
