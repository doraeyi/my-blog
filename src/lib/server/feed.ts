/**
 * Just enough RSS / Atom / HTML-head parsing for friend links: pull the latest
 * posts out of a feed, and a site's title, description, icon and feed URL out
 * of its homepage. Regex-based on purpose — feeds in the wild are rarely valid
 * XML, and a forgiving reader beats a strict one here.
 */

export interface FeedItem {
	title: string;
	url: string;
	summary: string | null;
	publishedAt: Date;
	/** The item's full HTML (content or description), for finding links in it. */
	html: string;
}

const ENTITIES: Record<string, string> = {
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	apos: "'",
	nbsp: ' '
};

export function decodeEntities(s: string): string {
	return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code: string) => {
		if (code[0] === '#') {
			const n =
				code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : Number(code.slice(1));
			return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m;
		}
		return ENTITIES[code.toLowerCase()] ?? m;
	});
}

function unwrap(s: string): string {
	const cdata = s.match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
	return cdata ? cdata[1] : decodeEntities(s);
}

/** Visible text of an HTML fragment, collapsed and clipped. */
export function plainText(html: string, max = 160): string {
	const text = decodeEntities(
		html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')
	)
		.replace(/\s+/g, ' ')
		.trim();
	return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function tag(block: string, name: string): string | null {
	const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
	return m ? unwrap(m[1]).trim() : null;
}

function attr(el: string, name: string): string | null {
	const m = el.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'));
	return m ? decodeEntities(m[2] ?? m[3] ?? '').trim() : null;
}

function absolute(href: string | null, base: string): string | null {
	if (!href) return null;
	try {
		const u = new URL(href, base);
		return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null;
	} catch {
		return null;
	}
}

export function looksLikeFeed(body: string): boolean {
	return /<(rss|feed|rdf:RDF)[\s>]/i.test(body.slice(0, 2000));
}

export function parseFeed(xml: string, base: string, limit = 10): FeedItem[] {
	const atom = /<feed[\s>]/i.test(xml.slice(0, 2000));
	const blocks =
		xml.match(atom ? /<entry[\s>][\s\S]*?<\/entry>/gi : /<item[\s>][\s\S]*?<\/item>/gi) ?? [];
	const items: FeedItem[] = [];
	for (const block of blocks) {
		const title = plainText(tag(block, 'title') ?? '', 200);
		let link: string | null;
		if (atom) {
			const links = block.match(/<link\b[^>]*>/gi) ?? [];
			const alt = links.find((l) => !attr(l, 'rel') || attr(l, 'rel') === 'alternate') ?? links[0];
			link = alt ? attr(alt, 'href') : null;
		} else {
			link = tag(block, 'link') || tag(block, 'guid');
		}
		const url = absolute(link, base);
		const dateText =
			tag(block, 'pubDate') ??
			tag(block, 'published') ??
			tag(block, 'updated') ??
			tag(block, 'dc:date');
		const publishedAt = dateText ? new Date(dateText) : null;
		if (!title || !url || !publishedAt || Number.isNaN(publishedAt.getTime())) continue;
		const raw = tag(block, 'description') ?? tag(block, 'summary') ?? tag(block, 'content');
		const full = tag(block, 'content:encoded') ?? tag(block, 'content') ?? raw ?? '';
		items.push({
			title,
			url,
			summary: raw ? plainText(raw, 160) || null : null,
			publishedAt,
			html: full
		});
	}
	return items.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()).slice(0, limit);
}

export interface SiteMeta {
	title: string | null;
	description: string | null;
	icon: string | null;
	feedUrl: string | null;
}

export function parseSiteMeta(html: string, base: string): SiteMeta {
	const head = html.slice(0, 200_000);
	const metas = head.match(/<meta\b[^>]*>/gi) ?? [];
	const meta = (key: string) => {
		const el = metas.find((m) => (attr(m, 'property') ?? attr(m, 'name'))?.toLowerCase() === key);
		return el ? attr(el, 'content') : null;
	};
	const links = head.match(/<link\b[^>]*>/gi) ?? [];
	const link = (test: (rel: string, type: string) => boolean) => {
		const el = links.find((l) =>
			test((attr(l, 'rel') ?? '').toLowerCase(), (attr(l, 'type') ?? '').toLowerCase())
		);
		return el ? absolute(attr(el, 'href'), base) : null;
	};
	const titleTag = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
	return {
		title: meta('og:site_name') ?? (titleTag ? plainText(titleTag[1], 60) : null),
		description: meta('description') ?? meta('og:description'),
		icon:
			link((rel) => rel.includes('apple-touch-icon')) ??
			link((rel, type) => rel.split(/\s+/).includes('icon') && !type.includes('svg')) ??
			link((rel) => rel.split(/\s+/).includes('icon')),
		feedUrl: link(
			(rel, type) => rel.includes('alternate') && /application\/(rss|atom)\+xml/.test(type)
		)
	};
}

/** Where feeds usually live when a site doesn't advertise one. */
export const FEED_GUESSES = ['/rss.xml', '/feed.xml', '/atom.xml', '/index.xml', '/feed', '/rss'];
