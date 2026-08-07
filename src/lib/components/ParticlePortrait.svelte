<script lang="ts">
	import { onMount } from 'svelte';

	let {
		photoSrc,
		logoSrc
	}: {
		photoSrc: string;
		logoSrc: string;
	} = $props();

	let containerEl: HTMLDivElement | undefined = $state();
	let canvasEl: HTMLCanvasElement | undefined = $state();

	const MAX_PARTICLES = 7000;
	const SAMPLE_STEP = 2;
	const INITIAL_HOLD_MS = 2600;
	const COLLAPSE_MS = 900;
	const HOLD_MS = 180;
	const EXPAND_MS = 1100;

	type SamplePoint = { x: number; y: number; r: number; g: number; b: number };
	type Particle = {
		fx: number;
		fy: number;
		fr: number;
		fg: number;
		fb: number;
		tx: number;
		ty: number;
		tr: number;
		tg: number;
		tb: number;
	};

	function lerp(a: number, b: number, t: number) {
		return a + (b - a) * t;
	}
	function easeInCubic(t: number) {
		return t * t * t;
	}
	function easeOutCubic(t: number) {
		return 1 - Math.pow(1 - t, 3);
	}
	function boost(channel: number) {
		return Math.min(255, Math.round(channel * 1.3 + 80));
	}

	function loadImage(src: string) {
		return new Promise<HTMLImageElement>((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = src;
		});
	}

	/** Samples an image onto a w×h offscreen canvas and extracts foreground pixels as particle seeds. */
	function sampleImage(
		img: HTMLImageElement,
		w: number,
		h: number,
		fit: 'cover' | 'contain',
		mode: 'edge-distance' | 'luminance'
	): SamplePoint[] {
		const off = document.createElement('canvas');
		off.width = w;
		off.height = h;
		const octx = off.getContext('2d');
		if (!octx) return [];

		const scale =
			fit === 'cover'
				? Math.max(w / img.width, h / img.height)
				: Math.min(w / img.width, h / img.height);
		const dw = img.width * scale;
		const dh = img.height * scale;
		octx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);

		const { data } = octx.getImageData(0, 0, w, h);
		const points: SamplePoint[] = [];

		let bgR = 255;
		let bgG = 255;
		let bgB = 255;
		if (mode === 'edge-distance') {
			const corners = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + (w - 1)) * 4];
			let r = 0;
			let g = 0;
			let b = 0;
			for (const c of corners) {
				r += data[c];
				g += data[c + 1];
				b += data[c + 2];
			}
			bgR = r / corners.length;
			bgG = g / corners.length;
			bgB = b / corners.length;
		}

		for (let y = 0; y < h; y += SAMPLE_STEP) {
			for (let x = 0; x < w; x += SAMPLE_STEP) {
				const i = (y * w + x) * 4;
				const a = data[i + 3];
				if (a < 30) continue;

				const r = data[i];
				const g = data[i + 1];
				const b = data[i + 2];

				const keep =
					mode === 'luminance'
						? 0.2126 * r + 0.7152 * g + 0.0722 * b > 40
						: Math.hypot(r - bgR, g - bgG, b - bgB) > 28;

				if (!keep) continue;

				// Photo pixels (dark hair/jacket especially) get lifted so they stay
				// visible against the panel's near-black backdrop instead of vanishing into it.
				if (mode === 'edge-distance') {
					points.push({ x, y, r: boost(r), g: boost(g), b: boost(b) });
				} else {
					points.push({ x, y, r, g, b });
				}
			}
		}

		return points;
	}

	function pickN(points: SamplePoint[], n: number): SamplePoint[] {
		const out: SamplePoint[] = [];
		for (let i = 0; i < n; i++) {
			out.push(points[Math.floor(Math.random() * points.length)]);
		}
		return out;
	}

	onMount(() => {
		let rafId = 0;
		let holdTimeoutId = 0;
		let destroyed = false;
		let io: IntersectionObserver | undefined;

		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		(async () => {
			if (!containerEl || !canvasEl) return;

			const rect = containerEl.getBoundingClientRect();
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			const w = Math.max(1, Math.round(rect.width * dpr));
			const h = Math.max(1, Math.round(rect.height * dpr));

			canvasEl.width = w;
			canvasEl.height = h;
			canvasEl.style.width = `${rect.width}px`;
			canvasEl.style.height = `${rect.height}px`;

			const [photoImg, logoImg] = await Promise.all([loadImage(photoSrc), loadImage(logoSrc)]);
			if (destroyed) return;

			const photoPts = sampleImage(photoImg, w, h, 'cover', 'edge-distance');
			const logoPts = sampleImage(logoImg, w, h, 'contain', 'luminance');
			if (photoPts.length === 0 || logoPts.length === 0) return;

			const count = Math.min(MAX_PARTICLES, Math.max(photoPts.length, logoPts.length));
			const from = pickN(logoPts, count);
			const to = pickN(photoPts, count);

			const particles: Particle[] = from.map((p, i) => ({
				fx: p.x,
				fy: p.y,
				fr: p.r,
				fg: p.g,
				fb: p.b,
				tx: to[i].x,
				ty: to[i].y,
				tr: to[i].r,
				tg: to[i].g,
				tb: to[i].b
			}));

			const ctx = canvasEl.getContext('2d');
			if (!ctx) return;
			const dotSize = Math.max(2.2, (w / 220) * 2.8);

			function draw(progress: number) {
				if (!ctx) return;
				ctx.clearRect(0, 0, w, h);
				for (const p of particles) {
					let x: number, y: number, r: number, g: number, b: number;
					if (progress <= 0.5) {
						const t = easeInCubic(progress / 0.5);
						x = lerp(p.fx, w / 2, t);
						y = lerp(p.fy, h / 2, t);
						r = lerp(p.fr, 255, t);
						g = lerp(p.fg, 255, t);
						b = lerp(p.fb, 255, t);
					} else {
						const t = easeOutCubic((progress - 0.5) / 0.5);
						x = lerp(w / 2, p.tx, t);
						y = lerp(h / 2, p.ty, t);
						r = lerp(255, p.tr, t);
						g = lerp(255, p.tg, t);
						b = lerp(255, p.tb, t);
					}
					ctx.fillStyle = `rgb(${r | 0}, ${g | 0}, ${b | 0})`;
					ctx.fillRect(x, y, dotSize, dotSize);
				}
			}

			draw(0);

			function play() {
				holdTimeoutId = window.setTimeout(() => {
					const start = performance.now();
					const total = COLLAPSE_MS + HOLD_MS + EXPAND_MS;

					function tick(now: number) {
						const elapsed = now - start;
						let progress: number;
						if (elapsed <= COLLAPSE_MS) {
							progress = (elapsed / COLLAPSE_MS) * 0.5;
						} else if (elapsed <= COLLAPSE_MS + HOLD_MS) {
							progress = 0.5;
						} else if (elapsed <= total) {
							progress = 0.5 + ((elapsed - COLLAPSE_MS - HOLD_MS) / EXPAND_MS) * 0.5;
						} else {
							progress = 1;
						}
						draw(progress);
						if (elapsed < total && !destroyed) rafId = requestAnimationFrame(tick);
					}

					rafId = requestAnimationFrame(tick);
				}, INITIAL_HOLD_MS);
			}

			io = new IntersectionObserver(
				(entries) => {
					for (const entry of entries) {
						if (!entry.isIntersecting) continue;
						io?.disconnect();
						if (reduceMotion) {
							draw(1);
						} else {
							play();
						}
						break;
					}
				},
				{ threshold: 0.4 }
			);
			io.observe(containerEl);
		})();

		return () => {
			destroyed = true;
			io?.disconnect();
			window.clearTimeout(holdTimeoutId);
			cancelAnimationFrame(rafId);
		};
	});
</script>

<div bind:this={containerEl} class="h-full w-full">
	<canvas bind:this={canvasEl} class="h-full w-full"></canvas>
</div>
