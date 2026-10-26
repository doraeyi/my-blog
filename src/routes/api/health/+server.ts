import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { client } from '$lib/server/db';

/** For the uptime check: 200 only when the app is up and the database answers. */
export const GET: RequestHandler = () => {
	try {
		client.prepare('select 1').get();
		return json({ ok: true }, { headers: { 'cache-control': 'no-store' } });
	} catch {
		return json({ ok: false }, { status: 503, headers: { 'cache-control': 'no-store' } });
	}
};
