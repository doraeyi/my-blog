<!--
	A procedurally built Logitech G PRO X TKL LIGHTSPEED (black, Taiwanese
	layout) you can turn, matched against Logitech's own top-down product shot:
	- matte black case, 368 × 150 mm, keys close to the front edge
	- top band: G mark; LIGHTSPEED / Bluetooth / game-mode / brightness buttons;
	  CAPS LOCK and BATTERY indicators; four round media buttons; the volume
	  roller in the top-right corner
	- 87 keys with front-lit legends in a rainbow sweep across the board:
	  uppercase modifier labels, digit + shifted symbol + Zhuyin on the number
	  row, letter + Zhuyin on the alpha keys, icon legends for Win/Menu/arrows
	Optional purple cheer keycap set (KeycapSet 'purple-cheer').
	1 unit = 10 mm; 1u key pitch = 19.05 mm.

	Caps of a colour merge into one mesh and all legends into one textured mesh,
	so the board is a handful of draw calls. Drag to turn; sways gently around
	the front view while on screen; stops in light-effects mode.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { Shoot } from '$lib/gear-shots';
	import type { KeycapSet } from '$lib/collections';
	import type { BufferGeometry } from 'three';

	/** Set by the still-capture page: receives a function that renders one frame at a given turn. */
	let {
		keycaps = 'stock',
		label,
		onshoot
	}: { keycaps?: KeycapSet; label: string; onshoot?: (shoot: Shoot) => void } = $props();

	let host: HTMLDivElement | undefined = $state();
	let canvasEl: HTMLCanvasElement | undefined = $state();
	let ready = $state(false);

	type Cap = 'black' | 'purple' | 'gold';
	/** Legend styles drawn onto a keycap. */
	type Legend =
		| { kind: 'text'; text: string } // modifier label, top-left, small caps
		| { kind: 'alpha'; main: string; zhuyin?: string } // letter + Zhuyin
		| { kind: 'digit'; main: string; shifted: string; zhuyin?: string }
		| { kind: 'icon'; icon: IconName }
		| { kind: 'none' };
	type IconName =
		| 'win'
		| 'menu'
		| 'up'
		| 'down'
		| 'left'
		| 'right'
		| 'back'
		| 'enter'
		| 'dash'
		| 'crown'
		| 'star';
	interface Key {
		w: number;
		cap: Cap;
		legend: Legend;
		id?: string; // used to find a key's position (e.g. 'F9')
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
			scene.environmentIntensity = 0.5;
			pmrem.dispose();

			const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 300);
			const sun = new THREE.DirectionalLight('#ffffff', 1.1);
			sun.position.set(6, 20, 14);
			scene.add(sun);

			// ── dimensions (mm / 10) ──
			const U = 1.905;
			const CASE_W = 36.8;
			const CASE_D = 15.0;
			const CASE_H = 1.5;
			const GAP = 0.2;
			const CAP_H = 0.85;
			const CAP_Y = CASE_H + 0.32;
			const LEFT = -CASE_W / 2; // case left edge
			const BACK = -CASE_D / 2; // case back edge
			const mmX = (mm: number) => LEFT + mm / 10;
			const mmZ = (mm: number) => BACK + mm / 10;

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
				color: '#141416',
				roughness: 0.6,
				metalness: 0.2
			});
			board.add(new THREE.Mesh(slab(CASE_W, CASE_D, CASE_H, 0.55, 0.16), caseMat));

			// ── layout ──
			const cheer = keycaps === 'purple-cheer';
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
			const SHIFTED: Record<string, string> = {
				'`': '~',
				'1': '!',
				'2': '@',
				'3': '#',
				'4': '$',
				'5': '%',
				'6': '^',
				'7': '&',
				'8': '*',
				'9': '(',
				'0': ')',
				'-': '_',
				'=': '+',
				'[': '{',
				']': '}',
				'\\': '|',
				';': ':',
				"'": '"',
				',': '<',
				'.': '>',
				'/': '?'
			};
			const txt = (t: string, w = 1, id?: string): Key => ({
				w,
				cap: 'black',
				legend: { kind: 'text', text: t },
				id: id ?? t
			});
			const ico = (icon: IconName, w = 1): Key => ({
				w,
				cap: 'black',
				legend: { kind: 'icon', icon }
			});
			const alpha = (c: string): Key =>
				SHIFTED[c] && !/[A-Z]/.test(c)
					? {
							w: 1,
							cap: 'black',
							legend: { kind: 'digit', main: c, shifted: SHIFTED[c], zhuyin: ZHUYIN[c] }
						}
					: { w: 1, cap: 'black', legend: { kind: 'alpha', main: c, zhuyin: ZHUYIN[c] } };
			// With the cheer set fitted these keys become purple caps (artwork, no legend).
			const cheerCap = (k: Key, art?: IconName): Key =>
				cheer
					? { ...k, cap: 'purple', legend: art ? { kind: 'icon', icon: art } : { kind: 'none' } }
					: k;

			const fnRow: (Key | number)[] = [
				cheerCap(txt('ESC')),
				1,
				txt('F1'),
				txt('F2'),
				txt('F3'),
				txt('F4'),
				0.5,
				txt('F5'),
				txt('F6'),
				txt('F7'),
				txt('F8'),
				0.5,
				txt('F9'),
				txt('F10'),
				txt('F11'),
				txt('F12'),
				0.5,
				txt('PRT'),
				txt('LOCK'),
				txt('PAUSE')
			];
			const rows: (Key | number)[][] = [
				[
					...'`1234567890-='.split('').map(alpha),
					cheerCap(ico('back', 2), 'crown'),
					0.5,
					txt('INS'),
					txt('HOME'),
					txt('PGUP')
				],
				[
					cheerCap(txt('TAB', 1.5)),
					...'QWERTYUIOP[]'.split('').map(alpha),
					cheerCap({ ...alpha('\\'), w: 1.5 }),
					0.5,
					txt('DEL'),
					txt('END'),
					txt('PGDN')
				],
				[
					cheerCap(txt('CAPS', 1.75)),
					..."ASDFGHJKL;'".split('').map(alpha),
					cheerCap(ico('enter', 2.25))
				],
				[
					cheerCap(txt('SHIFT', 2.25, 'LSHIFT')),
					...'ZXCVBNM,./'.split('').map(alpha),
					cheerCap(txt('SHIFT', 2.75, 'RSHIFT'), 'star'),
					1.5,
					ico('up')
				],
				[
					txt('CTRL', 1.25),
					ico('win', 1.25),
					txt('ALT', 1.25),
					cheer
						? { w: 6.25, cap: 'gold', legend: { kind: 'text', text: 'KEEP PLAYING' } }
						: ico('dash', 6.25),
					txt('ALT', 1.25),
					txt('FN', 1.25),
					ico('menu', 1.25),
					txt('CTRL', 1.25),
					0.5,
					ico('left'),
					ico('down'),
					ico('right')
				]
			];
			const LAYOUT_W = 18.5 * U;
			const x0 = -LAYOUT_W / 2;
			const zFn = mmZ(24); // the top band takes the back 24 mm

			interface Placed extends Key {
				x: number;
				z: number;
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
			rows.forEach((r, i) => place(r, zFn + (1.25 + i) * U));

			// ── legend atlas ──
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
				const c = { px: ax, py: ay, cw };
				ax += cw;
				return c;
			});
			const SANS = '"Segoe UI", system-ui, sans-serif';
			const CJK = '"Microsoft JhengHei", "PingFang TC", "Noto Sans TC", sans-serif';

			function drawIcon(icon: IconName, cx: number, cy: number, s: number) {
				const ctx = actx;
				const tri = (pts: [number, number][]) => {
					ctx.beginPath();
					pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
					ctx.closePath();
					ctx.fill();
				};
				ctx.lineWidth = s * 0.14;
				ctx.lineCap = 'round';
				ctx.lineJoin = 'round';
				switch (icon) {
					case 'up':
						tri([
							[cx, cy - s * 0.35],
							[cx - s * 0.35, cy + s * 0.25],
							[cx + s * 0.35, cy + s * 0.25]
						]);
						break;
					case 'down':
						tri([
							[cx, cy + s * 0.35],
							[cx - s * 0.35, cy - s * 0.25],
							[cx + s * 0.35, cy - s * 0.25]
						]);
						break;
					case 'left':
						tri([
							[cx - s * 0.35, cy],
							[cx + s * 0.25, cy - s * 0.35],
							[cx + s * 0.25, cy + s * 0.35]
						]);
						break;
					case 'right':
						tri([
							[cx + s * 0.35, cy],
							[cx - s * 0.25, cy - s * 0.35],
							[cx - s * 0.25, cy + s * 0.35]
						]);
						break;
					case 'win': {
						const q = s * 0.2;
						for (const [dx, dy] of [
							[-1, -1],
							[1, -1],
							[-1, 1],
							[1, 1]
						] as const)
							ctx.fillRect(cx + (dx < 0 ? -q - 2 : 2), cy + (dy < 0 ? -q - 2 : 2), q, q);
						break;
					}
					case 'menu':
						ctx.strokeRect(cx - s * 0.25, cy - s * 0.3, s * 0.5, s * 0.6);
						for (let i = 0; i < 3; i++)
							ctx.fillRect(cx - s * 0.14, cy - s * 0.15 + i * s * 0.15, s * 0.28, s * 0.05);
						break;
					case 'back':
						ctx.beginPath();
						ctx.moveTo(cx + s * 0.6, cy);
						ctx.lineTo(cx - s * 0.5, cy);
						ctx.stroke();
						tri([
							[cx - s * 0.7, cy],
							[cx - s * 0.45, cy - s * 0.18],
							[cx - s * 0.45, cy + s * 0.18]
						]);
						break;
					case 'enter':
						ctx.beginPath();
						ctx.moveTo(cx + s * 0.5, cy - s * 0.3);
						ctx.lineTo(cx + s * 0.5, cy);
						ctx.lineTo(cx - s * 0.4, cy);
						ctx.stroke();
						tri([
							[cx - s * 0.6, cy],
							[cx - s * 0.35, cy - s * 0.18],
							[cx - s * 0.35, cy + s * 0.18]
						]);
						break;
					case 'dash':
						ctx.fillRect(cx - s * 0.4, cy - s * 0.04, s * 0.8, s * 0.08);
						break;
					case 'crown':
						tri([
							[cx - s * 0.5, cy + s * 0.3],
							[cx - s * 0.5, cy - s * 0.3],
							[cx - s * 0.25, cy],
							[cx, cy - s * 0.3],
							[cx + s * 0.25, cy],
							[cx + s * 0.5, cy - s * 0.3],
							[cx + s * 0.5, cy + s * 0.3]
						]);
						break;
					case 'star': {
						const pts: [number, number][] = [];
						for (let n = 0; n < 10; n++) {
							const a = -Math.PI / 2 + (n * Math.PI) / 5;
							const r = n % 2 ? s * 0.18 : s * 0.4;
							pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
						}
						tri(pts);
						break;
					}
				}
			}

			placed.forEach((p, i) => {
				const { px, py, cw } = cells[i];
				const L = p.legend;
				if (L.kind === 'none') return;
				const t = (p.x - x0) / LAYOUT_W;
				// Front-lit legends sweep the colour wheel left → right, as in the factory effect.
				actx.fillStyle =
					p.cap === 'black'
						? `hsl(${(190 - t * 320 + 360) % 360}, 100%, 70%)`
						: p.cap === 'gold'
							? '#2a1b05'
							: '#fbeaff';
				actx.strokeStyle = actx.fillStyle;
				actx.textBaseline = 'middle';
				// Legends sit in the upper half of the cap, where the LED shines through.
				const top = py + CELL * 0.32;
				const left = px + 16;
				switch (L.kind) {
					case 'text':
						if (p.cap === 'gold') {
							actx.textAlign = 'center';
							actx.font = `800 34px ${SANS}`;
							actx.letterSpacing = '6px';
							actx.fillText(L.text, px + cw / 2, py + CELL / 2);
							actx.letterSpacing = '0px';
						} else {
							actx.textAlign = 'left';
							actx.font = `700 ${L.text.length > 3 ? 21 : 25}px ${SANS}`;
							actx.fillText(L.text, left, top);
						}
						break;
					case 'alpha':
						actx.textAlign = 'left';
						actx.font = `700 34px ${SANS}`;
						actx.fillText(L.main, left, top);
						if (L.zhuyin) {
							actx.font = `700 28px ${CJK}`;
							actx.fillText(L.zhuyin, px + cw * 0.56, top);
						}
						break;
					case 'digit':
						actx.textAlign = 'left';
						actx.font = `700 28px ${SANS}`;
						actx.fillText(L.main, left, top);
						actx.fillText(L.shifted, left, top + 30);
						if (L.zhuyin) {
							actx.font = `700 26px ${CJK}`;
							actx.fillText(L.zhuyin, px + cw * 0.56, top);
						}
						break;
					case 'icon':
						drawIcon(
							L.icon,
							p.cap === 'black' && L.icon !== 'dash' ? px + Math.min(cw / 2, 40) : px + cw / 2,
							p.cap === 'black' ? top + 4 : py + CELL / 2,
							40
						);
						break;
				}
			});
			const atlasTex = new THREE.CanvasTexture(atlas);
			atlasTex.colorSpace = THREE.SRGBColorSpace;
			atlasTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

			// ── caps + legend planes, merged per material ──
			const capGeoms: Record<Cap, BufferGeometry[]> = { black: [], purple: [], gold: [] };
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
				if (p.legend.kind === 'none') return;
				const plane = new THREE.PlaneGeometry(w - 0.32, d - 0.32);
				plane.rotateX(-Math.PI / 2);
				plane.translate(p.x, CAP_Y + CAP_H + 0.004, p.z);
				const { px, py, cw } = cells[i];
				const u0 = px / ATLAS;
				const u1 = (px + cw) / ATLAS;
				const vTop = 1 - py / ATLAS;
				const vBot = 1 - (py + CELL) / ATLAS;
				const uv = plane.attributes.uv;
				for (let j = 0; j < uv.count; j++)
					uv.setXY(j, u0 + uv.getX(j) * (u1 - u0), vBot + uv.getY(j) * (vTop - vBot));
				legendGeoms.push(plane);
			});
			const capMats: Record<Cap, InstanceType<typeof THREE.MeshPhysicalMaterial>> = {
				black: new THREE.MeshPhysicalMaterial({
					color: '#1a1a1d',
					roughness: 0.58,
					metalness: 0.05,
					clearcoat: 0.15
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
				if (capGeoms[cap].length)
					board.add(new THREE.Mesh(mergeGeometries(capGeoms[cap]), capMats[cap]));
			}
			board.add(
				new THREE.Mesh(
					mergeGeometries(legendGeoms),
					new THREE.MeshBasicMaterial({
						map: atlasTex,
						transparent: true,
						toneMapped: false,
						depthWrite: false
					})
				)
			);
			capCache.forEach((g) => g.dispose());

			// A faint spill of the same rainbow between the caps.
			const glowTex = (() => {
				const c = document.createElement('canvas');
				c.width = 512;
				c.height = 4;
				const ctx = c.getContext('2d')!;
				for (let x = 0; x < 512; x++) {
					ctx.fillStyle = `hsl(${(190 - (x / 512) * 320 + 360) % 360}, 90%, 55%)`;
					ctx.fillRect(x, 0, 1, 4);
				}
				const t = new THREE.CanvasTexture(c);
				t.colorSpace = THREE.SRGBColorSpace;
				return t;
			})();
			const glow = new THREE.Mesh(
				new THREE.PlaneGeometry(LAYOUT_W, 6.25 * U),
				new THREE.MeshBasicMaterial({
					map: glowTex,
					transparent: true,
					opacity: 0.05,
					toneMapped: false
				})
			);
			glow.rotation.x = -Math.PI / 2;
			glow.position.set(0, CASE_H + 0.02, zFn + 3.125 * U);
			board.add(glow);

			// ── top band (positions measured off Logitech's top-down shot) ──
			const bandZ = mmZ(10.5);
			const BAND_ICONS = [
				'g',
				'lightspeed',
				'bluetooth',
				'game',
				'sun',
				'prev',
				'play',
				'next',
				'mute',
				'capslock',
				'battery'
			] as const;
			type BandIcon = (typeof BAND_ICONS)[number];
			const bandTex = (() => {
				const c = document.createElement('canvas');
				c.width = 128 * BAND_ICONS.length;
				c.height = 128;
				const ctx = c.getContext('2d')!;
				ctx.fillStyle = ctx.strokeStyle = '#ffffff';
				ctx.lineCap = 'round';
				ctx.lineJoin = 'round';
				const fillTri = (pts: [number, number][]) => {
					ctx.beginPath();
					pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
					ctx.closePath();
					ctx.fill();
				};
				BAND_ICONS.forEach((name, i) => {
					const cx = i * 128 + 64;
					const cy = 64;
					switch (name) {
						case 'g':
							// Logitech G: heavy ring open at the upper right, bar into the centre.
							ctx.lineCap = 'butt';
							ctx.lineWidth = 20;
							ctx.beginPath();
							ctx.arc(cx, cy, 42, 0, Math.PI * 1.68, false);
							ctx.stroke();
							ctx.fillRect(cx, cy - 10, 52, 20);
							ctx.lineCap = 'round';
							break;
						case 'lightspeed':
							ctx.lineWidth = 6;
							for (let r = 0; r < 6; r++) {
								const a = (r * Math.PI) / 3;
								ctx.beginPath();
								ctx.moveTo(cx + Math.cos(a) * 8, cy + Math.sin(a) * 8);
								ctx.lineTo(cx + Math.cos(a) * 26, cy + Math.sin(a) * 26);
								ctx.stroke();
							}
							break;
						case 'bluetooth':
							ctx.lineWidth = 6;
							ctx.beginPath();
							ctx.moveTo(cx - 16, cy - 14);
							ctx.lineTo(cx + 14, cy + 14);
							ctx.lineTo(cx, cy + 28);
							ctx.lineTo(cx, cy - 28);
							ctx.lineTo(cx + 14, cy - 14);
							ctx.lineTo(cx - 16, cy + 14);
							ctx.stroke();
							break;
						case 'game':
							ctx.lineWidth = 6;
							ctx.beginPath();
							ctx.roundRect(cx - 30, cy - 16, 60, 32, 16);
							ctx.stroke();
							ctx.fillRect(cx - 20, cy - 3, 14, 6);
							ctx.fillRect(cx - 16, cy - 7, 6, 14);
							ctx.beginPath();
							ctx.arc(cx + 14, cy, 4, 0, Math.PI * 2);
							ctx.fill();
							break;
						case 'sun':
							ctx.beginPath();
							ctx.arc(cx, cy, 12, 0, Math.PI * 2);
							ctx.fill();
							ctx.lineWidth = 5;
							for (let r = 0; r < 8; r++) {
								const a = (r * Math.PI) / 4;
								ctx.beginPath();
								ctx.moveTo(cx + Math.cos(a) * 20, cy + Math.sin(a) * 20);
								ctx.lineTo(cx + Math.cos(a) * 30, cy + Math.sin(a) * 30);
								ctx.stroke();
							}
							break;
						case 'prev':
							ctx.fillRect(cx - 30, cy - 18, 6, 36);
							fillTri([
								[cx - 24, cy],
								[cx, cy - 18],
								[cx, cy + 18]
							]);
							fillTri([
								[cx, cy],
								[cx + 24, cy - 18],
								[cx + 24, cy + 18]
							]);
							break;
						case 'play':
							fillTri([
								[cx - 26, cy - 19],
								[cx, cy],
								[cx - 26, cy + 19]
							]);
							ctx.fillRect(cx + 6, cy - 18, 7, 36);
							ctx.fillRect(cx + 19, cy - 18, 7, 36);
							break;
						case 'next':
							fillTri([
								[cx - 24, cy - 18],
								[cx, cy],
								[cx - 24, cy + 18]
							]);
							fillTri([
								[cx, cy - 18],
								[cx + 24, cy],
								[cx, cy + 18]
							]);
							ctx.fillRect(cx + 24, cy - 18, 6, 36);
							break;
						case 'mute':
							ctx.fillRect(cx - 30, cy - 10, 12, 20);
							fillTri([
								[cx - 18, cy - 10],
								[cx - 2, cy - 24],
								[cx - 2, cy + 24],
								[cx - 18, cy + 10]
							]);
							ctx.lineWidth = 6;
							ctx.beginPath();
							ctx.moveTo(cx + 8, cy - 12);
							ctx.lineTo(cx + 30, cy + 12);
							ctx.moveTo(cx + 30, cy - 12);
							ctx.lineTo(cx + 8, cy + 12);
							ctx.stroke();
							break;
						case 'capslock':
						case 'battery':
							ctx.font = `600 22px ${SANS}`;
							ctx.textAlign = 'center';
							ctx.textBaseline = 'middle';
							ctx.fillText(name === 'capslock' ? 'CAPS LOCK' : 'BATTERY', cx, cy - 14);
							ctx.beginPath();
							ctx.arc(cx, cy + 20, 5, 0, Math.PI * 2);
							ctx.fill();
							break;
					}
				});
				const t = new THREE.CanvasTexture(c);
				t.colorSpace = THREE.SRGBColorSpace;
				t.anisotropy = renderer.capabilities.getMaxAnisotropy();
				return t;
			})();
			const bandMats: InstanceType<typeof THREE.MeshBasicMaterial>[] = [];
			function bandIcon(
				name: BandIcon,
				size: number,
				x: number,
				y: number,
				z: number,
				color: string,
				glows = false
			) {
				const geo = new THREE.PlaneGeometry(size, size);
				const i = BAND_ICONS.indexOf(name);
				const uv = geo.attributes.uv;
				for (let j = 0; j < uv.count; j++) uv.setX(j, (i + uv.getX(j)) / BAND_ICONS.length);
				const mat = new THREE.MeshBasicMaterial({
					map: bandTex,
					color,
					transparent: true,
					toneMapped: !glows,
					depthWrite: false
				});
				bandMats.push(mat);
				const m = new THREE.Mesh(geo, mat);
				m.rotation.x = -Math.PI / 2;
				m.position.set(x, y, z);
				board.add(m);
			}

			// G mark: matte light grey print, unlit.
			bandIcon('g', 1.0, mmX(13.3), CASE_H + 0.006, bandZ, '#b9b9be');

			const knobMat = new THREE.MeshStandardMaterial({
				color: '#1c1c20',
				roughness: 0.45,
				metalness: 0.35
			});
			const KNOB_R = 0.42;
			const knobTop = CASE_H + 0.2;
			function knob(x: number) {
				const b = new THREE.Mesh(
					new THREE.CylinderGeometry(KNOB_R, KNOB_R + 0.02, 0.2, 36),
					knobMat
				);
				b.position.set(x, CASE_H + 0.1, bandZ);
				board.add(b);
			}
			// LIGHTSPEED, Bluetooth, game mode, brightness (the last one lit green).
			const leftButtons: [BandIcon, number, string, boolean][] = [
				['lightspeed', 53.3, '#8a8a90', false],
				['bluetooth', 72.4, '#8a8a90', false],
				['game', 92.1, '#8a8a90', false],
				['sun', 111.8, '#4ade80', true]
			];
			for (const [name, mm, color, lit] of leftButtons) {
				knob(mmX(mm));
				bandIcon(name, 0.48, mmX(mm), knobTop + 0.003, bandZ, color, lit);
			}
			bandIcon('capslock', 1.6, mmX(182), CASE_H + 0.006, bandZ + 0.1, '#7d7d84');
			bandIcon('battery', 1.6, mmX(203), CASE_H + 0.006, bandZ + 0.1, '#7d7d84');
			// Four RGB-lit media buttons.
			const media: [BandIcon, number, string][] = [
				['prev', 231, '#f472b6'],
				['play', 251, '#a78bfa'],
				['next', 271, '#818cf8'],
				['mute', 290, '#60a5fa']
			];
			for (const [name, mm, color] of media) {
				knob(mmX(mm));
				bandIcon(name, 0.48, mmX(mm), knobTop + 0.003, bandZ, color, true);
			}
			// Volume roller in the top-right corner, knurled, lying across the board.
			const roller = new THREE.Mesh(
				new THREE.CylinderGeometry(0.52, 0.52, 4.0, 48),
				new THREE.MeshStandardMaterial({ color: '#232327', roughness: 0.42, metalness: 0.6 })
			);
			roller.rotation.z = Math.PI / 2;
			roller.position.set(mmX(336), CASE_H + 0.28, mmZ(8.5));
			board.add(roller);

			board.rotation.y = -0.12;

			// ── controls / framing ──
			const controls = new OrbitControls(camera, canvasEl);
			controls.enableZoom = false;
			controls.enablePan = false;
			controls.enableDamping = true;
			controls.dampingFactor = 0.08;
			controls.rotateSpeed = 0.6;
			controls.minPolarAngle = Math.PI * 0.08;
			controls.maxPolarAngle = Math.PI * 0.4; // never low enough to hide the top band
			controls.target.set(0, 1.2, 0.4);
			// A long, flat object reads badly edge-on, so instead of a full turn it
			// sways gently around the front view while idle.
			let sway = !reduced && !lite() && !onshoot;
			let dragging = false;
			const SWAY_BASE = -0.12;
			const swayStart = performance.now();

			function resize() {
				const w = host!.clientWidth;
				const h = host!.clientHeight;
				renderer.setSize(w, h, false);
				camera.aspect = w / h;
				const hHalf = Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
				const dist = Math.max((CASE_W * 0.66) / Math.tan(hHalf), 40);
				const dir = new THREE.Vector3(0, 0.9, 0.55).normalize();
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
					board.rotation.y = SWAY_BASE + Math.sin(t * 0.35) * 0.16;
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

			// Still-capture mode for the /setup card images: hold still, render on demand.
			if (onshoot) {
				const rest = board.rotation.y;
				onshoot((yaw) => {
					board.rotation.y = rest + yaw;
					renderer.render(scene, camera);
					return canvasEl!.toDataURL('image/png');
				});
			}

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
				for (const t of [atlasTex, glowTex, bandTex, envTex]) t.dispose();
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
