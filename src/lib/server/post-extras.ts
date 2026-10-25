import type { RequestEvent } from '@sveltejs/kit';
import { contentKey, entryPath, getPostNav, type EntryKind } from '$lib/server/content-index';
import { recordView } from '$lib/server/services/views-service';
import { listFor as listMentions } from '$lib/server/services/webmention-service';

/** Everything a post page shows around the body: reading time, prev/next, series, related, views, mentions. */
export async function loadPostExtras(kind: EntryKind, slug: string, event: RequestEvent) {
	const [nav, views, mentions] = await Promise.all([
		getPostNav(kind, slug),
		recordView(contentKey(kind, slug), {
			id: event.locals.user?.id ?? event.getClientAddress(),
			userAgent: event.request.headers.get('user-agent') ?? '',
			isOwner: event.locals.user?.role === 'Liam'
		}),
		listMentions(entryPath(kind, slug))
	]);
	return { nav, views, mentions, ogImage: `/og/${kind}/${slug}` };
}
