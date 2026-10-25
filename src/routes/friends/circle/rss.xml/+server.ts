import type { RequestHandler } from './$types';
import { escapeXml } from '$lib/server/xml';
import { SITE_NAME } from '$lib/site';
import * as friendsService from '$lib/server/services/friends-service';

/** 朋友圈 as one feed: every friend's newest posts, credited to them. */
export const GET: RequestHandler = async ({ url }) => {
	const { members, posts } = await friendsService.listCircle(60);
	const names = new Map(members.map((m) => [m.id, m.name]));

	const items = posts
		.map(
			(p) => `<item>
<title>${escapeXml(`${p.title}（${names.get(p.friendId) ?? ''}）`)}</title>
<link>${escapeXml(p.url)}</link>
<guid isPermaLink="true">${escapeXml(p.url)}</guid>
<pubDate>${p.publishedAt.toUTCString()}</pubDate>
<dc:creator>${escapeXml(names.get(p.friendId) ?? '')}</dc:creator>
${p.summary ? `<description>${escapeXml(p.summary)}</description>` : ''}
</item>`
		)
		.join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
<title>${escapeXml(`${SITE_NAME} · 朋友圈`)}</title>
<link>${url.origin}/friends/circle</link>
<atom:link href="${url.origin}/friends/circle/rss.xml" rel="self" type="application/rss+xml" />
<description>朋友們最近寫的文章</description>
<language>zh-TW</language>
${items}
</channel>
</rss>`;

	return new Response(xml, {
		headers: {
			'content-type': 'application/rss+xml; charset=utf-8',
			'cache-control': 'public, max-age=1800'
		}
	});
};
