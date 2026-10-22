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

	When static/models/g502-lightspeed.glb exists it replaces the procedural
	shell: "Logitech G502 x lightspeed" by Okopchi on Sketchfab, CC BY 4.0
	(https://sketchfab.com/3d-models/logitech-g502-x-lightspeed-cda7107cc1444b4788d747f0361f7d40).
	The credit line shows whenever that mesh is on screen.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { Shoot } from '$lib/gear-shots';

	/** Set by the still-capture page: receives a function that renders one frame at a given turn. */
	let { label, onshoot }: { label: string; onshoot?: (shoot: Shoot) => void } = $props();

	let host: HTMLDivElement | undefined = $state();
	let canvasEl: HTMLCanvasElement | undefined = $state();
	let ready = $state(false);
	let scanned = $state(false);

	const GLB_URL = '/models/g502-lightspeed.glb';

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
			// Front: two pointed buttons with the wheel notch between; left: the G8/G7
			// corner, then the thumb-rest bulge; rear: a round palm.
			const OUTLINE: [number, number][] = [
				[0.14, 0.07], [0.2, 0.04], [0.32, 0.02], [0.45, 0.012], [0.555, 0.03], [0.595, 0.1],
				[0.635, 0.012], [0.73, 0.004], [0.82, 0.025], [0.9, 0.075], [0.955, 0.18], [0.985, 0.33],
				[1.0, 0.5], [0.995, 0.64], [0.97, 0.76], [0.91, 0.865], [0.82, 0.94], [0.7, 0.985],
				[0.56, 1.0], [0.42, 0.99], [0.28, 0.955], [0.15, 0.895], [0.055, 0.815], [0.005, 0.7],
				[-0.01, 0.58], [0.005, 0.47], [0.04, 0.39], [0.04, 0.3], [0.035, 0.24], [0.07, 0.14]
			];
			const outlinePts = OUTLINE.map(([u, v]) => new THREE.Vector2(toX(u), toZ(v)));
			const outlineCurve = new THREE.SplineCurve([...outlinePts, outlinePts[0]]);
			const CENTER = new THREE.Vector2(toX(0.55), toZ(0.55));

			/** Height at a top-view point, from the side shot: ~13 mm at the button tips, ~40 mm on the palm hump, a steeper fall at the rear. */
			function crown(x: number, z: number) {
				const u = x / W + 0.5;
				const v = z / L + 0.5;
				const spread = v < 0.62 ? 0.36 : 0.27;
				const along = 1.25 + 2.75 * Math.exp(-(((v - 0.62) / spread) ** 2));
				const across = 1 - 0.2 * ((u - 0.56) / 0.5) ** 2;
				return along * across;
			}

			// ── shell: an undercut side wall topped by a radial-loft dome ──
			const RINGS = 40;
			const SEGS = 200;
			const WALL_K = 10;
			const edges = Array.from({ length: SEGS + 1 }, (_, s) => outlineCurve.getPoint((s % SEGS) / SEGS));
			// The wall rises to ~45% of the crown, then the dome rounds over to the top.
			const wallTop = edges.map((e) => crown(e.x, e.y) * 0.45);
			// How far the wall tucks in at the floor: deep under the palm and thumb rest, shallow at the button tips.
			const undercut = edges.map((e) => 0.12 + 0.38 * Math.min(1, Math.max(0, (e.y / L + 0.5 - 0.25) / 0.4)));

			const pos: number[] = [];
			const uvs: number[] = [];
			const idx: number[] = [];
			for (let r = 0; r <= RINGS; r++) {
				const t = r / RINGS;
				for (let s = 0; s <= SEGS; s++) {
					const e = edges[s];
					const x = CENTER.x + (e.x - CENTER.x) * t;
					const z = CENTER.y + (e.y - CENTER.y) * t;
					const c = crown(x, z);
					const y = wallTop[s] + (c - wallTop[s]) * Math.sqrt(Math.max(0, 1 - t ** 5));
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

			// Side wall: from the dome's rim down to a tucked-in floor line; uv = (around, up).
			const wallPos: number[] = [];
			const wallUv: number[] = [];
			const wallIdx: number[] = [];
			const floor: InstanceType<typeof THREE.Vector2>[] = [];
			for (let k = 0; k <= WALL_K; k++) {
				const h = k / WALL_K;
				for (let s = 0; s <= SEGS; s++) {
					const e = edges[s];
					const dir = new THREE.Vector2(e.x - CENTER.x, e.y - CENTER.y).normalize();
					const tuck = undercut[s] * (1 - h) ** 2;
					const x = e.x - dir.x * tuck;
					const z = e.y - dir.y * tuck;
					wallPos.push(x, wallTop[s] * h, z);
					wallUv.push(s / SEGS, h);
					if (k === 0 && s < SEGS) floor.push(new THREE.Vector2(x, z));
				}
			}
			for (let k = 0; k < WALL_K; k++) {
				for (let s = 0; s < SEGS; s++) {
					const a = k * (SEGS + 1) + s;
					const b = a + SEGS + 1;
					wallIdx.push(a, b, a + 1, a + 1, b, b + 1);
				}
			}
			const wallGeo = new THREE.BufferGeometry();
			wallGeo.setAttribute('position', new THREE.Float32BufferAttribute(wallPos, 3));
			wallGeo.setAttribute('uv', new THREE.Float32BufferAttribute(wallUv, 2));
			wallGeo.setIndex(wallIdx);
			wallGeo.computeVertexNormals();

			// ── paint: top colour + glow maps, side-wall grip ──
			const TW = 750;
			const TH = 1320;
			const px = (u: number) => u * TW;
			const py = (v: number) => v * TH;
			function canvas2d(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
				const c = document.createElement('canvas');
				c.width = w;
				c.height = h;
				draw(c.getContext('2d')!);
				const t = new THREE.CanvasTexture(c);
				t.colorSpace = THREE.SRGBColorSpace;
				t.anisotropy = renderer.capabilities.getMaxAnisotropy();
				return t;
			}
			const line = (ctx: CanvasRenderingContext2D, pts: [number, number][], width: number, color: string) => {
				ctx.strokeStyle = color;
				ctx.lineWidth = width;
				ctx.lineJoin = 'round';
				ctx.lineCap = 'round';
				ctx.beginPath();
				pts.forEach(([u, v], i) => (i ? ctx.lineTo(px(u), py(v)) : ctx.moveTo(px(u), py(v))));
				ctx.stroke();
			};
			// A dark groove with a thin lit lip, for every seam between parts.
			const groove = (ctx: CanvasRenderingContext2D, pts: [number, number][]) => {
				line(ctx, pts, 13, '#030304');
				line(ctx, pts.map(([u, v]) => [u, v + 0.006] as [number, number]), 3, '#55555d');
			};
			// Where the two main buttons end and the palm shell begins.
			const SPLIT_PALM: [number, number][] = [[0.0, 0.6], [0.2, 0.575], [0.46, 0.56], [0.64, 0.52], [1.0, 0.49]];
			const colorTex = canvas2d(TW, TH, (ctx) => {
				ctx.fillStyle = '#161619';
				ctx.fillRect(0, 0, TW, TH);
				// The palm shell is a touch lighter than the matte buttons.
				ctx.fillStyle = '#1b1b1f';
				ctx.beginPath();
				SPLIT_PALM.forEach(([u, v], i) => (i ? ctx.lineTo(px(u), py(v)) : ctx.moveTo(px(u), py(v))));
				ctx.lineTo(TW, TH);
				ctx.lineTo(0, TH);
				ctx.fill();
				// Glossy strip down the left of the left button, where the DPI LEDs sit.
				ctx.fillStyle = '#202026';
				ctx.beginPath();
				ctx.moveTo(px(0.04), py(0.33));
				ctx.lineTo(px(0.19), py(0.31));
				ctx.lineTo(px(0.2), py(0.58));
				ctx.lineTo(px(0.02), py(0.6));
				ctx.fill();
				// Wheel channel and the two buttons beneath the wheel.
				ctx.fillStyle = '#09090a';
				ctx.beginPath();
				ctx.roundRect(px(0.465), py(0.05), px(0.175), py(0.5), 16);
				ctx.fill();
				ctx.fillStyle = '#1f1f23';
				for (const v of [0.365, 0.44]) {
					ctx.beginPath();
					ctx.roundRect(px(0.49), py(v), px(0.125), py(0.062), 10);
					ctx.fill();
				}
				ctx.strokeStyle = ctx.fillStyle = '#85858c';
				ctx.lineWidth = 4;
				ctx.beginPath();
				ctx.arc(px(0.5525), py(0.396), 11, 0, Math.PI * 2);
				ctx.stroke();
				ctx.font = '600 20px "Segoe UI", sans-serif';
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText('DPI', px(0.5525), py(0.471));
				// Button splits and the rear palm seam.
				groove(ctx, [[0.465, 0.03], [0.465, 0.56]]);
				groove(ctx, [[0.64, 0.0], [0.64, 0.52]]);
				groove(ctx, [[0.13, 0.08], [0.19, 0.31], [0.2, 0.575]]);
				groove(ctx, SPLIT_PALM);
				groove(ctx, [[0.12, 0.88], [0.3, 0.86], [0.5, 0.865], [0.66, 0.83], [0.82, 0.76]]);
				// G8 / G7: angled buttons on the left corner.
				for (const [v, name] of [[0.185, 'G8'], [0.245, 'G7']] as const) {
					ctx.fillStyle = '#1f1f24';
					ctx.beginPath();
					ctx.moveTo(px(0.06), py(v + 0.008));
					ctx.lineTo(px(0.17), py(v));
					ctx.lineTo(px(0.18), py(v + 0.052));
					ctx.lineTo(px(0.05), py(v + 0.058));
					ctx.fill();
					ctx.fillStyle = '#6a6a72';
					ctx.font = '600 18px "Segoe UI", sans-serif';
					ctx.fillText(name, px(0.115), py(v + 0.03));
				}
				// Tilt arrows either side of the wheel.
				ctx.fillStyle = '#56565c';
				for (const [u, dir] of [[0.39, -1], [0.71, 1]] as const) {
					ctx.beginPath();
					ctx.moveTo(px(u), py(0.25) - 9);
					ctx.lineTo(px(u) + dir * 11, py(0.25));
					ctx.lineTo(px(u), py(0.25) + 9);
					ctx.fill();
				}
			});
			const glowTex = canvas2d(TW, TH, (ctx) => {
				ctx.fillStyle = '#000';
				ctx.fillRect(0, 0, TW, TH);
				ctx.strokeStyle = ctx.fillStyle = '#29b6f6';
				// Three DPI LEDs: short slanted bars on the glossy strip.
				ctx.lineWidth = 8;
				ctx.lineCap = 'round';
				for (let i = 0; i < 3; i++) {
					const v = 0.48 + i * 0.037;
					ctx.beginPath();
					ctx.moveTo(px(0.105), py(v));
					ctx.lineTo(px(0.14), py(v - 0.02));
					ctx.stroke();
				}
				// Logitech G on the palm: heavy ring open at the upper right, bar to centre.
				const cx = px(0.36);
				const cy = py(0.69);
				const r = px(0.068);
				ctx.lineWidth = r * 0.48;
				ctx.lineCap = 'butt';
				ctx.beginPath();
				ctx.arc(cx, cy, r, 0, Math.PI * 1.68, false);
				ctx.stroke();
				ctx.fillRect(cx, cy - r * 0.24, r * 1.24, r * 0.48);
			});
			// Side wall: matte, with the dotted grip panels on the thumb side and the ring-finger side.
			const wallTex = canvas2d(2048, 128, (ctx) => {
				ctx.fillStyle = '#121214';
				ctx.fillRect(0, 0, 2048, 128);
				ctx.fillStyle = '#28282d';
				edges.forEach((e, s) => {
					if (s % 2) return;
					const u = e.x / W + 0.5;
					const v = e.y / L + 0.5;
					const thumb = u < 0.3 && v > 0.42 && v < 0.9;
					const ring = u > 0.7 && v > 0.3 && v < 0.85;
					if (!thumb && !ring) return;
					const x = (s / SEGS) * 2048;
					for (let row = 0; row < 7; row++) {
						ctx.beginPath();
						ctx.arc(x, 28 + row * 13 + (s % 4 ? 6 : 0), 3.2, 0, Math.PI * 2);
						ctx.fill();
					}
				});
			});

			const shellMat = new THREE.MeshPhysicalMaterial({
				map: colorTex,
				emissiveMap: glowTex,
				emissive: '#ffffff',
				emissiveIntensity: 1.6,
				roughness: 0.55,
				metalness: 0.05,
				clearcoat: 0.15,
				clearcoatRoughness: 0.5,
				side: THREE.DoubleSide
			});
			const mouse = new THREE.Group();
			scene.add(mouse);
			mouse.add(new THREE.Mesh(shellGeo, shellMat));
			mouse.add(
				new THREE.Mesh(
					wallGeo,
					new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.75, side: THREE.DoubleSide })
				)
			);
			// Flat base under the tucked-in floor line.
			const base = new THREE.Mesh(
				new THREE.ShapeGeometry(new THREE.Shape(floor), 1),
				new THREE.MeshStandardMaterial({ color: '#0e0e10', roughness: 0.9, side: THREE.DoubleSide })
			);
			base.rotation.x = Math.PI / 2;
			base.position.y = 0.001;
			mouse.add(base);

			// ── scroll wheel: metal rims, knurled rubber tread ──
			const treadTex = canvas2d(256, 16, (ctx) => {
				ctx.fillStyle = '#2a2a2e';
				ctx.fillRect(0, 0, 256, 16);
				ctx.fillStyle = '#0d0d0f';
				for (let x = 0; x < 256; x += 8) ctx.fillRect(x, 0, 4, 16);
			});
			const wheelX = toX(0.5525);
			const wheelZ = toZ(0.245);
			const WHEEL_R = 0.95;
			const wheelY = crown(wheelX, wheelZ) - WHEEL_R + 0.42;
			const tread = new THREE.Mesh(
				new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.7, 56, 1, true),
				new THREE.MeshStandardMaterial({ map: treadTex, roughness: 0.7, side: THREE.DoubleSide })
			);
			tread.rotation.z = Math.PI / 2;
			tread.position.set(wheelX, wheelY, wheelZ);
			mouse.add(tread);
			const metal = new THREE.MeshStandardMaterial({ color: '#8d8f96', metalness: 1, roughness: 0.28 });
			for (const side of [-1, 1]) {
				const rimDisc = new THREE.Mesh(
					new THREE.CylinderGeometry(WHEEL_R - 0.03, WHEEL_R - 0.03, 0.08, 56),
					metal
				);
				rimDisc.rotation.z = Math.PI / 2;
				rimDisc.position.set(wheelX + side * 0.38, wheelY, wheelZ);
				mouse.add(rimDisc);
			}

			// ── thumb buttons (G4, G5) along the top of the left wall, sniper button below ──
			const sideMat = new THREE.MeshPhysicalMaterial({ color: '#1c1c20', roughness: 0.3, clearcoat: 0.6 });
			/** The left-wall outline point nearest depth v. */
			const leftEdge = (v: number) =>
				edges
					.filter((e) => e.x < CENTER.x)
					.reduce((best, e) => (Math.abs(e.y - toZ(v)) < Math.abs(best.y - toZ(v)) ? e : best));
			for (const v of [0.36, 0.45]) {
				const e = leftEdge(v);
				const b = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.38, 1.0), sideMat);
				b.position.set(e.x - 0.04, crown(e.x, e.y) * 0.45 - 0.22, e.y);
				b.rotation.y = 0.08;
				mouse.add(b);
			}
			const e6 = leftEdge(0.31);
			const sniper = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.55, 0.8), sideMat);
			sniper.position.set(e6.x - 0.02, 0.62, e6.y);
			sniper.rotation.set(0, 0.2, -0.2);
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
			controls.autoRotate = !reduced && !lite() && !onshoot;
			controls.autoRotateSpeed = 1.4;
			controls.target.set(0, 2.7, 0);

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

			// Still-capture mode for the /setup card images: hold still, render on demand.
			if (onshoot) {
				const rest = mouse.rotation.y;
				onshoot((yaw) => {
					mouse.rotation.y = rest + yaw;
					renderer.render(scene, camera);
					return canvasEl!.toDataURL('image/png');
				});
			}

			// Swap in the Sketchfab mesh if it's been dropped into static/models;
			// without it the procedural mouse stays.
			import('three/examples/jsm/loaders/GLTFLoader.js')
				.then(({ GLTFLoader }) => new GLTFLoader().loadAsync(GLB_URL))
				.then((gltf) => {
					if (destroyed) return;
					const model = gltf.scene;
					// Scale to the real 132 mm length, centre it and stand it on y = 0.
					const box = new THREE.Box3().setFromObject(model);
					const size = box.getSize(new THREE.Vector3());
					model.scale.setScalar(L / Math.max(size.x, size.z));
					box.setFromObject(model);
					const c = box.getCenter(new THREE.Vector3());
					model.position.set(-c.x, -box.min.y, -c.z);
					for (const o of [...mouse.children]) {
						mouse.remove(o);
						if (o instanceof THREE.Mesh) {
							o.geometry.dispose();
							(o.material as InstanceType<typeof THREE.Material>).dispose();
						}
					}
					mouse.add(model);
					scanned = true;
					kick();
				})
				.catch(() => {});

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
				for (const t of [colorTex, glowTex, wallTex, treadTex, envTex]) t.dispose();
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
	{#if scanned}
		<a
			href="https://sketchfab.com/3d-models/logitech-g502-x-lightspeed-cda7107cc1444b4788d747f0361f7d40"
			target="_blank"
			rel="noopener noreferrer"
			class="absolute right-3 bottom-2 font-mono-hack text-[0.6rem] tracking-wider text-ink-muted/60 transition hover:text-ink-muted"
		>
			模型：Okopchi · CC BY 4.0
		</a>
	{/if}
	{#if ready}
		<p
			class="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 font-mono-hack text-[0.65rem] tracking-widest text-ink-muted/70"
		>
			拖曳旋轉
		</p>
	{/if}
</div>
