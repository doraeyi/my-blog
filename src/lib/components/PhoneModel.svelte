<!--
	A procedurally built iPhone 15 Pro you can spin: extruded titanium frame
	with bevelled edges, frosted back glass, the raised camera plateau (three
	lenses, flash, LiDAR), side buttons, and a lit lock screen with the
	Dynamic Island. Built to Apple's published size (146.6 × 70.6 × 8.25 mm,
	1 unit = 10 mm). No model file, no brand logo.

	Drag to rotate; it idles in a slow turn while on screen. Renders only while
	visible; in light-effects mode it stops auto-turning and draws on demand.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { PhoneFinish } from '$lib/collections';

	let { finish = 'blue', label }: { finish?: PhoneFinish; label: string } = $props();

	let host: HTMLDivElement | undefined = $state();
	let canvasEl: HTMLCanvasElement | undefined = $state();
	let ready = $state(false);

	const FINISHES: Record<PhoneFinish, { frame: string; glass: string }> = {
		natural: { frame: '#8f8a81', glass: '#bdb7ad' },
		blue: { frame: '#3f4b5c', glass: '#36404d' },
		white: { frame: '#d9d7d2', glass: '#e7e5e0' },
		black: { frame: '#3a3a3c', glass: '#3f3f42' }
	};

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
			pmrem.dispose();

			const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
			camera.position.set(0, 0.6, 34);

			const key = new THREE.DirectionalLight('#ffffff', 1.4);
			key.position.set(8, 12, 10);
			scene.add(key);
			const rim = new THREE.DirectionalLight('#9fb7ff', 0.8);
			rim.position.set(-10, 4, -8);
			scene.add(rim);

			const colors = FINISHES[finish];
			const W = 7.06;
			const H = 14.66;
			const D = 0.825;
			const R = 1.05; // corner radius in plan

			function roundedRect(w: number, h: number, r: number) {
				const s = new THREE.Shape();
				const x = -w / 2;
				const y = -h / 2;
				s.moveTo(x + r, y);
				s.lineTo(x + w - r, y);
				s.quadraticCurveTo(x + w, y, x + w, y + r);
				s.lineTo(x + w, y + h - r);
				s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
				s.lineTo(x + r, y + h);
				s.quadraticCurveTo(x, y + h, x, y + h - r);
				s.lineTo(x, y + r);
				s.quadraticCurveTo(x, y, x + r, y);
				return s;
			}

			function canvasTex(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
				const c = document.createElement('canvas');
				c.width = w;
				c.height = h;
				draw(c.getContext('2d')!);
				const t = new THREE.CanvasTexture(c);
				t.colorSpace = THREE.SRGBColorSpace;
				t.anisotropy = renderer.capabilities.getMaxAnisotropy();
				return t;
			}

			const phone = new THREE.Group();
			scene.add(phone);

			// ── titanium frame: extruded outline with a rounded bevel ──
			const bevel = 0.12;
			const frameGeom = new THREE.ExtrudeGeometry(
				roundedRect(W - bevel * 2, H - bevel * 2, R - bevel),
				{
					depth: D - bevel * 2,
					bevelEnabled: true,
					bevelThickness: bevel,
					bevelSize: bevel,
					bevelSegments: 6,
					curveSegments: 24
				}
			);
			frameGeom.translate(0, 0, -(D - bevel * 2) / 2);
			const titanium = new THREE.MeshPhysicalMaterial({
				color: colors.frame,
				metalness: 0.92,
				roughness: 0.32,
				clearcoat: 0.3,
				clearcoatRoughness: 0.4
			});
			phone.add(new THREE.Mesh(frameGeom, titanium));

			// ── back: frosted glass, inset a hair from the frame ──
			const inset = 0.16;
			const backGeom = new THREE.ShapeGeometry(
				roundedRect(W - inset * 2, H - inset * 2, R - inset),
				24
			);
			const backGlass = new THREE.MeshPhysicalMaterial({
				color: colors.glass,
				metalness: 0.15,
				roughness: 0.55,
				clearcoat: 1,
				clearcoatRoughness: 0.35
			});
			const back = new THREE.Mesh(backGeom, backGlass);
			back.position.z = -D / 2 - 0.004;
			back.rotation.y = Math.PI;
			phone.add(back);

			// ── Apple logo: polished mark centred on the back glass ──
			const logoTex = canvasTex(256, 256, (ctx) => {
				ctx.fillStyle = '#fff';
				// body: two upper lobes, two lower lobes, filled between them
				for (const [x, y, r] of [
					[98, 150, 70],
					[158, 150, 70],
					[106, 192, 54],
					[150, 192, 54]
				]) {
					ctx.beginPath();
					ctx.arc(x, y, r, 0, Math.PI * 2);
					ctx.fill();
				}
				ctx.fillRect(100, 120, 56, 120);
				ctx.globalCompositeOperation = 'destination-out';
				// the dip at the top and the bite on the right
				ctx.beginPath();
				ctx.arc(128, 74, 20, 0, Math.PI * 2);
				ctx.fill();
				ctx.beginPath();
				ctx.arc(238, 150, 42, 0, Math.PI * 2);
				ctx.fill();
				// the narrow pinch at the bottom
				ctx.beginPath();
				ctx.arc(128, 262, 22, 0, Math.PI * 2);
				ctx.fill();
				ctx.globalCompositeOperation = 'source-over';
				// leaf
				ctx.save();
				ctx.translate(150, 44);
				ctx.rotate(0.7);
				ctx.beginPath();
				ctx.ellipse(0, 0, 14, 32, 0, 0, Math.PI * 2);
				ctx.fill();
				ctx.restore();
			});
			const logoMat = new THREE.MeshPhysicalMaterial({
				color: colors.frame,
				alphaMap: logoTex,
				alphaTest: 0.5,
				metalness: 1,
				roughness: 0.12,
				clearcoat: 1
			});
			const logo = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 1.75), logoMat);
			logo.position.set(0, 0.15, -D / 2 - 0.008);
			logo.rotation.y = Math.PI;
			phone.add(logo);

			// ── front: lock screen with the Dynamic Island ──
			const screenTex = canvasTex(706, 1466, (ctx) => {
				const w = 706;
				const h = 1466;
				const g = ctx.createLinearGradient(0, 0, w, h);
				g.addColorStop(0, '#0d1b2e');
				g.addColorStop(0.55, '#1f3d63');
				g.addColorStop(1, '#0a1220');
				ctx.fillStyle = g;
				ctx.fillRect(0, 0, w, h);
				const glow = ctx.createRadialGradient(w * 0.7, h * 0.75, 20, w * 0.7, h * 0.75, w * 0.9);
				glow.addColorStop(0, 'rgba(120,170,255,0.45)');
				glow.addColorStop(1, 'rgba(120,170,255,0)');
				ctx.fillStyle = glow;
				ctx.fillRect(0, 0, w, h);
				ctx.fillStyle = 'rgba(255,255,255,0.92)';
				ctx.textAlign = 'center';
				ctx.font = '500 34px -apple-system, "Segoe UI", sans-serif';
				ctx.fillText('星期一 10月20日', w / 2, 250);
				ctx.font = '600 190px -apple-system, "Segoe UI", sans-serif';
				ctx.fillText('9:41', w / 2, 430);
				// Dynamic Island
				ctx.fillStyle = '#000';
				ctx.beginPath();
				ctx.roundRect(w / 2 - 125, 36, 250, 72, 36);
				ctx.fill();
				// Home indicator
				ctx.fillStyle = 'rgba(255,255,255,0.8)';
				ctx.beginPath();
				ctx.roundRect(w / 2 - 140, h - 40, 280, 10, 5);
				ctx.fill();
			});
			const screenGeom = new THREE.ShapeGeometry(
				roundedRect(W - inset * 2, H - inset * 2, R - inset),
				24
			);
			// ShapeGeometry UVs are in shape units — remap to 0..1 for the screen texture.
			const uv = screenGeom.attributes.uv;
			for (let i = 0; i < uv.count; i++) {
				uv.setXY(
					i,
					(uv.getX(i) + (W - inset * 2) / 2) / (W - inset * 2),
					(uv.getY(i) + (H - inset * 2) / 2) / (H - inset * 2)
				);
			}
			const screenMat = new THREE.MeshPhysicalMaterial({
				map: screenTex,
				emissiveMap: screenTex,
				emissive: '#ffffff',
				emissiveIntensity: 0.55,
				roughness: 0.08,
				metalness: 0,
				clearcoat: 1,
				clearcoatRoughness: 0.02
			});
			const screen = new THREE.Mesh(screenGeom, screenMat);
			screen.position.z = D / 2 + 0.004;
			phone.add(screen);

			// ── camera plateau with three lenses, flash, LiDAR ──
			const camGroup = new THREE.Group();
			camGroup.position.set(-W / 2 + 0.35 + 1.85, H / 2 - 0.35 - 1.85, -D / 2 - 0.005);
			camGroup.rotation.y = Math.PI;
			phone.add(camGroup);
			const plateauGeom = new THREE.ExtrudeGeometry(roundedRect(3.7, 3.7, 0.95), {
				depth: 0.06,
				bevelEnabled: true,
				bevelThickness: 0.05,
				bevelSize: 0.05,
				bevelSegments: 4,
				curveSegments: 20
			});
			// The plateau is polished glass, unlike the frosted back around it.
			const plateauMat = new THREE.MeshPhysicalMaterial({
				color: colors.glass,
				metalness: 0.2,
				roughness: 0.18,
				clearcoat: 1
			});
			camGroup.add(new THREE.Mesh(plateauGeom, plateauMat));

			const ringMat = new THREE.MeshPhysicalMaterial({
				color: colors.frame,
				metalness: 0.95,
				roughness: 0.25
			});
			const lensGlass = new THREE.MeshPhysicalMaterial({
				color: '#05070c',
				metalness: 0.4,
				roughness: 0.05,
				clearcoat: 1,
				clearcoatRoughness: 0,
				iridescence: 0.6,
				iridescenceIOR: 1.6
			});
			const lensInner = new THREE.MeshStandardMaterial({
				color: '#1a2233',
				metalness: 0.6,
				roughness: 0.15
			});
			const lensSpots: [number, number][] = [
				[-0.82, 0.82],
				[-0.82, -0.82],
				[0.82, 0]
			];
			for (const [x, y] of lensSpots) {
				const lens = new THREE.Group();
				lens.position.set(x, y, 0.11);
				const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.7, 0.42, 48), ringMat);
				ring.rotation.x = Math.PI / 2;
				ring.position.z = 0.21;
				const glass = new THREE.Mesh(new THREE.CircleGeometry(0.56, 48), lensGlass);
				glass.position.z = 0.425;
				const inner = new THREE.Mesh(new THREE.CircleGeometry(0.26, 32), lensInner);
				inner.position.z = 0.428;
				lens.add(ring, glass, inner);
				camGroup.add(lens);
			}
			const flash = new THREE.Mesh(
				new THREE.CircleGeometry(0.22, 32),
				new THREE.MeshStandardMaterial({
					color: '#f3ead2',
					roughness: 0.3,
					emissive: '#5a4a20',
					emissiveIntensity: 0.3
				})
			);
			flash.position.set(0.82, 1.15, 0.115);
			const lidar = new THREE.Mesh(
				new THREE.CircleGeometry(0.2, 32),
				new THREE.MeshStandardMaterial({ color: '#0b0b0d', roughness: 0.2 })
			);
			lidar.position.set(0.82, -1.15, 0.115);
			camGroup.add(flash, lidar);

			// ── side buttons ──
			function button(y: number, len: number, side: -1 | 1) {
				const g = new THREE.CapsuleGeometry(0.11, len, 6, 12);
				const m = new THREE.Mesh(g, titanium);
				m.position.set(side * (W / 2 + 0.03), y, 0);
				return m;
			}
			phone.add(button(4.55, 0.55, -1)); // Action button
			phone.add(button(3.0, 1.0, -1)); // volume up
			phone.add(button(1.6, 1.0, -1)); // volume down
			phone.add(button(2.6, 1.6, 1)); // side button

			// Start showing the back three-quarter: the camera is the face of this phone.
			phone.rotation.set(0.08, Math.PI - 0.55, 0.04);

			// ── controls ──
			const controls = new OrbitControls(camera, canvasEl);
			controls.enableZoom = false;
			controls.enablePan = false;
			controls.enableDamping = true;
			controls.dampingFactor = 0.08;
			controls.rotateSpeed = 0.7;
			controls.minPolarAngle = Math.PI * 0.25;
			controls.maxPolarAngle = Math.PI * 0.75;
			controls.autoRotate = !reduced && !lite();
			controls.autoRotateSpeed = 1.6;

			function resize() {
				const w = host!.clientWidth;
				const h = host!.clientHeight;
				renderer.setSize(w, h, false);
				camera.aspect = w / h;
				// Fit the phone's height with a little air above and below.
				const fitH = H * 1.25;
				camera.position.setLength(fitH / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
				camera.updateProjectionMatrix();
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
			liteObserver.observe(document.documentElement, {
				attributes: true,
				attributeFilter: ['data-lite']
			});

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
				screenTex.dispose();
				logoTex.dispose();
				envTex.dispose();
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
