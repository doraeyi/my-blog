/**
 * The site as a filing cabinet: each drawer is an index tab on the left edge,
 * and its items are the index cards inside. The cabinet nav, the mobile drawer
 * and the footer all read from here, so a page is registered once.
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
	label: string;
	href: string;
	/** Routes that count as "inside" this drawer (whole-segment match). */
	match: string[];
	cards: CabinetCard[];
}

export const drawers: Drawer[] = [
	{ id: 'cover', label: '封面', href: '/', match: ['/'], cards: [] },
	{
		id: 'cases',
		label: '案件簿',
		href: '/blog',
		match: ['/blog', '/articles', '/moods', '/tags', '/archive'],
		cards: [
			{ label: '全部案件', href: '/blog', note: '所有寫下的東西，依時間歸檔' },
			{ label: '技術文章', href: '/blog?cat=article', note: '前端、工具、踩過的坑' },
			{ label: '文章', href: '/blog?cat=blog', note: '比較長、比較完整的' },
			{ label: '心情', href: '/blog?cat=mood', note: '當下的狀態' },
			{ label: '標籤索引', href: '/tags', note: '依線索分類' },
			{ label: '時間軸', href: '/archive', note: '所有紀錄攤在一條線上' }
		]
	},
	{
		id: 'notes',
		label: '現場筆記',
		href: '/thinking',
		match: ['/thinking'],
		cards: []
	},
	{
		id: 'evidence',
		label: '證物室',
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
		id: 'files',
		label: '檔案室',
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
		id: 'testimony',
		label: '證詞',
		href: '/messages',
		match: ['/messages', '/friends'],
		cards: [
			{ label: '證詞', href: '/messages', note: '留言板，想說什麼都可以' },
			{ label: '線人名單', href: '/friends', note: '友站連結' }
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
