import type { RequestHandler } from './$types';
import { recordHit } from '$lib/server/services/traffic-service';

/** Page-view beacon from the layout. Always 204, so it never shows up as an error. */
export const POST: RequestHandler = async ({ request, locals, url, getClientAddress }) => {
	if (locals.user?.role === 'Liam') return new Response(null, { status: 204 });
	try {
		const { p, r } = (await request.json()) as { p?: unknown; r?: unknown };
		if (typeof p === 'string') {
			await recordHit({
				path: p,
				referrer: typeof r === 'string' && r ? r : null,
				ip: getClientAddress(),
				userAgent: request.headers.get('user-agent') ?? '',
				ownHost: url.hostname
			});
		}
	} catch {
		// Malformed beacon; nothing to count.
	}
	return new Response(null, { status: 204 });
};
