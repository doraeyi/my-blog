<!--
	A procedurally built Logitech G PRO X TKL LIGHTSPEED you can spin: matte
	black case (368 × 150 mm), the full 87-key TKL layout with backlit legends,
	the top band (G mark, two round buttons, media keys, volume roller), and the
	purple cheer keycap set with the gold "KEEP PLAYING" spacebar.
	1 unit = 10 mm; 1u key pitch = 19.05 mm.

	Every keycap of a colour is merged into one mesh and every legend into one
	textured mesh, so the whole board is a handful of draw calls. Drag to
	rotate; idles in a slow turn while on screen, stops in light-effects mode.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { KeycapSet } from '$lib/collections';
	import type { BufferGeometry } from 'three';

	let { keycaps = 'purple-cheer', label }: { keycaps?: KeycapSet; label: string } = $props();

	let host: HTMLDivElement | undefined = $state();
	let canvasEl: HTMLCanvasElement | undefined = $state();
	let ready = $state(false);

	type Cap = 'black' | 'purple' | 'gold';
	/** Purple cheer caps carry artwork instead of a legend. */
	type Art = 'crown' | 'star' | 'plain';
	interface Key {
		label: string;
		w: number;
		cap: Cap;
		art?: Art;
	}

	onMount(() => {
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		let destroyed = false;
		let cleanup: (() => void) | undefined;

		(async () => {
			let THREE: typeof import('three');
			let OrbitControls: typeof import('three/examples/jsm/controls/OrbitControls.js').OrbitControls;
			let RoomEnvironment: typeof import('three/examples/jsm/environments/RoomEnvironment.js').RoomEnvironment;
			let mergeGeometries: typeof import('three/examples/jsm/utils/BufferGeometryUtils.js').mergeGeometries;
			try {
				THREE = await import('three');
				({ OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js'));
				({ RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js'));
				({ mergeGeometries } = await import('three/examples/jsm/utils/BufferGeometryUtils.js'));
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
			scene.environmentIntensity = 0.6;
			pmrem.dispose();

			const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 300);
			const key = new THREE.DirectionalLight('#ffffff', 1.2);
			key.position.set(6, 20, 14);
			scene.add(key);

			// ── dimensions ──
			const U = 1.905;
			const CASE_W = 36.8;
			const CASE_D = 15.0;
			const CASE_H = 1.5;
			const GAP = 0.2; // space between neighbouring caps
			const CAP_H = 0.85;
			const CAP_Y = CASE_H + 0.32; // caps float on their switches

			const board = new THREE.Group();
			scene.add(board);

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

			/** Extruded rounded block lying flat: w along x, d along z, rising h from y = 0. */
			function slab(w: number, d: number, h: number, r: number, bevel: number) {
				const g = new THREE.ExtrudeGeometry(
					roundedRect(w - bevel * 2, d - bevel * 2, Math.max(0.01, r - bevel)),
					{
						depth: Math.max(0.01, h - bevel * 2),
						bevelEnabled: true,
						bevelThickness: bevel,
						bevelSize: bevel,
						bevelSegments: 3,
						curveSegments: 8
					}
				);
				g.rotateX(-Math.PI / 2);
				g.translate(0, bevel, 0);
				return g;
			}

			// ── case ──
			const caseMat = new THREE.MeshStandardMaterial({
				color: '#121214',
				roughness: 0.62,
				metalness: 0.25
			});
			const caseMesh = new THREE.Mesh(slab(CASE_W, CASE_D, CASE_H, 0.7, 0.18), caseMat);
			board.add(caseMesh);

			// ── layout (null = gap) ──
			const k = (label: string, w = 1, cap: Cap = 'black'): Key => ({ label, w, cap });
			const cheer = keycaps === 'purple-cheer';
			// Swap a key for its purple cheer cap (artwork, no legend) when that set is fitted.
			const pk = (label: string, w = 1, art: Art = 'plain'): Key =>
				cheer ? { label, w, cap: 'purple', art } : k(label, w);
			const G: Cap = cheer ? 'gold' : 'black';
			const fnRow: (Key | number)[] = [
				pk('Esc'),
				1,
				k('F1'),
				k('F2'),
				k('F3'),
				k('F4'),
				0.5,
				k('F5'),
				k('F6'),
				k('F7'),
				k('F8'),
				0.5,
				k('F9'),
				k('F10'),
				k('F11'),
				k('F12'),
				0.25,
				k('PrtSc'),
				k('ScrLk'),
				k('Pause')
			];
			const rows: (Key | number)[][] = [
				[
					k('`'),
					...'1234567890-='.split('').map((c) => k(c)),
					pk('Backspace', 2, 'crown'),
					0.25,
					k('Ins'),
					k('Home'),
					k('PgUp')
				],
				[
					pk('Tab', 1.5),
					...'QWERTYUIOP[]'.split('').map((c) => k(c)),
					pk('\\', 1.5),
					0.25,
					k('Del'),
					k('End'),
					k('PgDn')
				],
				[pk('Caps', 1.75), ..."ASDFGHJKL;'".split('').map((c) => k(c)), pk('Enter', 2.25)],
				[
					pk('Shift', 2.25),
					...'ZXCVBNM,./'.split('').map((c) => k(c)),
					pk('Shift', 2.75, 'star'),
					1.25,
					k('↑')
				],
				[
					k('Ctrl', 1.25),
					k('Win', 1.25),
					k('Alt', 1.25),
					k(cheer ? 'KEEP PLAYING' : '', 6.25, G),
					k('Alt', 1.25),
					k('Fn', 1.25),
					k('Menu', 1.25),
					k('Ctrl', 1.25),
					0.25,
					k('←'),
					k('↓'),
					k('→')
				]
			];
			const LAYOUT_W = 18.25 * U;
			const x0 = -LAYOUT_W / 2;
			const zFn = -CASE_D / 2 + 1.75; // leaves the top band for the G mark and media keys

			interface Placed extends Key {
				x: number; // centre
				z: number; // centre
			}
			const placed: Placed[] = [];
			function place(row: (Key | number)[], zTop: number) {
				let cursor = 0;
				for (const item of row) {
					if (typeof item === 'number') {
						cursor += item;
						continue;
					}
					placed.push({ ...item, x: x0 + (cursor + item.w / 2) * U, z: zTop + U / 2 });
					cursor += item.w;
				}
			}
			place(fnRow, zFn);
			rows.forEach((r, i) => place(r, zFn + (1.5 + i) * U));

			// ── legend atlas: one canvas, one cell per key, sized to the keycap ──
			const CELL = 96;
			const ATLAS = 2048;
			const atlas = document.createElement('canvas');
			atlas.width = atlas.height = ATLAS;
			const actx = atlas.getContext('2d')!;
			let ax = 0;
			let ay = 0;
			const cells = placed.map((p) => {
				const cw = Math.round(p.w * CELL);
				if (ax + cw > ATLAS) {
					ax = 0;
					ay += CELL;
				}
				const cell = { px: ax, py: ay, cw };
				ax += cw;
				return cell;
			});
			// Taiwanese layout: each letter/number key also carries its Zhuyin.
			const ZHUYIN: Record<string, string> = {
				'1': 'ㄅ',
				'2': 'ㄉ',
				'3': 'ˇ',
				'4': 'ˋ',
				'5': 'ㄓ',
				'6': 'ˊ',
				'7': '˙',
				'8': 'ㄚ',
				'9': 'ㄞ',
				'0': 'ㄢ',
				'-': 'ㄦ',
				Q: 'ㄆ',
				W: 'ㄊ',
				E: 'ㄍ',
				R: 'ㄐ',
				T: 'ㄔ',
				Y: 'ㄗ',
				U: 'ㄧ',
				I: 'ㄛ',
				O: 'ㄟ',
				P: 'ㄣ',
				A: 'ㄇ',
				S: 'ㄋ',
				D: 'ㄎ',
				F: 'ㄑ',
				G: 'ㄕ',
				H: 'ㄘ',
				J: 'ㄨ',
				K: 'ㄜ',
				L: 'ㄠ',
				';': 'ㄤ',
				Z: 'ㄈ',
				X: 'ㄌ',
				C: 'ㄏ',
				V: 'ㄒ',
				B: 'ㄖ',
				N: 'ㄙ',
				M: 'ㄩ',
				',': 'ㄝ',
				'.': 'ㄡ',
				'/': 'ㄥ'
			};
			const SANS = '"Segoe UI", system-ui, sans-serif';
			const CJK = '"Microsoft JhengHei", "PingFang TC", "Noto Sans TC", sans-serif';
			const BACKLIGHT = '#cfeaff'; // shine-through legends glow a cool white-blue

			function drawStar(cx: number, cy: number, r: number) {
				actx.beginPath();
				for (let n = 0; n < 10; n++) {
					const a = -Math.PI / 2 + (n * Math.PI) / 5;
					const rr = n % 2 ? r * 0.45 : r;
					actx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
				}
				actx.closePath();
				actx.fill();
			}
			function drawCrown(cx: number, cy: number, w: number) {
				const h = w * 0.6;
				actx.beginPath();
				actx.moveTo(cx - w / 2, cy + h / 2);
				actx.lineTo(cx - w / 2, cy - h / 2);
				actx.lineTo(cx - w / 4, cy);
				actx.lineTo(cx, cy - h / 2);
				actx.lineTo(cx + w / 4, cy);
				actx.lineTo(cx + w / 2, cy - h / 2);
				actx.lineTo(cx + w / 2, cy + h / 2);
				actx.closePath();
				actx.fill();
			}

			placed.forEach((p, i) => {
				const { px, py, cw } = cells[i];
				actx.textBaseline = 'middle';
				if (p.cap === 'purple') {
					actx.fillStyle = '#fbeaff';
					if (p.art === 'crown') drawCrown(px + cw / 2, py + CELL / 2, 46);
					if (p.art === 'star') drawStar(px + cw * 0.62, py + CELL / 2, 26);
					return;
				}
				if (p.cap === 'gold') {
					actx.fillStyle = '#2a1b05';
					actx.textAlign = 'center';
					actx.font = `800 34px ${SANS}`;
					actx.letterSpacing = '6px';
					actx.fillText(p.label, px + cw / 2, py + CELL / 2 + 2);
					actx.letterSpacing = '0px';
					return;
				}
				actx.fillStyle = BACKLIGHT;
				const zy = ZHUYIN[p.label];
				actx.textAlign = 'center';
				if (zy) {
					actx.font = `500 34px ${SANS}`;
					actx.fillText(p.label, px + cw * 0.3, py + CELL * 0.36);
					actx.font = `500 30px ${CJK}`;
					actx.fillText(zy, px + cw * 0.7, py + CELL * 0.66);
					return;
				}
				actx.font = `500 ${p.label.length > 2 ? 24 : 36}px ${SANS}`;
				actx.fillText(p.label, px + cw / 2, py + CELL / 2 + 2);
			});
			const atlasTex = new THREE.CanvasTexture(atlas);
			atlasTex.colorSpace = THREE.SRGBColorSpace;
			atlasTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

			// ── build caps + legend planes, merged per material ──
			const capGeoms: Record<Cap, BufferGeometry[]> = {
				black: [],
				purple: [],
				gold: []
			};
			const legendGeoms: BufferGeometry[] = [];
			 
			// Scratch cache while building the board, never reactive state.
			// eslint-disable-next-line svelte/prefer-svelte-reactivity
			const capCache = new Map<number, BufferGeometry>();
			placed.forEach((p, i) => {
				const w = p.w * U - GAP;
				const d = U - GAP;
				let base = capCache.get(p.w);
				if (!base) {
					base = slab(w, d, CAP_H, 0.22, 0.12);
					capCache.set(p.w, base);
				}
				capGeoms[p.cap].push(base.clone().translate(p.x, CAP_Y, p.z));

				if (!p.label || p.art === 'plain') return;
				const plane = new THREE.PlaneGeometry(w - 0.32, d - 0.32);
				plane.rotateX(-Math.PI / 2);
				plane.translate(p.x, CAP_Y + CAP_H + 0.004, p.z);
				const { px, py, cw } = cells[i];
				const u0 = px / ATLAS;
				const u1 = (px + cw) / ATLAS;
				const vTop = 1 - py / ATLAS;
				const vBot = 1 - (py + CELL) / ATLAS;
				const uv = plane.attributes.uv;
				for (let j = 0; j < uv.count; j++) {
					uv.setXY(j, u0 + uv.getX(j) * (u1 - u0), vBot + uv.getY(j) * (vTop - vBot));
				}
				legendGeoms.push(plane);
			});

			const capMats: Record<Cap, InstanceType<typeof THREE.MeshPhysicalMaterial>> = {
				black: new THREE.MeshPhysicalMaterial({
					color: '#17171a',
					roughness: 0.55,
					metalness: 0.05,
					clearcoat: 0.2
				}),
				purple: new THREE.MeshPhysicalMaterial({
					color: '#8b3fd1',
					roughness: 0.45,
					metalness: 0.05,
					clearcoat: 0.4
				}),
				gold: new THREE.MeshPhysicalMaterial({
					color: '#d8b04c',
					roughness: 0.28,
					metalness: 0.75,
					clearcoat: 0.6
				})
			};
			for (const cap of ['black', 'purple', 'gold'] as Cap[]) {
				if (!capGeoms[cap].length) continue;
				board.add(new THREE.Mesh(mergeGeometries(capGeoms[cap]), capMats[cap]));
			}
			const legendMat = new THREE.MeshBasicMaterial({
				map: atlasTex,
				transparent: true,
				toneMapped: false,
				depthWrite: false
			});
			board.add(new THREE.Mesh(mergeGeometries(legendGeoms), legendMat));
			capCache.forEach((g) => g.dispose());

			// ── RGB glow under the caps, seen in the gaps between them ──
			const glowTex = (() => {
				const c = document.createElement('canvas');
				c.width = 512;
				c.height = 8;
				const ctx = c.getContext('2d')!;
				const g = ctx.createLinearGradient(0, 0, 512, 0);
				g.addColorStop(0, '#1d4ed8');
				g.addColorStop(0.5, '#38bdf8');
				g.addColorStop(1, '#1d4ed8');
				ctx.fillStyle = g;
				ctx.fillRect(0, 0, 512, 8);
				const t = new THREE.CanvasTexture(c);
				t.colorSpace = THREE.SRGBColorSpace;
				return t;
			})();
			const glow = new THREE.Mesh(
				new THREE.PlaneGeometry(LAYOUT_W + 0.2, 6.5 * U + 0.2),
				new THREE.MeshBasicMaterial({
					map: glowTex,
					transparent: true,
					opacity: 0.3,
					toneMapped: false
				})
			);
			glow.rotation.x = -Math.PI / 2;
			glow.position.set(0, CASE_H + 0.02, zFn + 3.25 * U);
			board.add(glow);

			// ── top band: G mark, two round buttons, media keys, volume roller ──
			const bandZ = -CASE_D / 2 + 0.9;
			const markTex = (() => {
				const c = document.createElement('canvas');
				c.width = c.height = 128;
				const ctx = c.getContext('2d')!;
				// Geometric "G": an open ring with a bar into the centre.
				ctx.strokeStyle = ctx.fillStyle = '#e8e8ec';
				ctx.lineWidth = 18;
				ctx.beginPath();
				ctx.arc(64, 64, 42, Math.PI * 0.08, Math.PI * 1.92, false);
				ctx.stroke();
				ctx.fillRect(64, 55, 52, 18);
				const t = new THREE.CanvasTexture(c);
				t.colorSpace = THREE.SRGBColorSpace;
				return t;
			})();
			const mark = new THREE.Mesh(
				new THREE.PlaneGeometry(0.85, 0.85),
				new THREE.MeshStandardMaterial({
					map: markTex,
					transparent: true,
					metalness: 0.6,
					roughness: 0.3
				})
			);
			mark.rotation.x = -Math.PI / 2;
			mark.position.set(x0 + 0.5 * U, CASE_H + 0.006, bandZ);
			board.add(mark);

			const knobMat = new THREE.MeshStandardMaterial({
				color: '#1d1d21',
				roughness: 0.4,
				metalness: 0.4
			});
			const xOf = (label: string) => placed.find((p) => p.label === label)!.x;
			// Game-mode and brightness buttons sit above F3 and F4.
			for (const label of ['F3', 'F4']) {
				const b = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.44, 0.22, 36), knobMat);
				b.position.set(xOf(label), CASE_H + 0.11, bandZ);
				board.add(b);
			}
			// Media keys (previous, play/pause, next, mute) above F9–F12.
			for (const label of ['F9', 'F10', 'F11', 'F12']) {
				const mk = new THREE.Mesh(slab(1.1, 0.78, 0.24, 0.3, 0.06), knobMat);
				mk.position.set(xOf(label), CASE_H, bandZ);
				board.add(mk);
			}

			// A three-quarter view that shows off the depth of the caps.
			board.rotation.y = -0.32;

			// ── controls / framing ──
			const controls = new OrbitControls(camera, canvasEl);
			controls.enableZoom = false;
			controls.enablePan = false;
			controls.enableDamping = true;
			controls.dampingFactor = 0.08;
			controls.rotateSpeed = 0.6;
			controls.minPolarAngle = Math.PI * 0.12;
			controls.maxPolarAngle = Math.PI * 0.46; // never from underneath
			// A long, flat object reads badly edge-on, so instead of a full turn it
			// sways gently around the front three-quarter view while idle.
			let sway = !reduced && !lite();
			let dragging = false;
			const SWAY_BASE = -0.32;
			const swayStart = performance.now();
			controls.target.set(0, 1.2, 0.6);

			function resize() {
				const w = host!.clientWidth;
				const h = host!.clientHeight;
				renderer.setSize(w, h, false);
				camera.aspect = w / h;
				const hHalf = Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
				const dist = Math.max((CASE_W * 0.72) / Math.tan(hHalf), 40);
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
				if (sway && !dragging) {
					const t = (performance.now() - swayStart) / 1000;
					board.rotation.y = SWAY_BASE + Math.sin(t * 0.35) * 0.32;
				}
				renderer.render(scene, camera);
				if (moving || (sway && !dragging)) kick();
			}
			function kick() {
				if (scheduled || destroyed) return;
				scheduled = true;
				rafId = requestAnimationFrame(loop);
			}
			controls.addEventListener('change', kick);
			controls.addEventListener('start', () => {
				dragging = true;
				kick();
			});
			controls.addEventListener('end', () => {
				dragging = false;
				kick();
			});

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
					sway = false;
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
				for (const t of [atlasTex, glowTex, markTex, envTex]) t.dispose();
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
