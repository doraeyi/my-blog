import type { RequestHandler } from './$types';
import { escapeXml } from '$lib/server/xml';
import { SITE_NAME } from '$lib/site';
import * as friendsService from '$lib/server/services/friends-service';

/** Every friend's feed in one OPML file, ready to import into an RSS reader. */
export const GET: RequestHandler = async ({ url }) => {
	const friends = (await friendsService.listPublic()).filter((f) => f.feedUrl);
	const outlines = friends
		.map(
			(f) =>
				`<outline type="rss" text="${escapeXml(f.name)}" title="${escapeXml(f.name)}" xmlUrl="${escapeXml(f.feedUrl!)}" htmlUrl="${escapeXml(f.url)}" />`
		)
		.join('\n');

	const opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
<head>
<title>${escapeXml(`${SITE_NAME} 的朋友們`)}</title>
<dateCreated>${new Date().toUTCString()}</dateCreated>
<docs>${url.origin}/friends</docs>
</head>
<body>
<outline text="${escapeXml(SITE_NAME)}" title="${escapeXml(SITE_NAME)}" type="rss" xmlUrl="${url.origin}/rss.xml" htmlUrl="${url.origin}" />
${outlines}
</body>
</opml>`;

	return new Response(opml, {
		headers: {
			'content-type': 'text/x-opml; charset=utf-8',
			'content-disposition': 'inline; filename="friends.opml"',
			'cache-control': 'public, max-age=3600'
		}
	});
};
