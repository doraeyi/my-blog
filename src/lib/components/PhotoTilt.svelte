<!--
	A cut-out product photo that leans toward the pointer like an object turned
	in the hand: the photo floats above a floor shadow that slides the other
	way, and a lamp glare masked to the object's own silhouette tracks the
	pointer. Mouse tilts on hover; touch tilts while dragging. `idle` adds a
	slow sway when nobody is touching it. Still for reduced motion / lite mode.
-->
<script lang="ts">
	import { onMount } from 'svelte';

	let {
		src,
		alt,
		max = 14,
		idle = false,
		eager = false
	}: {
		src: string;
		alt: string;
		/** Max lean in degrees at the edge. */
		max?: number;
		/** Sway gently while untouched. */
		idle?: boolean;
		/** Load immediately (above the fold) instead of lazily. */
		eager?: boolean;
	} = $props();

	let el: HTMLDivElement | undefined = $state();
	let active = $state(false);

	onMount(() => {
		if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const node = el;
		const lite = () => document.documentElement.dataset.lite === '1';
		let x = 0;
		let y = 0;
		let tx = 0;
		let ty = 0;
		let raf = 0;
		let visible = false;
		const t0 = performance.now();

		function frame(now: number) {
			raf = 0;
			const swaying = idle && !active && visible && !lite();
			if (swaying) {
				const t = (now - t0) / 1000;
				tx = Math.sin(t * 0.55) * 0.45;
				ty = Math.sin(t * 0.4 + 1.3) * 0.25;
			}
			x += (tx - x) * 0.1;
			y += (ty - y) * 0.1;
			node.style.setProperty('--rx', `${(-y * max).toFixed(2)}deg`);
			node.style.setProperty('--ry', `${(x * max).toFixed(2)}deg`);
			node.style.setProperty('--gx', `${(50 + x * 45).toFixed(1)}%`);
			node.style.setProperty('--gy', `${(50 + y * 45).toFixed(1)}%`);
			node.style.setProperty('--sx', `${(-x * 22).toFixed(1)}px`);
			node.style.setProperty('--sy', `${(-y * 8).toFixed(1)}px`);
			if (swaying || Math.abs(tx - x) + Math.abs(ty - y) > 0.002) kick();
		}
		function kick() {
			if (!raf) raf = requestAnimationFrame(frame);
		}

		function move(e: PointerEvent) {
			if (lite() || (e.pointerType !== 'mouse' && !e.buttons)) return;
			const r = node.getBoundingClientRect();
			tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
			ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
			active = true;
			kick();
		}
		function release() {
			active = false;
			tx = 0;
			ty = 0;
			kick();
		}

		node.addEventListener('pointermove', move);
		node.addEventListener('pointerdown', move);
		node.addEventListener('pointerleave', release);
		node.addEventListener('pointerup', release);
		node.addEventListener('pointercancel', release);
		const io = new IntersectionObserver(([en]) => {
			visible = en.isIntersecting;
			if (visible) kick();
		});
		io.observe(node);

		return () => {
			cancelAnimationFrame(raf);
			io.disconnect();
			node.removeEventListener('pointermove', move);
			node.removeEventListener('pointerdown', move);
			node.removeEventListener('pointerleave', release);
			node.removeEventListener('pointerup', release);
			node.removeEventListener('pointercancel', release);
		};
	});
</script>

<div bind:this={el} class="photo-tilt" class:active>
	<div class="body">
		<span class="floor" aria-hidden="true"></span>
		<img
			{src}
			{alt}
			draggable="false"
			loading={eager ? 'eager' : 'lazy'}
			decoding="async"
			class="photo"
		/>
		<span
			class="glare"
			aria-hidden="true"
			style:mask-image="url({src})"
			style:-webkit-mask-image="url({src})"
		></span>
	</div>
</div>

<style>
	.photo-tilt {
		position: absolute;
		inset: 0;
		perspective: 1100px;
		touch-action: pan-y;
		user-select: none;
	}
	.body {
		position: absolute;
		inset: 0;
		transform-style: preserve-3d;
		transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
	}
	/* The photo and its glare sit at the same box so the mask lines up. */
	.photo,
	.glare {
		position: absolute;
		inset: 13% 11% 16%;
		width: 78%;
		height: 71%;
		object-fit: contain;
		transform: translateZ(22px);
	}
	.photo {
		filter: drop-shadow(var(--sx, 0px) calc(10px + var(--sy, 0px)) 14px rgba(0, 0, 0, 0.55));
		transition: transform 0.5s cubic-bezier(0.2, 0.7, 0.2, 1);
	}
	.active .photo {
		transform: translateZ(32px);
	}
	.glare {
		mask-size: contain;
		mask-position: center;
		mask-repeat: no-repeat;
		-webkit-mask-size: contain;
		-webkit-mask-position: center;
		-webkit-mask-repeat: no-repeat;
		background: radial-gradient(
			circle at var(--gx, 50%) var(--gy, 50%),
			rgba(255, 244, 220, 0.38),
			transparent 46%
		);
		mix-blend-mode: screen;
		opacity: 0;
		transition: opacity 0.4s ease;
		pointer-events: none;
	}
	.active .glare {
		opacity: 1;
	}
	/* Contact shadow on the plinth, sliding opposite the lean. */
	.floor {
		position: absolute;
		left: 50%;
		bottom: 8%;
		width: 62%;
		height: 9%;
		border-radius: 50%;
		background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.5), transparent 70%);
		transform: translate(calc(-50% + var(--sx, 0px)), 0);
		pointer-events: none;
	}
</style>
