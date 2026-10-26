import { error } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { RequestHandler } from './$types';
import { backupDir } from '$lib/server/backup';

// Endpoints don't run the admin layout's load, so the owner check lives here.
export const GET: RequestHandler = async ({ params, locals }) => {
	if (locals.user?.role !== 'Liam') throw error(403, 'Forbidden');
	if (!/^blog-[\d-]+\.db\.gz$/.test(params.name)) throw error(404, 'Not found');
	let file: Buffer;
	try {
		file = await readFile(join(backupDir(), params.name));
	} catch {
		throw error(404, 'Not found');
	}
	return new Response(new Uint8Array(file), {
		headers: {
			'content-type': 'application/gzip',
			'content-disposition': `attachment; filename="${params.name}"`,
			'cache-control': 'no-store'
		}
	});
};
