/**
 * The site as Liam's case board: each section is a chapter (a card on the
 * board, a line on its contents page), and its items are the entries under it.
 * The board, the contents page and the page chrome all read from here, so a
 * page is registered once.
 * Hrefs are plain app paths (some carry a query string).
 */

export interface CabinetCard {
	label: string;
	href: string;
	/** One typed line on the index card. */
	note: string;
	/** What the page is in plain words, shown before its case-file name (omit when the label already says it). */
	plain?: string;
	/** Words a visitor might search for to find the page. */
	keywords?: string;
}

export interface Drawer {
	id: string;
	/** The chapter's name in Liam's book: bookmarks, contents, page header. */
	label: string;
	/** Chapter number, 壹 to 伍 (the contents page itself has none). */
	no?: string;
	/** Its bookmark ribbon's colour. */
	color?: string;
	/** Words a visitor might search for to find the chapter's page. */
	keywords?: string;
	/** One line for the contents page when the chapter has no sub-entries. */
	blurb?: string;
	/** What's in the chapter, in plain words (the board's cards say this under the name). */
	plain?: string;
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
		plain: '我是誰、最近在忙什麼、這個網站的故事',
		no: '壹',
		color: '#2f6b4a',
		href: '/about',
		match: ['/about', '/now', '/about-site', '/history'],
		cards: [
			{
				label: '人物檔案',
				plain: '關於我',
				href: '/about',
				note: '關於 Liam',
				keywords: '自我介紹 經歷 履歷 李俊逸 前端工程師 MSI 微星 about'
			},
			{
				label: '近況',
				plain: '最近在忙',
				href: '/now',
				note: '這陣子在忙什麼',
				keywords: 'now 現在 在做 在學 在看 近況'
			},
			{
				label: '本站說明',
				plain: '網站怎麼做的',
				href: '/about-site',
				note: '這個網站怎麼做的',
				keywords: '技術 架構 sveltekit 部署 本站 colophon'
			},
			{
				label: '結案紀錄',
				plain: '網站改版史',
				href: '/history',
				note: '網站走過的轉折',
				keywords: '歷史 改版 更新 版本 changelog history'
			}
		]
	},
	{
		id: 'evidence',
		label: '作品收藏',
		plain: '做過的專案、在看的劇、讀的書、每天用的裝備',
		no: '貳',
		color: '#b8860b',
		href: '/portfolio',
		match: ['/portfolio', '/watch', '/bookshelf', '/setup'],
		cards: [
			{
				label: '證物',
				plain: '做過的專案',
				href: '/portfolio',
				note: '寫過的程式和 side project',
				keywords: '作品 作品集 專案 portfolio project github side project'
			},
			{
				label: '監視紀錄',
				plain: '在看的劇',
				href: '/watch',
				note: '最近在看的劇和電影',
				keywords: '追劇 劇 影集 電影 動畫 動漫 日劇 韓劇 美劇 watch movie tv anime'
			},
			{
				label: '參考卷宗',
				plain: '書櫃',
				href: '/bookshelf',
				note: '讀過、在讀、想讀的書',
				keywords: '書 讀書 閱讀 書單 小說 book reading'
			},
			{
				label: '裝備清單',
				plain: '我的裝備',
				href: '/setup',
				note: '每天用的硬體和工具',
				keywords: '裝備 電腦 鍵盤 滑鼠 螢幕 軟體 工具 app setup uses'
			}
		]
	},
	{
		id: 'cases',
		label: '文章',
		plain: '技術文章、長文和心情，可依時間或標籤找',
		no: '參',
		color: '#8e1d12',
		href: '/blog',
		match: ['/blog', '/articles', '/moods', '/tags', '/archive', '/board', '/stats'],
		cards: [
			{
				label: '全部案件',
				plain: '所有文章',
				href: '/blog',
				note: '所有寫下的東西，依時間排',
				keywords: '文章 部落格 blog posts 全部'
			},
			{
				label: '技術文章',
				href: '/blog?cat=article',
				note: '前端、工具、踩過的坑',
				keywords: '技術 前端 程式 coding 教學 筆記'
			},
			{
				label: '文章',
				plain: '長文',
				href: '/blog?cat=blog',
				note: '比較長、比較完整的',
				keywords: '長文 文章 散文'
			},
			{
				label: '心情',
				href: '/blog?cat=mood',
				note: '當下的狀態',
				keywords: '心情 日記 碎碎念 mood'
			},
			{
				label: '證物牆',
				plain: '文章關聯圖',
				href: '/board',
				note: '用紅線把相關的文章串起來',
				keywords: '關聯 紅線 圖 graph 連結'
			},
			{
				label: '標籤索引',
				plain: '依標籤找',
				href: '/tags',
				note: '依主題分類',
				keywords: '標籤 分類 主題 tags'
			},
			{
				label: '時間軸',
				plain: '依時間找',
				href: '/archive',
				note: '所有紀錄攤在一條線上',
				keywords: '時間軸 歸檔 年份 archive timeline'
			},
			{
				label: '案件統計',
				plain: '寫作統計',
				href: '/stats',
				note: '寫了多少、什麼時候寫',
				keywords: '統計 數據 字數 stats'
			}
		]
	},
	{
		id: 'notes',
		label: '筆記',
		no: '肆',
		color: '#2b4c9b',
		blurb: '現場筆記：短句、隨手記，想到什麼寫什麼。',
		keywords: '筆記 短句 隨手記 想法 thinking',
		href: '/thinking',
		match: ['/thinking'],
		cards: []
	},
	{
		id: 'testimony',
		label: '留言',
		plain: '留言板、友站連結、朋友們的新文章',
		no: '伍',
		color: '#5b3a8a',
		href: '/messages',
		match: ['/messages', '/friends'],
		cards: [
			{
				label: '證詞',
				plain: '留言板',
				href: '/messages',
				note: '想說什麼都可以',
				keywords: '留言 留言板 訪客 guestbook'
			},
			{
				label: '線人名單',
				plain: '友站連結',
				href: '/friends',
				note: '朋友的網站，也可以申請交換',
				keywords: '友站 友鏈 朋友 交換連結 friends links'
			},
			{
				label: '朋友圈',
				plain: '朋友的新文章',
				href: '/friends/circle',
				note: '朋友們最近寫了什麼',
				keywords: '朋友 動態 rss 訂閱 新文章'
			}
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

/** A page's name the way a visitor would say it, then its name in the case file. */
export function entryName(c: CabinetCard): { plain: string; label?: string } {
	return c.plain && c.plain !== c.label ? { plain: c.plain, label: c.label } : { plain: c.label };
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
