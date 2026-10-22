import { dev } from '$app/environment';
import { error, json } from '@sveltejs/kit';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { RequestHandler } from './$types';

const OUT_DIR = path.resolve('static/gear');

/** Writes one data-URL image into static/gear/. Dev server only. */
export const PUT: RequestHandler = async ({ request }) => {
	if (!dev) error(404, 'Not found');
	const { file, dataUrl } = (await request.json()) as { file: string; dataUrl: string };
	if (!/^[a-z0-9-]+\.webp$/.test(file)) error(400, 'bad file name');
	const m = /^data:image\/webp;base64,(.+)$/.exec(dataUrl);
	if (!m) error(400, 'expected a webp data URL');
	await mkdir(OUT_DIR, { recursive: true });
	const buf = Buffer.from(m[1], 'base64');
	await writeFile(path.join(OUT_DIR, file), buf);
	return json({ file, bytes: buf.length });
};
