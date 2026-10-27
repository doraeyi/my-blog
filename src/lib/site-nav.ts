/**
 * The site as Liam's book: each section is a chapter (a bookmark on the book,
 * a line on its contents page), and its items are the entries under it. The
 * office desk, the bookmarks, the contents page and the page chrome all read
 * from here, so a page is registered once.
 * Hrefs are plain app paths (some carry a query string).
 */

export interface CabinetCard {
	label: string;
	href: string;
	/** One typed line on the index card. */
	note: string;
}

export interface Drawer {
	id: string;
	/** The chapter's name in Liam's book: bookmarks, contents, page header. */
	label: string;
	/** Chapter number, 壹 to 伍 (the contents page itself has none). */
	no?: string;
	/** Its bookmark ribbon's colour. */
	color?: string;
	/** One line for the contents page when the chapter has no sub-entries. */
	blurb?: string;
	href: string;
	/** Routes that count as "inside" this drawer (whole-segment match). */
	match: string[];
	cards: CabinetCard[];
}

export const drawers: Drawer[] = [
	{ id: 'cover', label: '封面', href: '/', match: ['/'], cards: [] },
	{
		id: 'contents',
		label: '目錄',
		color: '#4a3a2a',
		href: '/contents',
		match: ['/contents'],
		cards: []
	},
	{
		id: 'files',
		label: '關於',
		no: '壹',
		color: '#2f6b4a',
		href: '/about',
		match: ['/about', '/now', '/about-site', '/history'],
		cards: [
			{ label: '人物檔案', href: '/about', note: '關於 Liam' },
			{ label: '近況', href: '/now', note: '這陣子在忙什麼' },
			{ label: '本站說明', href: '/about-site', note: '這個網站怎麼做的' },
			{ label: '結案紀錄', href: '/history', note: '網站走過的轉折' }
		]
	},
	{
		id: 'evidence',
		label: '作品收藏',
		no: '貳',
		color: '#b8860b',
		href: '/portfolio',
		match: ['/portfolio', '/watch', '/bookshelf', '/setup'],
		cards: [
			{ label: '證物', href: '/portfolio', note: '做過的專案' },
			{ label: '監視紀錄', href: '/watch', note: '最近在看的劇和電影' },
			{ label: '參考卷宗', href: '/bookshelf', note: '讀過、在讀、想讀的書' },
			{ label: '裝備清單', href: '/setup', note: '每天用的硬體和工具' }
		]
	},
	{
		id: 'cases',
		label: '文章',
		no: '參',
		color: '#8e1d12',
		href: '/blog',
		match: ['/blog', '/articles', '/moods', '/tags', '/archive', '/board', '/stats'],
		cards: [
			{ label: '全部案件', href: '/blog', note: '所有寫下的東西，依時間歸檔' },
			{ label: '技術文章', href: '/blog?cat=article', note: '前端、工具、踩過的坑' },
			{ label: '文章', href: '/blog?cat=blog', note: '比較長、比較完整的' },
			{ label: '心情', href: '/blog?cat=mood', note: '當下的狀態' },
			{ label: '證物牆', href: '/board', note: '所有文章用紅線串起共同線索' },
			{ label: '標籤索引', href: '/tags', note: '依線索分類' },
			{ label: '時間軸', href: '/archive', note: '所有紀錄攤在一條線上' },
			{ label: '案件統計', href: '/stats', note: '寫了多少、什麼時候寫' }
		]
	},
	{
		id: 'notes',
		label: '筆記',
		no: '肆',
		color: '#2b4c9b',
		blurb: '現場筆記：短句、隨手記，想到什麼寫什麼。',
		href: '/thinking',
		match: ['/thinking'],
		cards: []
	},
	{
		id: 'testimony',
		label: '留言',
		no: '伍',
		color: '#5b3a8a',
		href: '/messages',
		match: ['/messages', '/friends'],
		cards: [
			{ label: '證詞', href: '/messages', note: '留言板，想說什麼都可以' },
			{ label: '線人名單', href: '/friends', note: '友站連結' },
			{ label: '朋友圈', href: '/friends/circle', note: '朋友們最近寫了什麼' }
		]
	}
];

/** Whole-segment match, so "/about" doesn't claim "/about-site". */
export function onRoute(path: string, route: string): boolean {
	return route === '/' ? path === '/' : path === route || path.startsWith(`${route}/`);
}

export function drawerFor(path: string): Drawer | undefined {
	// Most specific match wins ("/about-site" before "/about").
	let best: Drawer | undefined;
	let bestLen = -1;
	for (const d of drawers) {
		for (const m of d.match) {
			if (onRoute(path, m) && m.length > bestLen) {
				best = d;
				bestLen = m.length;
			}
		}
	}
	return best;
}

/** Category keys for the case-book filters (`/blog?cat=`). */
export const noteCategories = [
	{ key: 'all', label: '全部' },
	{ key: 'article', label: '技術文章' },
	{ key: 'blog', label: '文章' },
	{ key: 'mood', label: '心情' }
] as const;

export type NoteCategory = (typeof noteCategories)[number]['key'];

/** First commit of this repo — the case was opened that day. */
export const SITE_LAUNCHED_AT = new Date('2026-08-07T00:00:00+08:00');

/** The bookmarks in Liam's book (home desk and every inner page): 目錄 first, then the chapters. */
export const bookmarks = drawers
	.filter((d) => d.id !== 'cover')
	.map((d) => ({ ...d, color: d.color ?? '#8e1d12' }));

/** The chapters, as the contents page lists them. */
export const chapters = drawers.filter((d) => d.no);

/** Is this entry (some carry a ?query) the page being shown? */
export function isEntryActive(url: URL, href: string): boolean {
	const [path, query] = href.split('?');
	if (query) return url.pathname === path && url.search === `?${query}`;
	if (path === '/blog') return url.pathname === '/blog' && !url.searchParams.get('cat');
	return onRoute(url.pathname, path);
}
