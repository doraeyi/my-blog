<!--
	Dev-only: renders every 3D gear item as a poster still plus a turntable strip
	(SPIN_FRAMES frames side by side) and saves them to static/gear/. Open
	/dev/gear-shots on the dev server after adding or changing a model.
-->
<script lang="ts">
	import { gear, type GearItem, type GearModel } from '$lib/collections';
	import GearModelView from '$lib/components/GearModelView.svelte';
	import {
		SHOT_H,
		SHOT_W,
		SPIN_FRAMES,
		gearSlug,
		spinYaw,
		type Shoot
	} from '$lib/gear-shots';

	type Modelled = GearItem & { model: GearModel };
	const items = gear.flatMap((g) => g.items).filter((i): i is Modelled => !!i.model);

	let current = $state<Modelled | null>(null);
	let log = $state<string[]>([]);
	let done = $state(false);
	let gotShoot: ((s: Shoot) => void) | null = null;

	const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
	const loadImg = (src: string) =>
		new Promise<HTMLImageElement>((res, rej) => {
			const img = new Image();
			img.onload = () => res(img);
			img.onerror = rej;
			img.src = src;
		});

	/** Union of the opaque pixels across all frames, padded and widened to the 4:3 card shape. */
	function cropRect(frames: HTMLImageElement[]): [number, number, number, number] {
		const w = frames[0].naturalWidth;
		const h = frames[0].naturalHeight;
		const c = document.createElement('canvas');
		c.width = w;
		c.height = h;
		const ctx = c.getContext('2d', { willReadFrequently: true })!;
		let [x0, y0, x1, y1] = [w, h, 0, 0];
		for (const f of frames) {
			ctx.clearRect(0, 0, w, h);
			ctx.drawImage(f, 0, 0);
			const a = ctx.getImageData(0, 0, w, h).data;
			for (let y = 0; y < h; y += 2) {
				for (let x = 0; x < w; x += 2) {
					if (a[(y * w + x) * 4 + 3] > 10) {
						if (x < x0) x0 = x;
						if (x > x1) x1 = x;
						if (y < y0) y0 = y;
						if (y > y1) y1 = y;
					}
				}
			}
		}
		const pad = 0.08;
		let cw = (x1 - x0) * (1 + pad * 2);
		let ch = (y1 - y0) * (1 + pad * 2);
		const aspect = SHOT_W / SHOT_H;
		if (cw / ch > aspect) ch = cw / aspect;
		else cw = ch * aspect;
		return [(x0 + x1) / 2 - cw / 2, (y0 + y1) / 2 - ch / 2, cw, ch];
	}

	async function save(file: string, canvas: HTMLCanvasElement) {
		const res = await fetch('/dev/gear-shots', {
			method: 'PUT',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ file, dataUrl: canvas.toDataURL('image/webp', 0.86) })
		});
		const out = await res.json();
		log = [...log, `${file} · ${Math.round(out.bytes / 1024)} KB`];
	}

	async function run() {
		for (const item of items) {
			const shootReady = new Promise<Shoot>((r) => (gotShoot = r));
			current = item;
			const shoot = await shootReady;
			// Let textures, fonts and any swapped-in GLB settle before the first frame.
			await wait(2500);
			const slug = gearSlug(item.name);
			const frames = [];
			for (let i = 0; i < SPIN_FRAMES; i++) frames.push(await loadImg(shoot(spinYaw(item.model, i))));

			// One crop for every frame (the union of what the object covers), so it
			// sits centred in the card and doesn't jump between frames.
			const [sx, sy, sw, sh] = cropRect(frames);

			const poster = document.createElement('canvas');
			poster.width = SHOT_W;
			poster.height = SHOT_H;
			poster.getContext('2d')!.drawImage(frames[0], sx, sy, sw, sh, 0, 0, SHOT_W, SHOT_H);
			await save(`${slug}.webp`, poster);

			const strip = document.createElement('canvas');
			strip.width = SHOT_W * SPIN_FRAMES;
			strip.height = SHOT_H;
			const ctx = strip.getContext('2d')!;
			frames.forEach((f, i) => ctx.drawImage(f, sx, sy, sw, sh, i * SHOT_W, 0, SHOT_W, SHOT_H));
			await save(`${slug}-spin.webp`, strip);

			current = null;
			await wait(300);
		}
		done = true;
	}
</script>

<div class="mx-auto max-w-3xl space-y-4 p-8 text-ink">
	<h1 class="text-2xl font-bold">Gear stills</h1>
	<p class="text-sm text-ink-muted">
		{items.length} 件有 3D 模型。每件存一張 poster 和一條 {SPIN_FRAMES} 格的轉盤圖到 static/gear/。
	</p>
	<button
		type="button"
		class="rounded border border-border-case px-4 py-1.5"
		onclick={run}
		data-testid="run">開始拍</button
	>
	<!-- Fixed CSS-pixel size at DPR 1 so every frame comes out SHOT_W × SHOT_H. -->
	<div style:width="{SHOT_W}px" style:height="{SHOT_H}px" class="relative border border-border-case">
		{#if current}
			{#key current}
				<GearModelView model={current.model} label={current.name} onshoot={(s) => gotShoot?.(s)} />
			{/key}
		{/if}
	</div>
	<ul class="font-mono-hack text-xs text-ink-muted">
		{#each log as line, i (i)}<li>{line}</li>{/each}
		{#if done}<li data-testid="done">完成</li>{/if}
	</ul>
</div>
