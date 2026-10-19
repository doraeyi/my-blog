<!--
	Homepage hero scene: a late-night case desk. A manila case file lies open
	under a banker's lamp; a brass magnifying glass follows the pointer, and its
	lens genuinely refracts (physical transmission through a biconvex lens) the
	typed dossier underneath — move it over a line to read it larger.

	Entrance: the lamp clicks on with a short flicker while the file cover swings
	open. Clicking the file closes / reopens it. As the hero scrolls away the lamp
	dims and the camera lifts. Everything is procedural geometry and canvas
	textures; no model files to load.

	Renders only while the hero is on screen and the tab is visible. Reduced
	motion: one static, fully lit frame, no follow, no intro. On WebGL failure
	the canvas simply never fades in.
-->
<script lang="ts">
	import { onMount } from 'svelte';

	let { postCount, wordLabel, days }: { postCount: number; wordLabel: string; days: number } =
		$props();

	let host: HTMLDivElement | undefined = $state();
	let canvasEl: HTMLCanvasElement | undefined = $state();
	let ready = $state(false);
	let hoverFile = $state(false);

	onMount(() => {
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		let destroyed = false;
		let rafId = 0;
		let cleanup: (() => void) | undefined;
		let cleanupExtra: (() => void) | undefined;

		(async () => {
			let THREE: typeof import('three');
			let RoomEnvironment: typeof import('three/examples/jsm/environments/RoomEnvironment.js').RoomEnvironment;
			try {
				THREE = await import('three');
				({ RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js'));
				await document.fonts?.ready;
			} catch {
				return;
			}
			if (destroyed || !canvasEl || !host) return;

			const isNarrow = window.matchMedia('(max-width: 767px)').matches;

			let renderer: InstanceType<typeof THREE.WebGLRenderer>;
			try {
				renderer = new THREE.WebGLRenderer({
					canvas: canvasEl,
					alpha: true,
					antialias: true,
					powerPreference: 'high-performance'
				});
			} catch {
				return;
			}
			renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isNarrow ? 1.5 : 2));
			renderer.outputColorSpace = THREE.SRGBColorSpace;
			renderer.toneMapping = THREE.ACESFilmicToneMapping;

			const scene = new THREE.Scene();
			const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);
			// A soft studio room for metals and the lens to reflect — without it brass reads black.
			const pmrem = new THREE.PMREMGenerator(renderer);
			const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
			scene.environment = envTex;
			scene.environmentIntensity = 0.55;
			pmrem.dispose();

			const css = getComputedStyle(document.documentElement);
			const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
			const C = {
				// Real manila and aged ivory — deliberately not the page's own surface tones,
				// so the file reads as an object on the desk instead of dissolving into it.
				manila: '#d4ad6e',
				manilaDeep: '#b88f52',
				paper: '#f2e7cf',
				ink: v('--color-case-900', '#2c2118'),
				inkSoft: v('--color-case-600', '#8a6d45'),
				stamp: v('--color-stamp-500', '#b3362b'),
				lamp: v('--color-phosphor-300', '#ffd98a')
			};
			const TYPE = '"Special Elite", "Courier New", ui-monospace, monospace';

			// ---------- textures ----------
			const maxAniso = renderer.capabilities.getMaxAnisotropy();
			function canvasTex(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
				const c = document.createElement('canvas');
				c.width = w;
				c.height = h;
				const ctx = c.getContext('2d')!;
				draw(ctx);
				const tex = new THREE.CanvasTexture(c);
				tex.colorSpace = THREE.SRGBColorSpace;
				tex.anisotropy = maxAniso;
				return tex;
			}

			function grain(ctx: CanvasRenderingContext2D, w: number, h: number, alpha: number) {
				for (let i = 0; i < (w * h) / 60; i++) {
					ctx.fillStyle = `rgba(60,40,20,${Math.random() * alpha})`;
					ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
				}
			}

			// The dossier — real numbers from the site, typed. The lens is there to read it.
			const dossierTex = canvasTex(1600, 1130, (ctx) => {
				const W = 1600;
				const H = 1130;
				ctx.fillStyle = C.paper;
				ctx.fillRect(0, 0, W, H);
				// Fibre: long faint strands plus speckle, then a darker worn border.
				for (let i = 0; i < 2200; i++) {
					ctx.strokeStyle = `rgba(110,80,40,${Math.random() * 0.2})`;
					ctx.lineWidth = 1.5;
					const x = Math.random() * W;
					const y = Math.random() * H;
					ctx.beginPath();
					ctx.moveTo(x, y);
					ctx.lineTo(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 12);
					ctx.stroke();
				}
				grain(ctx, W, H, 0.4);
				const edge = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, W * 0.62);
				edge.addColorStop(0, 'rgba(150,110,60,0)');
				edge.addColorStop(1, 'rgba(140,95,45,0.45)');
				ctx.fillStyle = edge;
				ctx.fillRect(0, 0, W, H);
				// A fold crease across the middle: shadow side, then a lit ridge.
				const crease = ctx.createLinearGradient(0, H * 0.5 - 18, 0, H * 0.5 + 18);
				crease.addColorStop(0, 'rgba(90,60,30,0)');
				crease.addColorStop(0.45, 'rgba(90,60,30,0.16)');
				crease.addColorStop(0.55, 'rgba(255,250,235,0.35)');
				crease.addColorStop(1, 'rgba(255,250,235,0)');
				ctx.fillStyle = crease;
				ctx.fillRect(0, H * 0.5 - 18, W, 36);
				// ruled lines
				ctx.strokeStyle = 'rgba(120,150,190,0.18)';
				ctx.lineWidth = 2;
				for (let y = 250; y < H - 60; y += 74) {
					ctx.beginPath();
					ctx.moveTo(90, y);
					ctx.lineTo(W - 90, y);
					ctx.stroke();
				}
				ctx.fillStyle = C.ink;
				ctx.font = `64px ${TYPE}`;
				ctx.fillText('CASE FILE — LIAM', 90, 140);
				ctx.font = `30px ${TYPE}`;
				ctx.fillStyle = C.inkSoft;
				ctx.fillText(
					`FILE No. ${String(postCount).padStart(4, '0')}-${new Date().getFullYear()}`,
					92,
					190
				);

				const rows: [string, string][] = [
					['SUBJECT', 'Liam'],
					['OCCUPATION', 'Frontend Engineer · MSI'],
					['MODUS OPERANDI', 'turns ideas into meaningful products'],
					['EVIDENCE', `${postCount} 篇文章 · ${wordLabel}`],
					['ON THE CASE', `${days} 日`],
					['LAST SEEN', 'shipping something, probably']
				];
				let y = 300;
				for (const [k, val] of rows) {
					ctx.font = `30px ${TYPE}`;
					ctx.fillStyle = C.inkSoft;
					ctx.fillText(k, 96, y);
					ctx.fillStyle = 'rgba(80,60,40,0.35)';
					ctx.fillText('.'.repeat(14), 420, y);
					ctx.font = `44px ${TYPE}`;
					ctx.fillStyle = C.ink;
					ctx.fillText(val, 640, y);
					y += 112;
				}

				// photo with paper clip
				ctx.save();
				ctx.translate(1290, 560);
				ctx.rotate(0.05);
				ctx.fillStyle = '#e9e1cf';
				ctx.fillRect(-150, -190, 300, 380);
				ctx.fillStyle = '#3a2c20';
				ctx.fillRect(-126, -166, 252, 286);
				ctx.fillStyle = C.paper;
				ctx.font = `bold 170px ${TYPE}`;
				ctx.textAlign = 'center';
				ctx.fillText('L', 0, 30);
				ctx.font = `26px ${TYPE}`;
				ctx.fillStyle = C.ink;
				ctx.fillText('EXHIBIT A', 0, 170);
				ctx.restore();
				ctx.strokeStyle = '#8f8f8f';
				ctx.lineWidth = 9;
				ctx.beginPath();
				ctx.roundRect(1250, 330, 46, 150, 23);
				ctx.stroke();

				// rubber stamp
				ctx.save();
				ctx.translate(1180, 960);
				ctx.rotate(-0.16);
				ctx.strokeStyle = C.stamp;
				ctx.fillStyle = C.stamp;
				ctx.globalAlpha = 0.78;
				ctx.lineWidth = 8;
				ctx.strokeRect(-230, -62, 460, 124);
				ctx.font = `bold 78px ${TYPE}`;
				ctx.textAlign = 'center';
				ctx.fillText('ON DUTY', 0, 26);
				ctx.restore();

				// coffee ring
				ctx.strokeStyle = 'rgba(115,70,30,0.3)';
				ctx.lineWidth = 16;
				ctx.beginPath();
				ctx.arc(240, 1010, 95, 0.3, Math.PI * 1.9);
				ctx.stroke();
			});

			const coverTex = canvasTex(1024, 730, (ctx) => {
				ctx.fillStyle = C.manila;
				ctx.fillRect(0, 0, 1024, 730);
				grain(ctx, 1024, 730, 0.18);
				ctx.fillStyle = 'rgba(255,255,255,0.55)';
				ctx.fillRect(560, 70, 400, 150);
				ctx.strokeStyle = 'rgba(60,40,20,0.5)';
				ctx.lineWidth = 3;
				ctx.strokeRect(560, 70, 400, 150);
				ctx.fillStyle = C.ink;
				ctx.font = `30px ${TYPE}`;
				ctx.fillText('NAME:  LIAM', 590, 125);
				ctx.fillText('DEPT:  FRONTEND', 590, 180);
				ctx.save();
				ctx.translate(300, 470);
				ctx.rotate(-0.12);
				ctx.strokeStyle = C.stamp;
				ctx.fillStyle = C.stamp;
				ctx.globalAlpha = 0.7;
				ctx.lineWidth = 7;
				ctx.strokeRect(-200, -55, 400, 110);
				ctx.font = `bold 62px ${TYPE}`;
				ctx.textAlign = 'center';
				ctx.fillText('PERSONAL', 0, 22);
				ctx.restore();
			});

			const insideTex = canvasTex(1024, 730, (ctx) => {
				ctx.fillStyle = C.manila;
				ctx.fillRect(0, 0, 1024, 730);
				grain(ctx, 1024, 730, 0.22);
				ctx.fillStyle = 'rgba(80,55,30,0.12)';
				ctx.fillRect(0, 0, 1024, 18);
				ctx.fillStyle = 'rgba(60,40,20,0.45)';
				ctx.font = `26px ${TYPE}`;
				for (let i = 0; i < 6; i++) ctx.fillText('— — — — — — — — — — — — — — —', 80, 140 + i * 90);
			});

			// ---------- materials ----------
			const paperMat = new THREE.MeshStandardMaterial({ map: dossierTex, roughness: 0.92 });
			const sheetMat = new THREE.MeshStandardMaterial({ color: C.paper, roughness: 0.95 });
			const coverOutMat = new THREE.MeshStandardMaterial({ map: coverTex, roughness: 0.85 });
			const coverInMat = new THREE.MeshStandardMaterial({ map: insideTex, roughness: 0.85 });
			const manilaEdge = new THREE.MeshStandardMaterial({ color: C.manilaDeep, roughness: 0.9 });
			const tabMat = new THREE.MeshStandardMaterial({ color: C.stamp, roughness: 0.6 });
			const brass = new THREE.MeshStandardMaterial({
				color: '#b8904f',
				metalness: 1,
				roughness: 0.28
			});
			const wood = new THREE.MeshStandardMaterial({ color: '#4a2f1f', roughness: 0.55 });
			const shadeMat = new THREE.MeshPhysicalMaterial({
				color: '#1d5a43',
				roughness: 0.18,
				metalness: 0.1,
				clearcoat: 1,
				clearcoatRoughness: 0.1,
				side: THREE.DoubleSide
			});
			const bulbMat = new THREE.MeshStandardMaterial({
				color: '#fff4d6',
				emissive: new THREE.Color(C.lamp),
				emissiveIntensity: 0
			});
			// The glass itself only reflects; the magnified view under it is a live
			// render from a second camera (see "loupe" below) — sharper and cheaper
			// than real transmission, and it actually makes the dossier readable.
			const lensMat = new THREE.MeshPhysicalMaterial({
				color: '#ffffff',
				transparent: true,
				opacity: 0.16,
				roughness: 0.02,
				metalness: 0,
				clearcoat: 1,
				clearcoatRoughness: 0,
				depthWrite: false
			});

			// ---------- contact shadows ----------
			// Soft baked blobs instead of real-time shadow maps: they sit cleanly on the
			// transparent page in both themes, and cost nothing on phones.
			const blobTex = canvasTex(256, 256, (ctx) => {
				const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
				g.addColorStop(0, 'rgba(0,0,0,0.55)');
				g.addColorStop(0.5, 'rgba(0,0,0,0.22)');
				g.addColorStop(1, 'rgba(0,0,0,0)');
				ctx.fillStyle = g;
				ctx.fillRect(0, 0, 256, 256);
			});
			const slabTex = canvasTex(512, 384, (ctx) => {
				ctx.filter = 'blur(26px)';
				ctx.fillStyle = 'rgba(0,0,0,0.5)';
				ctx.beginPath();
				ctx.roundRect(70, 70, 372, 244, 24);
				ctx.fill();
			});
			const shadowMats: InstanceType<typeof THREE.MeshBasicMaterial>[] = [];
			function blob(tex: InstanceType<typeof THREE.Texture>, w: number, d: number) {
				const m = new THREE.MeshBasicMaterial({
					map: tex,
					transparent: true,
					depthWrite: false,
					color: '#3a2412'
				});
				shadowMats.push(m);
				const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m);
				mesh.rotation.x = -Math.PI / 2;
				mesh.position.y = 0.001;
				mesh.renderOrder = -1;
				scene.add(mesh);
				return mesh;
			}

			// ---------- desk blotter: the shared ground everything rests on ----------
			const leatherTex = canvasTex(1400, 880, (ctx) => {
				const W = 1400;
				const H = 880;
				ctx.fillStyle = '#244a37';
				ctx.fillRect(0, 0, W, H);
				for (let i = 0; i < 26000; i++) {
					const l = Math.random();
					ctx.fillStyle =
						l > 0.5 ? `rgba(255,255,255,${(l - 0.5) * 0.06})` : `rgba(0,0,0,${l * 0.12})`;
					ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
				}
				const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, W * 0.6);
				v.addColorStop(0, 'rgba(0,0,0,0)');
				v.addColorStop(1, 'rgba(0,0,0,0.35)');
				ctx.fillStyle = v;
				ctx.fillRect(0, 0, W, H);
				ctx.setLineDash([14, 10]);
				ctx.strokeStyle = 'rgba(214,180,120,0.55)';
				ctx.lineWidth = 3;
				ctx.strokeRect(34, 34, W - 68, H - 68);
			});
			const leather = new THREE.MeshStandardMaterial({ map: leatherTex, roughness: 0.78 });
			const leatherEdge = new THREE.MeshStandardMaterial({ color: '#163126', roughness: 0.7 });
			const blotter = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.06, 4.65), [
				leatherEdge,
				leatherEdge,
				leather,
				leatherEdge,
				leatherEdge,
				leatherEdge
			]);
			blotter.position.set(-0.45, -0.03, -0.15);
			blotter.rotation.y = -0.06;
			scene.add(blotter);
			for (const [x, z] of [
				[-1, -1],
				[1, -1],
				[-1, 1],
				[1, 1]
			]) {
				const corner = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.075, 0.42), brass);
				corner.position.set((x * 7.4) / 2 - x * 0.16, 0, (z * 4.65) / 2 - z * 0.16);
				blotter.add(corner);
			}

			// ---------- case file ----------
			const FW = 3.2;
			const FD = 2.26;
			const file = new THREE.Group();
			file.position.set(0.55, 0, 0.2);
			file.rotation.y = -0.16;
			scene.add(file);

			const back = new THREE.Mesh(new THREE.BoxGeometry(FW, 0.025, FD), [
				manilaEdge,
				manilaEdge,
				coverInMat,
				manilaEdge,
				manilaEdge,
				manilaEdge
			]);
			back.position.y = 0.0125;
			file.add(back);

			const under = new THREE.Mesh(new THREE.BoxGeometry(FW - 0.22, 0.006, FD - 0.16), sheetMat);
			under.position.set(0.06, 0.03, 0.02);
			under.rotation.y = 0.035;
			file.add(under);

			const dossier = new THREE.Mesh(new THREE.BoxGeometry(FW - 0.24, 0.006, FD - 0.18), [
				sheetMat,
				sheetMat,
				paperMat,
				sheetMat,
				sheetMat,
				sheetMat
			]);
			dossier.position.set(0, 0.037, 0);
			file.add(dossier);

			const tab = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.62), tabMat);
			tab.position.set(FW / 2 + 0.1, 0.012, 0.45);
			file.add(tab);

			// Cover hinges on the far edge and stands up behind the dossier when open.
			const hinge = new THREE.Group();
			hinge.position.set(0, 0.03, -FD / 2);
			file.add(hinge);
			const cover = new THREE.Mesh(new THREE.BoxGeometry(FW, 0.025, FD), [
				manilaEdge,
				manilaEdge,
				coverOutMat,
				coverInMat,
				manilaEdge,
				manilaEdge
			]);
			cover.position.z = FD / 2;
			hinge.add(cover);

			// ---------- banker's lamp ----------
			const lamp = new THREE.Group();
			lamp.position.set(-1.75, 0, -1.25);
			scene.add(lamp);
			const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.12, 48), brass);
			lampBase.position.y = 0.06;
			lamp.add(lampBase);
			const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.55, 16), brass);
			post.position.y = 0.85;
			lamp.add(post);
			const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 16), brass);
			arm.rotation.z = Math.PI / 2;
			arm.position.set(0.42, 1.6, 0);
			lamp.add(arm);
			const head = new THREE.Group();
			head.position.set(0.9, 1.52, 0.25);
			head.rotation.set(0.25, -0.75, -0.18);
			lamp.add(head);
			// Banker's shade: a half cylinder, open underneath.
			const shade = new THREE.Mesh(
				new THREE.CylinderGeometry(0.34, 0.34, 1.25, 40, 1, true, Math.PI / 2, Math.PI),
				shadeMat
			);
			shade.rotation.z = Math.PI / 2;
			head.add(shade);
			for (const s of [-1, 1]) {
				const cap = new THREE.Mesh(
					new THREE.CircleGeometry(0.34, 40, Math.PI / 2, Math.PI),
					shadeMat
				);
				cap.rotation.y = (s * Math.PI) / 2;
				cap.rotation.z = Math.PI / 2;
				cap.position.x = s * 0.625;
				head.add(cap);
			}
			const bulb = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.75, 6, 16), bulbMat);
			bulb.rotation.z = Math.PI / 2;
			bulb.position.y = -0.1;
			head.add(bulb);

			const spot = new THREE.SpotLight(C.lamp, 0, 14, 1.05, 0.7, 1.4);
			head.updateWorldMatrix(true, true);
			scene.add(spot);
			scene.add(spot.target);
			const bulbWorld = new THREE.Vector3();
			bulb.getWorldPosition(bulbWorld);
			spot.position.copy(bulbWorld).add(new THREE.Vector3(0, -0.12, 0));
			spot.target.position.set(0.55, 0, 0.25);
			const glow = new THREE.PointLight(C.lamp, 0, 3, 2);
			glow.position.copy(bulbWorld);
			scene.add(glow);

			const hemi = new THREE.HemisphereLight('#fff8ec', '#6b5336', 1.2);
			scene.add(hemi);
			const key = new THREE.DirectionalLight('#ffffff', 0.6);
			key.position.set(3, 6, 4);
			scene.add(key);

			// ---------- magnifying glass ----------
			const glass = new THREE.Group();
			scene.add(glass);
			const tilt = new THREE.Group();
			glass.add(tilt);
			const R = 0.62;
			const LOUPE_RES = isNarrow ? 384 : 640;
			const loupeTarget = new THREE.WebGLRenderTarget(LOUPE_RES, LOUPE_RES, { samples: 4 });
			const loupeCam = new THREE.PerspectiveCamera(30, 1, 0.05, 10);
			const MAGNIFY = 2.4;
			// Soft darkening toward the rim, like looking through real glass.
			const vignette = canvasTex(256, 256, (ctx) => {
				const g = ctx.createRadialGradient(128, 128, 60, 128, 128, 128);
				g.addColorStop(0, 'rgba(0,0,0,0)');
				g.addColorStop(0.8, 'rgba(40,25,10,0.12)');
				g.addColorStop(1, 'rgba(40,25,10,0.45)');
				ctx.fillStyle = g;
				ctx.fillRect(0, 0, 256, 256);
			});
			const loupe = new THREE.Mesh(
				new THREE.CircleGeometry(R, 64),
				new THREE.MeshBasicMaterial({ map: loupeTarget.texture })
			);
			loupe.rotation.x = -Math.PI / 2;
			const loupeShade = new THREE.Mesh(
				new THREE.CircleGeometry(R, 64),
				new THREE.MeshBasicMaterial({ map: vignette, transparent: true, depthWrite: false })
			);
			loupeShade.rotation.x = -Math.PI / 2;
			loupeShade.position.y = 0.002;
			const lens = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 32), lensMat);
			lens.scale.set(1, 0.14, 1);
			// Layer 1: seen by the main camera, invisible to the loupe camera filming under it.
			for (const m of [loupe, loupeShade, lens]) {
				m.layers.set(1);
				tilt.add(m);
			}
			camera.layers.enable(1);
			const rim = new THREE.Mesh(new THREE.TorusGeometry(R + 0.02, 0.055, 20, 96), brass);
			rim.rotation.x = Math.PI / 2;
			tilt.add(rim);
			const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.22, 24), brass);
			ferrule.rotation.z = Math.PI / 2;
			ferrule.position.x = R + 0.17;
			tilt.add(ferrule);
			const handle = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.95, 8, 24), wood);
			handle.rotation.z = Math.PI / 2;
			handle.position.x = R + 0.82;
			tilt.add(handle);
			tilt.rotation.set(0.42, 0.55, 0.12);

			const deskShadow = blob(slabTex, 7.4 * 1.3, 4.65 * 1.45);
			deskShadow.position.set(blotter.position.x + 0.15, -0.065, blotter.position.z + 0.25);
			deskShadow.rotation.z = blotter.rotation.y;
			const fileShadow = blob(slabTex, FW * 1.2, FD * 1.3);
			fileShadow.position.set(file.position.x + 0.08, 0.001, file.position.z + 0.06);
			fileShadow.rotation.z = file.rotation.y;
			const lampShadow = blob(blobTex, 1.5, 1.5);
			lampShadow.position.set(lamp.position.x + 0.1, 0.001, lamp.position.z + 0.08);
			const glassShadow = blob(blobTex, 1.7, 1.7);

			// ---------- theme ----------
			let dark = false;
			function applyTheme() {
				dark = document.documentElement.getAttribute('data-theme') === 'dark';
				hemi.intensity = dark ? 0.22 : 0.85;
				scene.environmentIntensity = dark ? 0.18 : 0.55;
				key.intensity = dark ? 0.08 : 0.55;
				for (const m of shadowMats) m.opacity = dark ? 0.9 : 0.55;
				renderer.toneMappingExposure = dark ? 1.15 : 1;
			}
			applyTheme();
			const themeObserver = new MutationObserver(applyTheme);
			themeObserver.observe(document.documentElement, {
				attributes: true,
				attributeFilter: ['data-theme']
			});

			// ---------- framing ----------
			// Aim at the desk, back off far enough to fit it, then slide the frame with a
			// view offset (no perspective skew) so the desk sits right of the text column
			// on desktop and under the text on phones.
			const deskCenter = new THREE.Vector3(0.1, 0.45, -0.05);
			const viewDir = new THREE.Vector3(-0.3, 0.8, 0.95).normalize();
			const baseCam = new THREE.Vector3();
			let narrow = isNarrow;
			function frame() {
				const w = host!.clientWidth;
				const h = host!.clientHeight;
				narrow = w < 768;
				renderer.setSize(w, h, false);
				camera.aspect = w / h;
				camera.fov = narrow ? 38 : 28;
				const vHalf = THREE.MathUtils.degToRad(camera.fov) / 2;
				const hHalf = Math.atan(Math.tan(vHalf) * camera.aspect);
				const r = 4.3;
				const dist = Math.max(
					r / ((narrow ? 1.3 : 0.58) * Math.tan(hHalf)),
					r / ((narrow ? 0.7 : 0.95) * Math.tan(vHalf))
				);
				baseCam.copy(deskCenter).addScaledVector(viewDir, dist);
				camera.position.copy(baseCam);
				camera.lookAt(deskCenter);
				if (narrow) camera.setViewOffset(w, h, 0, -h * 0.24, w, h);
				else camera.setViewOffset(w, h, -w * 0.245, h * 0.04, w, h);
				camera.updateProjectionMatrix();
			}
			frame();
			const ro = new ResizeObserver(frame);
			ro.observe(host);

			// ---------- interaction ----------
			const raycaster = new THREE.Raycaster();
			const ndc = new THREE.Vector2(9, 9);
			let pointerInside = false;
			const hover = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.95);
			const hit = new THREE.Vector3();
			const rest = new THREE.Vector3(0.05, 0.95, 0.05);
			const glassTarget = rest.clone();
			glass.position.copy(rest);
			const vel = new THREE.Vector3();
			let coverOpen = true;
			let coverAngle = 0.02; // closed at start; the intro opens it
			let coverTarget = reduced ? 1.95 : 0.02;
			if (reduced) coverAngle = 1.95;

			function updatePointer(e: PointerEvent) {
				const r = canvasEl!.getBoundingClientRect();
				ndc.set(
					((e.clientX - r.left) / r.width) * 2 - 1,
					-((e.clientY - r.top) / r.height) * 2 + 1
				);
				pointerInside = e.clientY >= r.top && e.clientY <= r.bottom;
			}
			const onMove = (e: PointerEvent) => {
				updatePointer(e);
				raycaster.setFromCamera(ndc, camera);
				hoverFile = raycaster.intersectObjects([back, dossier, cover], false).length > 0;
			};
			const onLeave = () => {
				pointerInside = false;
				hoverFile = false;
			};
			const onClick = (e: MouseEvent) => {
				updatePointer(e as PointerEvent);
				raycaster.setFromCamera(ndc, camera);
				if (raycaster.intersectObjects([back, dossier, cover], false).length) {
					coverOpen = !coverOpen;
					coverTarget = coverOpen ? 1.95 : 0.02;
				}
			};
			host.addEventListener('pointermove', onMove, { passive: true });
			host.addEventListener('pointerleave', onLeave);
			host.addEventListener('click', onClick);

			let heroProgress = 0;
			const onScroll = () => {
				const r = host!.getBoundingClientRect();
				heroProgress = Math.min(1, Math.max(0, -r.top / r.height));
			};
			window.addEventListener('scroll', onScroll, { passive: true });

			let visible = true;
			const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting));
			io.observe(host);

			// ---------- render loop ----------
			const clock = new THREE.Timer();
			const start = performance.now();
			let lampLevel = reduced ? 1 : 0;

			function lampCurve(ms: number) {
				// Off → two flickers → steady, then the cover swings open.
				if (ms < 350) return 0;
				if (ms < 420) return 0.7;
				if (ms < 520) return 0.1;
				if (ms < 600) return 0.9;
				if (ms < 680) return 0.3;
				return Math.min(1, 0.3 + (ms - 680) / 260);
			}

			function render() {
				clock.update();
				const dt = Math.min(clock.getDelta(), 0.05);
				const t = clock.getElapsed();
				const ms = performance.now() - start;

				if (!reduced) {
					lampLevel = lampCurve(ms);
					if (ms > 800 && coverOpen && coverTarget < 1) coverTarget = 1.95;
				}
				const dim = 1 - heroProgress * 0.85;
				const L = lampLevel * dim;
				spot.intensity = (dark ? 70 : 38) * L;
				glow.intensity = (dark ? 2.2 : 1.2) * L;
				bulbMat.emissiveIntensity = 3.2 * L;

				// Cover: critically-damped approach, a hair of overshoot on opening.
				coverAngle += (coverTarget - coverAngle) * (reduced ? 1 : Math.min(1, dt * 5.5));
				hinge.rotation.x = -coverAngle;

				// Magnifier follows the pointer across the desk plane; rests otherwise.
				if (!reduced && pointerInside) {
					raycaster.setFromCamera(ndc, camera);
					if (raycaster.ray.intersectPlane(hover, hit)) {
						const local = file.worldToLocal(hit.clone());
						local.x = Math.max(-FW / 2 + 0.2, Math.min(FW / 2 - 0.2, local.x));
						local.z = Math.max(-FD / 2 + 0.2, Math.min(FD / 2 - 0.1, local.z));
						glassTarget.copy(file.localToWorld(local)).setY(0.95);
					}
				} else if (!reduced) {
					glassTarget.set(
						rest.x + Math.sin(t * 0.5) * 0.25,
						rest.y + Math.sin(t * 1.1) * 0.05,
						rest.z + Math.cos(t * 0.4) * 0.15
					);
				}
				const before = glass.position.clone();
				glass.position.lerp(glassTarget, reduced ? 1 : Math.min(1, dt * 7));
				vel.subVectors(glass.position, before).divideScalar(Math.max(dt, 1e-3));
				// Lean into the motion like a hand would.
				glass.rotation.z += (-vel.x * 0.05 - glass.rotation.z) * 0.12;
				glass.rotation.x += (vel.z * 0.05 - glass.rotation.x) * 0.12;

				// Its shadow slides away from the lamp and softens with height.
				glassShadow.position.set(glass.position.x + 0.35, 0.05, glass.position.z + 0.3);
				const lift01 = THREE.MathUtils.clamp((glass.position.y - 0.6) / 0.8, 0, 1);
				glassShadow.scale.setScalar(0.9 + lift01 * 0.4);
				(glassShadow.material as InstanceType<typeof THREE.MeshBasicMaterial>).opacity =
					(dark ? 0.75 : 0.45) * (1 - lift01 * 0.4);

				// Scroll lifts the camera off the desk as the hero leaves.
				camera.position.copy(baseCam).setY(baseCam.y + heroProgress * 2.5);
				camera.lookAt(deskCenter);

				// Loupe: film the desk straight down the lens axis with a narrowed field of view.
				loupe.updateWorldMatrix(true, false);
				loupe.getWorldPosition(loupeCam.position);
				loupe.getWorldQuaternion(loupeCam.quaternion);
				const height = Math.max(0.3, loupeCam.position.y - 0.04);
				loupeCam.fov = THREE.MathUtils.radToDeg(2 * Math.atan(R / MAGNIFY / height));
				loupeCam.updateProjectionMatrix();
				renderer.setRenderTarget(loupeTarget);
				renderer.render(scene, loupeCam);
				renderer.setRenderTarget(null);

				renderer.render(scene, camera);
			}

			function loop() {
				if (visible && !document.hidden) render();
				if (!destroyed) rafId = requestAnimationFrame(loop);
			}
			if (reduced) {
				render();
				ro.disconnect();
				const ro2 = new ResizeObserver(() => {
					frame();
					render();
				});
				ro2.observe(host);
				cleanupExtra = () => ro2.disconnect();
			} else {
				rafId = requestAnimationFrame(loop);
			}
			ready = true;

			cleanup = () => {
				cleanupExtra?.();
				themeObserver.disconnect();
				ro.disconnect();
				io.disconnect();
				host?.removeEventListener('pointermove', onMove);
				host?.removeEventListener('pointerleave', onLeave);
				host?.removeEventListener('click', onClick);
				window.removeEventListener('scroll', onScroll);
				scene.traverse((o) => {
					if (o instanceof THREE.Mesh) {
						o.geometry.dispose();
						const mats = Array.isArray(o.material) ? o.material : [o.material];
						for (const m of mats) m.dispose();
					}
				});
				for (const tex of [
					dossierTex,
					coverTex,
					insideTex,
					envTex,
					vignette,
					blobTex,
					slabTex,
					leatherTex
				])
					tex.dispose();
				loupeTarget.dispose();
				renderer.dispose();
			};
		})();

		return () => {
			destroyed = true;
			cancelAnimationFrame(rafId);
			cleanup?.();
		};
	});
</script>

<div
	bind:this={host}
	class="desk absolute inset-0"
	class:cursor-pointer={hoverFile}
	aria-hidden="true"
>
	<canvas
		bind:this={canvasEl}
		class="h-full w-full transition-opacity duration-700 ease-out"
		style:opacity={ready ? 1 : 0}
	></canvas>
</div>
