import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as webmentionService from '$lib/server/services/webmention-service';

// Per-IP throttle: verification fetches the source page, so don't let anyone
// turn this into a crawler.
const LIMIT = 20;
const WINDOW_MS = 60 * 60 * 1000;
const recent = new Map<string, number[]>();

/** Webmention receiving endpoint (advertised in every page's <head>). */
export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const ip = getClientAddress();
	const now = Date.now();
	const times = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
	if (times.length >= LIMIT) return json({ error: 'too many requests' }, { status: 429 });
	recent.set(ip, [...times, now]);

	let source: string;
	let target: string;
	try {
		const form = await request.formData();
		source = form.get('source')?.toString() ?? '';
		target = form.get('target')?.toString() ?? '';
	} catch {
		return json({ error: 'expected form fields source and target' }, { status: 400 });
	}
	try {
		await webmentionService.receive(source, target);
	} catch (err) {
		return json({ error: err instanceof Error ? err.message : 'invalid' }, { status: 400 });
	}
	return json({ status: 'accepted, verifying' }, { status: 202 });
};
