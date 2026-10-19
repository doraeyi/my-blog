import { error, json } from '@sveltejs/kit';
import { timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { recordHeartbeat } from '$lib/server/services/watch-service';

/**
 * Heartbeat from the "now watching" browser script:
 *   POST { title: string, episode?: number }
 *   Authorization: Bearer <NOW_WATCHING_TOKEN>
 * Only the token holder can report; the endpoint is off until the token is set.
 */
function authorized(header: string | null): boolean {
	const token = env.NOW_WATCHING_TOKEN;
	if (!token || !header?.startsWith('Bearer ')) return false;
	const given = Buffer.from(header.slice(7));
	const expected = Buffer.from(token);
	return given.length === expected.length && timingSafeEqual(given, expected);
}

export const POST: RequestHandler = async ({ request }) => {
	if (!env.NOW_WATCHING_TOKEN) throw error(503, 'NOW_WATCHING_TOKEN is not set');
	if (!authorized(request.headers.get('authorization'))) throw error(401, 'Unauthorized');

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Expected JSON');
	}
	const { title, episode } = (body ?? {}) as { title?: unknown; episode?: unknown };
	if (typeof title !== 'string' || !title.trim() || title.length > 200) {
		throw error(400, 'title is required');
	}
	const ep =
		typeof episode === 'number' && Number.isInteger(episode) && episode > 0 ? episode : null;

	try {
		const result = await recordHeartbeat(title.trim(), ep);
		return json({ ok: true, ...result, episode: ep });
	} catch (err) {
		throw error(404, err instanceof Error ? err.message : 'Could not resolve title');
	}
};
