import type { RequestHandler } from './$types';
import { listEntries, tagCounts } from '$lib/server/content-index';
import { listProjects } from '$lib/server/services/projects-service';
import { listWatched, getCurrentlyWatching } from '$lib/server/services/watch-service';
import { escapeXml } from '$lib/server/xml';

const staticPaths = [
	'/',
	'/about',
	'/now',
	'/archive',
	'/articles',
	'/moods',
	'/blog',
	'/tags',
	'/board',
	'/portfolio',
	'/watch',
	'/setup',
	'/bookshelf',
	'/thinking',
	'/about-site',
	'/messages',
	'/friends',
	'/history'
];

export const GET: RequestHandler = async ({ url }) => {
	const origin = url.origin;
	const [entries, tags, projects, watched, watching] = await Promise.all([
		listEntries(),
		tagCounts(),
		listProjects(),
		listWatched(),
		getCurrentlyWatching()
	]);

	const urls: { loc: string; lastmod?: Date }[] = [
		...staticPaths.map((p) => ({ loc: p })),
		...entries.map((e) => ({ loc: e.path, lastmod: e.updated })),
		...tags.map((t) => ({ loc: `/tags/${encodeURIComponent(t.tag)}` })),
		...projects.map((p) => ({ loc: `/portfolio/${p.id}`, lastmod: p.lastSyncedAt ?? undefined })),
		...[...(watching ? [watching] : []), ...watched].map((w) => ({ loc: `/watch/${w.id}` }))
	];

	const body = urls
		.map(
			(u) =>
				`<url><loc>${escapeXml(origin + u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod.toISOString()}</lastmod>` : ''}</url>`
		)
		.join('\n');

	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`,
		{
			headers: {
				'Content-Type': 'application/xml; charset=utf-8',
				'Cache-Control': 'public, max-age=3600'
			}
		}
	);
};
