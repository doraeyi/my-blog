import type { RequestHandler } from './$types';
import { listEntries, kindLabel } from '$lib/server/content-index';
import { escapeXml } from '$lib/server/xml';
import { SITE_DESCRIPTION, SITE_TITLE } from '$lib/site';

export const GET: RequestHandler = async ({ url }) => {
	const origin = url.origin;
	const entries = (await listEntries()).slice(0, 30);

	const items = entries
		.map((e) => {
			const link = `${origin}${e.path}`;
			const categories = [kindLabel[e.kind], ...e.tags]
				.map((c) => `<category>${escapeXml(c)}</category>`)
				.join('');
			return `<item>
<title>${escapeXml(e.title)}</title>
<link>${link}</link>
<guid isPermaLink="true">${link}</guid>
<pubDate>${e.date.toUTCString()}</pubDate>
<description>${escapeXml(e.excerpt ?? e.text.slice(0, 200))}</description>
${categories}
</item>`;
		})
		.join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${escapeXml(SITE_TITLE)}</title>
<link>${origin}/</link>
<description>${escapeXml(SITE_DESCRIPTION)}</description>
<language>zh-TW</language>
<atom:link href="${origin}/rss.xml" rel="self" type="application/rss+xml"/>
${entries[0] ? `<lastBuildDate>${entries[0].updated.toUTCString()}</lastBuildDate>` : ''}
${items}
</channel>
</rss>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/rss+xml; charset=utf-8',
			'Cache-Control': 'public, max-age=600'
		}
	});
};
