import type { Action } from 'svelte/action';

interface PinnedOptions {
	/** ms after it scrolls into view before it's pinned up, to stagger a list. */
	delay?: number;
	/** The angle it hangs at once pinned, in degrees. */
	tilt?: number;
}

/**
 * A card pinned to the board. A red pin goes through its top edge; when the
 * card scrolls into view it's hung up there and swings to rest. Under the
 * mouse it leans toward the pointer, and let go it swings back on a spring.
 * Without JavaScript or with reduced motion it simply hangs there.
 * Styles: `.pin-card` / `.card-pin` in layout.css.
 */
export const pinned: Action<HTMLElement, PinnedOptions | undefined> = (node, options = {}) => {
	const { delay = 0, tilt = 0 } = options;
	const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	node.classList.add('pin-card');
	node.style.rotate = `${tilt}deg`;
	const pin = document.createElement('span');
	pin.className = 'card-pin';
	pin.setAttribute('aria-hidden', 'true');
	node.prepend(pin);

	if (still) {
		node.classList.add('is-pinned');
		return { destroy: () => pin.remove() };
	}

	node.classList.add('pin-wait');
	let timer = 0;
	const io = new IntersectionObserver(
		([entry]) => {
			if (!entry.isIntersecting) return;
			io.disconnect();
			timer = window.setTimeout(() => {
				node.classList.remove('pin-wait');
				node.classList.add('is-pinned');
			}, delay);
		},
		{ rootMargin: '0px 0px -8% 0px' }
	);
	io.observe(node);

	// The swing: an angle on a spring around the pin.
	let angle = 0;
	let speed = 0;
	let goal = 0;
	let frame = 0;
	const step = () => {
		speed = (speed + (goal - angle) * 0.07) * 0.86;
		angle += speed;
		node.style.rotate = `${(tilt + angle).toFixed(3)}deg`;
		frame =
			Math.abs(goal - angle) > 0.01 || Math.abs(speed) > 0.01 ? requestAnimationFrame(step) : 0;
	};
	const kick = () => {
		if (!frame) frame = requestAnimationFrame(step);
	};
	function move(e: PointerEvent) {
		if (e.pointerType !== 'mouse' || document.documentElement.dataset.lite === '1') return;
		const r = node.getBoundingClientRect();
		goal = ((e.clientX - r.left) / r.width - 0.5) * 3.2;
		kick();
	}
	function leave() {
		goal = 0;
		speed -= angle * 0.25;
		kick();
	}
	node.addEventListener('pointermove', move);
	node.addEventListener('pointerleave', leave);

	return {
		destroy() {
			io.disconnect();
			clearTimeout(timer);
			cancelAnimationFrame(frame);
			node.removeEventListener('pointermove', move);
			node.removeEventListener('pointerleave', leave);
			pin.remove();
		}
	};
};
