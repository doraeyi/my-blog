import type { RequestEvent } from '@sveltejs/kit';
import { contentKey, getPostNav, type EntryKind } from '$lib/server/content-index';
import { recordView } from '$lib/server/services/views-service';

/** Everything a post page shows around the body: reading time, prev/next, series, related, views. */
export async function loadPostExtras(kind: EntryKind, slug: string, event: RequestEvent) {
	const [nav, views] = await Promise.all([
		getPostNav(kind, slug),
		recordView(contentKey(kind, slug), {
			id: event.locals.user?.id ?? event.getClientAddress(),
			userAgent: event.request.headers.get('user-agent') ?? '',
			isOwner: event.locals.user?.role === 'Liam'
		})
	]);
	return { nav, views, ogImage: `/og/${kind}/${slug}` };
}
