<!--
	Sitewide WebGL depth layer: crisp motes of dust hanging in lamp light,
	at three depths, drifting up slowly and parallaxing with the pointer and
	scroll. Mounted once from the root layout so it persists across navigation.

	It used to also carry drifting papers under a fixed near-black fog; in the
	light theme that fog turned every paper into a grey smudge. The papers now
	live in the homepage's desk scene (<HeroDesk>), where they can be read, and
	this layer stays small, sharp, and theme-aware so it never sits on top of
	text as a stain.

	Loaded lazily and skipped for prefers-reduced-motion or on WebGL failure;
	the plain page ground is the fallback.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { isHandheld, whenIdle } from '$lib/idle';

	let canvasEl: HTMLCanvasElement | undefined = $state();
	let active = $state(false);

	onMount(() => {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		// Pure atmosphere — not worth a GPU budget on modest devices or data-saver.
		const nav = navigator as Navigator & {
			deviceMemory?: number;
			connection?: { saveData?: boolean };
		};
		if (
			(nav.hardwareConcurrency ?? 8) <= 4 ||
			(nav.deviceMemory ?? 8) <= 4 ||
			nav.connection?.saveData ||
			document.documentElement.dataset.lite === '1' ||
			// Phones: dust is not worth seconds of main-thread time on a small screen.
			isHandheld()
		)
			return;

		let destroyed = false;
		let rafId = 0;
		let disposeScene: (() => void) | undefined;

		const cancelIdle = whenIdle(async () => {
			if (!canvasEl) return;
			let THREE: typeof import('three');
			try {
				THREE = await import('three');
			} catch {
				return;
			}
			if (destroyed || !canvasEl) return;

			const isNarrow = window.matchMedia('(max-width: 767px)').matches;
			const LAYERS = [
				{ count: isNarrow ? 70 : 160, size: 2.2, depth: -14, speed: 0.06, parallax: 0.25 },
				{ count: isNarrow ? 45 : 90, size: 3.4, depth: -8, speed: 0.1, parallax: 0.55 },
				{ count: isNarrow ? 14 : 26, size: 5.5, depth: -3.5, speed: 0.16, parallax: 1 }
			];

			let renderer: InstanceType<typeof THREE.WebGLRenderer>;
			try {
				renderer = new THREE.WebGLRenderer({
					canvas: canvasEl,
					alpha: true,
					antialias: false,
					powerPreference: 'low-power'
				});
			} catch {
				return;
			}
			// Tiny soft points read the same at 1x; a full-screen canvas at 2x is pure cost.
			renderer.setPixelRatio(1);

			const scene = new THREE.Scene();
			const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 40);
			camera.position.set(0, 0, 6);

			// Round, soft-edged sprite drawn once — points would otherwise render as squares.
			const sprite = (() => {
				const c = document.createElement('canvas');
				c.width = c.height = 64;
				const ctx = c.getContext('2d')!;
				const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
				g.addColorStop(0, 'rgba(255,255,255,1)');
				g.addColorStop(0.35, 'rgba(255,255,255,0.85)');
				g.addColorStop(1, 'rgba(255,255,255,0)');
				ctx.fillStyle = g;
				ctx.fillRect(0, 0, 64, 64);
				return new THREE.CanvasTexture(c);
			})();

			const layers = LAYERS.map((cfg) => {
				const pos = new Float32Array(cfg.count * 3);
				const seed = new Float32Array(cfg.count);
				for (let i = 0; i < cfg.count; i++) {
					pos[i * 3] = (Math.random() - 0.5) * 22;
					pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
					pos[i * 3 + 2] = cfg.depth + (Math.random() - 0.5) * 2;
					seed[i] = Math.random() * Math.PI * 2;
				}
				const geom = new THREE.BufferGeometry();
				geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
				const mat = new THREE.PointsMaterial({
					size: cfg.size,
					sizeAttenuation: false,
					map: sprite,
					transparent: true,
					depthWrite: false
				});
				const points = new THREE.Points(geom, mat);
				scene.add(points);
				return { cfg, geom, mat, points, pos, seed };
			});

			// Light theme: warm ink specks on paper (normal blending — additive vanishes on
			// cream). Dark theme: glowing lamp-lit dust (additive).
			function applyTheme() {
				const dark = document.documentElement.getAttribute('data-theme') === 'dark';
				const css = getComputedStyle(document.documentElement);
				const color = dark
					? css.getPropertyValue('--color-phosphor-300').trim() || '#ffd98a'
					: css.getPropertyValue('--color-case-500').trim() || '#a3865a';
				for (const l of layers) {
					l.mat.color.set(color);
					l.mat.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
					l.mat.opacity = dark ? 0.75 : 0.45;
					l.mat.needsUpdate = true;
				}
			}
			applyTheme();
			const themeObserver = new MutationObserver(applyTheme);
			themeObserver.observe(document.documentElement, {
				attributes: true,
				attributeFilter: ['data-theme']
			});

			function resize() {
				camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();
				renderer.setSize(window.innerWidth, window.innerHeight, false);
			}
			resize();

			let px = 0;
			let py = 0;
			let tx = 0;
			let ty = 0;
			const onPointer = (e: PointerEvent) => {
				tx = (e.clientX / window.innerWidth) * 2 - 1;
				ty = (e.clientY / window.innerHeight) * 2 - 1;
			};
			let scrollY = window.scrollY;
			let scrollV = 0;
			const onScroll = () => {
				scrollV += window.scrollY - scrollY;
				scrollY = window.scrollY;
			};
			window.addEventListener('pointermove', onPointer, { passive: true });
			window.addEventListener('scroll', onScroll, { passive: true });
			window.addEventListener('resize', resize);

			const clock = new THREE.Timer();
			function render() {
				clock.update();
				const dt = Math.min(clock.getDelta(), 0.1);
				const t = clock.getElapsed();
				px += (tx - px) * 0.05;
				py += (ty - py) * 0.05;
				// Scroll velocity briefly pushes the dust, then decays — the room has air in it.
				scrollV *= 0.9;
				for (const l of layers) {
					const { pos, seed, cfg } = l;
					for (let i = 0; i < cfg.count; i++) {
						let y = pos[i * 3 + 1] + (cfg.speed - scrollV * 0.0015 * cfg.parallax) * dt * 3;
						if (y > 7) y = -7;
						if (y < -7) y = 7;
						pos[i * 3 + 1] = y;
						pos[i * 3] += Math.sin(t * 0.3 + seed[i]) * 0.0015;
					}
					l.geom.attributes.position.needsUpdate = true;
					l.points.position.x = -px * 0.35 * cfg.parallax;
					l.points.position.y = py * 0.25 * cfg.parallax;
				}
				renderer.render(scene, camera);
			}
			// Drifting dust doesn't need 60fps: draw every other frame (~30fps).
			let odd = false;
			function loop() {
				if (document.documentElement.dataset.lite === '1') {
					active = false;
					return;
				}
				odd = !odd;
				if (odd && !document.hidden) render();
				if (!destroyed) rafId = requestAnimationFrame(loop);
			}
			rafId = requestAnimationFrame(loop);
			active = true;

			disposeScene = () => {
				themeObserver.disconnect();
				window.removeEventListener('pointermove', onPointer);
				window.removeEventListener('scroll', onScroll);
				window.removeEventListener('resize', resize);
				for (const l of layers) {
					l.geom.dispose();
					l.mat.dispose();
				}
				sprite.dispose();
				renderer.dispose();
			};
		});

		return () => {
			destroyed = true;
			cancelIdle();
			cancelAnimationFrame(rafId);
			disposeScene?.();
		};
	});
</script>

<div aria-hidden="true" class="depth-layer">
	<canvas
		bind:this={canvasEl}
		class="h-full w-full transition-opacity duration-1000"
		style:opacity={active ? 1 : 0}
	></canvas>
</div>

<style>
	/* Behind all normal-flow content. */
	.depth-layer {
		position: fixed;
		inset: 0;
		z-index: -9;
		pointer-events: none;
	}
</style>
