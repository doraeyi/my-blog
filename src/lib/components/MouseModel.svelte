<!--
	A procedurally built Logitech G502 LIGHTSPEED you can spin, matched against
	Logitech's top and side product shots. Real size: 132 × 75 × 40 mm.

	The shell is a radial loft: a mesh fanned from the palm centre out to the
	top-view outline, raised by a height profile taken from the side view and
	rounded off at the edge. The top details (button splits, wheel channel,
	G7/G8, DPI LEDs, the lit G mark) are painted on one canvas and projected
	straight down onto the shell, so they land where they do on the real
	mouse. The wheel and the thumb / sniper buttons are real geometry.
	1 unit = 10 mm. Renders only while on screen; light-effects mode stops the
	idle turn.
-->
<script lang="ts">
	import { onMount } from 'svelte';

	let { label }: { label: string } = $props();

	let host: HTMLDivElement | undefined = $state();
	let canvasEl: HTMLCanvasElement | undefined = $state();
	let ready = $state(false);

	onMount(() => {
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		let destroyed = false;
		let cleanup: (() => void) | undefined;

		(async () => {
			let THREE: typeof import('three');
			let OrbitControls: typeof import('three/examples/jsm/controls/OrbitControls.js').OrbitControls;
			let RoomEnvironment: typeof import('three/examples/jsm/environments/RoomEnvironment.js').RoomEnvironment;
			try {
				THREE = await import('three');
				({ OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js'));
				({ RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js'));
			} catch {
				return;
			}
			if (destroyed || !canvasEl || !host) return;

			let renderer: InstanceType<typeof THREE.WebGLRenderer>;
			try {
				renderer = new THREE.WebGLRenderer({ canvas: canvasEl, alpha: true, antialias: true });
			} catch {
				return;
			}
			const lite = () => document.documentElement.dataset.lite === '1';
			renderer.setPixelRatio(lite() ? 1 : Math.min(window.devicePixelRatio || 1, 1.75));
			renderer.outputColorSpace = THREE.SRGBColorSpace;
			renderer.toneMapping = THREE.ACESFilmicToneMapping;

			const scene = new THREE.Scene();
			const pmrem = new THREE.PMREMGenerator(renderer);
			const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
			scene.environment = envTex;
			scene.environmentIntensity = 0.75;
			pmrem.dispose();

			const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
			const key = new THREE.DirectionalLight('#ffffff', 1.3);
			key.position.set(-6, 14, -4);
			scene.add(key);
			const rim = new THREE.DirectionalLight('#9fb7ff', 0.6);
			rim.position.set(8, 5, 10);
			scene.add(rim);

			// ── size and top-view outline ──
			const W = 7.5; // width (x)
			const L = 13.2; // length (z), front is -z
			const toX = (u: number) => (u - 0.5) * W;
			const toZ = (v: number) => (v - 0.5) * L;
			// Outline traced off the official top-down shot, u: left→right, v: front→back.
			const OUTLINE: [number, number][] = [
				[0.19, 0.06], [0.26, 0.025], [0.42, 0.03], [0.47, 0.07], [0.58, 0.06], [0.62, 0.02],
				[0.78, 0.03], [0.86, 0.08], [0.9, 0.18], [0.97, 0.3], [1.0, 0.45], [0.99, 0.62],
				[0.95, 0.75], [0.9, 0.85], [0.83, 0.93], [0.72, 0.985], [0.6, 1.0], [0.5, 0.99],
				[0.42, 0.96], [0.3, 0.9], [0.12, 0.86], [0.0, 0.8], [0.02, 0.6], [0.06, 0.52],
				[0.08, 0.45], [0.06, 0.32], [0.1, 0.18], [0.15, 0.1]
			];
			const outlinePts = OUTLINE.map(([u, v]) => new THREE.Vector2(toX(u), toZ(v)));
			const outlineCurve = new THREE.SplineCurve([...outlinePts, outlinePts[0]]);
			const CENTER = new THREE.Vector2(toX(0.52), toZ(0.56));

			/** Height in units at a top-view point, from the side profile: ~14 mm at the button tips, ~40 mm on the palm hump. */
			function crown(x: number, z: number) {
				const u = x / W + 0.5;
				const v = z / L + 0.5;
				const along = 1.3 + 2.7 * Math.exp(-(((v - 0.62) / 0.36) ** 2));
				const across = 1 - 0.18 * ((u - 0.52) / 0.5) ** 2;
				return along * across;
			}

			// ── shell: radial loft ──
			const RINGS = 40;
			const SEGS = 160;
			const pos: number[] = [];
			const uvs: number[] = [];
			const idx: number[] = [];
			for (let r = 0; r <= RINGS; r++) {
				const t = r / RINGS;
				for (let s = 0; s <= SEGS; s++) {
					const edge = outlineCurve.getPoint((s % SEGS) / SEGS);
					const x = CENTER.x + (edge.x - CENTER.x) * t;
					const z = CENTER.y + (edge.y - CENTER.y) * t;
					// Rounded shoulder: holds the crown height, then falls steeply to the edge.
					const y = crown(x, z) * Math.sqrt(Math.max(0, 1 - t ** 5));
					pos.push(x, y, z);
					uvs.push(x / W + 0.5, 1 - (z / L + 0.5)); // projected straight down
				}
			}
			for (let r = 0; r < RINGS; r++) {
				for (let s = 0; s < SEGS; s++) {
					const a = r * (SEGS + 1) + s;
					const b = a + SEGS + 1;
					idx.push(a, a + 1, b, a + 1, b + 1, b);
				}
			}
			const shellGeo = new THREE.BufferGeometry();
			shellGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
			shellGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
			shellGeo.setIndex(idx);
			shellGeo.computeVertexNormals();

			// ── top-view paint: colour + glow maps ──
			const TW = 750;
			const TH = 1320;
			const px = (u: number) => u * TW;
			const py = (v: number) => v * TH;
			function canvas2d(draw: (ctx: CanvasRenderingContext2D) => void, srgb = true) {
				const c = document.createElement('canvas');
				c.width = TW;
				c.height = TH;
				draw(c.getContext('2d')!);
				const t = new THREE.CanvasTexture(c);
				if (srgb) t.colorSpace = THREE.SRGBColorSpace;
				t.anisotropy = renderer.capabilities.getMaxAnisotropy();
				return t;
			}
			const line = (ctx: CanvasRenderingContext2D, pts: [number, number][], width: number, color: string) => {
				ctx.strokeStyle = color;
				ctx.lineWidth = width;
				ctx.lineJoin = 'round';
				ctx.beginPath();
				pts.forEach(([u, v], i) => (i ? ctx.lineTo(px(u), py(v)) : ctx.moveTo(px(u), py(v))));
				ctx.stroke();
			};
			const SPLIT_PALM: [number, number][] = [[0.1, 0.585], [0.45, 0.56], [0.63, 0.5], [0.95, 0.465]];
			const colorTex = canvas2d((ctx) => {
				ctx.fillStyle = '#17171a';
				ctx.fillRect(0, 0, TW, TH);
				// Glossy palm cap vs. matte buttons: a slightly lighter, smoother rear.
				const g = ctx.createLinearGradient(0, py(0.5), 0, TH);
				g.addColorStop(0, '#1c1c20');
				g.addColorStop(1, '#141417');
				ctx.fillStyle = g;
				ctx.beginPath();
				ctx.moveTo(0, py(0.6));
				SPLIT_PALM.forEach(([u, v]) => ctx.lineTo(px(u), py(v)));
				ctx.lineTo(TW, py(0.46));
				ctx.lineTo(TW, TH);
				ctx.lineTo(0, TH);
				ctx.fill();
				// Wheel channel and the two buttons beneath the wheel.
				ctx.fillStyle = '#0a0a0b';
				ctx.beginPath();
				ctx.roundRect(px(0.445), py(0.06), px(0.155), py(0.47), 18);
				ctx.fill();
				ctx.fillStyle = '#1e1e22';
				ctx.beginPath();
				ctx.roundRect(px(0.475), py(0.345), px(0.095), py(0.06), 12);
				ctx.fill();
				ctx.beginPath();
				ctx.roundRect(px(0.475), py(0.43), px(0.095), py(0.065), 12);
				ctx.fill();
				ctx.strokeStyle = '#8a8a90';
				ctx.lineWidth = 4;
				ctx.beginPath();
				ctx.arc(px(0.5225), py(0.375), 12, 0, Math.PI * 2);
				ctx.stroke();
				ctx.fillStyle = '#8a8a90';
				ctx.font = '600 22px "Segoe UI", sans-serif';
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText('G6', px(0.5225), py(0.4625));
				// Button splits: grooves with a thin lit edge.
				for (const pts of [
					[[0.44, 0.04], [0.44, 0.56]],
					[[0.6, 0.04], [0.6, 0.5]],
					SPLIT_PALM
				] as [number, number][][]) {
					line(ctx, pts, 10, '#050506');
					line(ctx, pts.map(([u, v]) => [u, v + 0.004] as [number, number]), 2, '#3a3a40');
				}
				// G8 / G7 beside the left button.
				for (const [v, name] of [[0.2, 'G8'], [0.27, 'G7']] as const) {
					ctx.fillStyle = '#202024';
					ctx.beginPath();
					ctx.roundRect(px(0.07), py(v), px(0.1), py(0.055), 10);
					ctx.fill();
					ctx.fillStyle = '#6e6e75';
					ctx.font = '600 22px "Segoe UI", sans-serif';
					ctx.fillText(name, px(0.12), py(v + 0.028));
				}
				// Scroll-mode arrows either side of the wheel.
				ctx.fillStyle = '#5a5a60';
				for (const [u, dir] of [[0.4, -1], [0.64, 1]] as const) {
					ctx.beginPath();
					ctx.moveTo(px(u), py(0.2) - 9);
					ctx.lineTo(px(u) + dir * 11, py(0.2));
					ctx.lineTo(px(u), py(0.2) + 9);
					ctx.fill();
				}
			});
			const glowTex = canvas2d((ctx) => {
				ctx.fillStyle = '#000';
				ctx.fillRect(0, 0, TW, TH);
				ctx.strokeStyle = ctx.fillStyle = '#29b6f6';
				// Three DPI LEDs: short slanted bars down the left edge.
				ctx.lineWidth = 9;
				ctx.lineCap = 'round';
				for (let i = 0; i < 3; i++) {
					const v = 0.45 + i * 0.045;
					ctx.beginPath();
					ctx.moveTo(px(0.095), py(v));
					ctx.lineTo(px(0.125), py(v - 0.018));
					ctx.stroke();
				}
				// Logitech G on the palm: heavy ring open at the upper right, bar to centre.
				const cx = px(0.37);
				const cy = py(0.665);
				const r = px(0.07);
				ctx.lineWidth = r * 0.48;
				ctx.lineCap = 'butt';
				ctx.beginPath();
				ctx.arc(cx, cy, r, 0, Math.PI * 1.68, false);
				ctx.stroke();
				ctx.fillRect(cx, cy - r * 0.24, r * 1.24, r * 0.48);
			});

			const shellMat = new THREE.MeshPhysicalMaterial({
				map: colorTex,
				emissiveMap: glowTex,
				emissive: '#ffffff',
				emissiveIntensity: 1.6,
				roughness: 0.45,
				metalness: 0.1,
				clearcoat: 0.35,
				clearcoatRoughness: 0.4,
				side: THREE.DoubleSide
			});
			const mouse = new THREE.Group();
			scene.add(mouse);
			mouse.add(new THREE.Mesh(shellGeo, shellMat));
			// Flat base under the shell.
			const baseShape = new THREE.Shape(outlineCurve.getPoints(SEGS));
			const base = new THREE.Mesh(
				new THREE.ShapeGeometry(baseShape, 1),
				new THREE.MeshStandardMaterial({ color: '#0e0e10', roughness: 0.9 })
			);
			base.rotation.x = Math.PI / 2;
			base.position.y = 0.001;
			mouse.add(base);

			// ── scroll wheel: metal core, knurled rubber tread ──
			const treadTex = (() => {
				const c = document.createElement('canvas');
				c.width = 256;
				c.height = 16;
				const ctx = c.getContext('2d')!;
				ctx.fillStyle = '#2a2a2e';
				ctx.fillRect(0, 0, 256, 16);
				ctx.fillStyle = '#0d0d0f';
				for (let x = 0; x < 256; x += 8) ctx.fillRect(x, 0, 4, 16);
				const t = new THREE.CanvasTexture(c);
				t.colorSpace = THREE.SRGBColorSpace;
				return t;
			})();
			const wheelX = toX(0.5225);
			const wheelZ = toZ(0.2);
			const wheelY = crown(wheelX, wheelZ) - 0.15;
			const tread = new THREE.Mesh(
				new THREE.CylinderGeometry(0.62, 0.62, 0.62, 48, 1, true),
				new THREE.MeshStandardMaterial({ map: treadTex, roughness: 0.7, side: THREE.DoubleSide })
			);
			tread.rotation.z = Math.PI / 2;
			tread.position.set(wheelX, wheelY, wheelZ);
			mouse.add(tread);
			const metal = new THREE.MeshStandardMaterial({ color: '#8d8f96', metalness: 1, roughness: 0.28 });
			for (const side of [-1, 1]) {
				const rimDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.06, 48), metal);
				rimDisc.rotation.z = Math.PI / 2;
				rimDisc.position.set(wheelX + side * 0.33, wheelY, wheelZ);
				mouse.add(rimDisc);
			}

			// ── thumb buttons (G4, G5) and the sniper button on the left flank ──
			const sideMat = new THREE.MeshPhysicalMaterial({ color: '#1d1d21', roughness: 0.3, clearcoat: 0.6 });
			const sideEdgeX = toX(0.065);
			for (const [v, len] of [[0.43, 0.9], [0.5, 0.9]] as const) {
				const b = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.42, len), sideMat);
				b.position.set(sideEdgeX - 0.05, crown(sideEdgeX, toZ(v)) * 0.62, toZ(v));
				b.rotation.y = 0.12;
				mouse.add(b);
			}
			const sniper = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.85), sideMat);
			sniper.position.set(toX(0.07) - 0.08, 1.05, toZ(0.33));
			sniper.rotation.set(0, 0.15, -0.25);
			mouse.add(sniper);

			// Front three-quarter from the left: the side buttons and the lit G both show.
			mouse.rotation.y = 0.65;

			// ── controls ──
			const controls = new OrbitControls(camera, canvasEl);
			controls.enableZoom = false;
			controls.enablePan = false;
			controls.enableDamping = true;
			controls.dampingFactor = 0.08;
			controls.rotateSpeed = 0.7;
			controls.minPolarAngle = Math.PI * 0.12;
			controls.maxPolarAngle = Math.PI * 0.46;
			controls.autoRotate = !reduced && !lite();
			controls.autoRotateSpeed = 1.4;
			controls.target.set(0, 1.9, 0);

			function resize() {
				const w = host!.clientWidth;
				const h = host!.clientHeight;
				renderer.setSize(w, h, false);
				camera.aspect = w / h;
				const vHalf = THREE.MathUtils.degToRad(camera.fov / 2);
				const hHalf = Math.atan(Math.tan(vHalf) * camera.aspect);
				const r = L * 0.62;
				const dist = Math.max(r / Math.tan(hHalf), r / Math.tan(vHalf));
				const dir = new THREE.Vector3(0, 0.62, 0.78).normalize();
				camera.position.copy(controls.target).addScaledVector(dir, dist);
				camera.updateProjectionMatrix();
				controls.update();
				kick();
			}

			let visible = false;
			let scheduled = false;
			let rafId = 0;
			function loop() {
				scheduled = false;
				if (destroyed || !visible || document.hidden) return;
				const moving = controls.update();
				renderer.render(scene, camera);
				if (moving || controls.autoRotate) kick();
			}
			function kick() {
				if (scheduled || destroyed) return;
				scheduled = true;
				rafId = requestAnimationFrame(loop);
			}
			controls.addEventListener('change', kick);
			controls.addEventListener('start', kick);

			const io = new IntersectionObserver(([en]) => {
				visible = en.isIntersecting;
				if (visible) kick();
			});
			io.observe(host);
			const ro = new ResizeObserver(resize);
			ro.observe(host);
			const onVis = () => kick();
			document.addEventListener('visibilitychange', onVis);
			const liteObserver = new MutationObserver(() => {
				if (lite()) {
					controls.autoRotate = false;
					renderer.setPixelRatio(1);
					resize();
				}
			});
			liteObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-lite'] });

			resize();
			ready = true;

			cleanup = () => {
				cancelAnimationFrame(rafId);
				io.disconnect();
				ro.disconnect();
				liteObserver.disconnect();
				document.removeEventListener('visibilitychange', onVis);
				controls.dispose();
				scene.traverse((o) => {
					if (o instanceof THREE.Mesh) {
						o.geometry.dispose();
						(Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
					}
				});
				for (const t of [colorTex, glowTex, treadTex, envTex]) t.dispose();
				renderer.dispose();
			};
		})();

		return () => {
			destroyed = true;
			cleanup?.();
		};
	});
</script>

<div
	bind:this={host}
	class="relative h-full w-full cursor-grab touch-pan-y active:cursor-grabbing"
	role="img"
	aria-label="{label} 的 3D 模型，可拖曳旋轉"
>
	<canvas
		bind:this={canvasEl}
		class="h-full w-full transition-opacity duration-700"
		style:opacity={ready ? 1 : 0}
	></canvas>
	{#if ready}
		<p
			class="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 font-mono-hack text-[0.65rem] tracking-widest text-ink-muted/70"
		>
			拖曳旋轉
		</p>
	{/if}
</div>
