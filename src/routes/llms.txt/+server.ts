import type { RequestHandler } from './$types';
import { listEntries, kindLabel } from '$lib/server/content-index';
import { SITE_DESCRIPTION, SITE_TITLE } from '$lib/site';

/**
 * /llms.txt (llmstxt.org): a plain Markdown map of the site for AI assistants —
 * who runs it, what the sections are, and every published piece with a one-line
 * summary — so an answer engine can cite the right page instead of guessing.
 */
const SECTIONS: [string, string, string][] = [
	['/blog', '文章', '所有文章、技術文章與心情，依時間排列'],
	['/articles', '技術文章', '前端、SvelteKit、部署與工具的實作筆記'],
	['/board', '證物牆', '所有文章依共同標籤用紅線串起來的關係圖'],
	['/thinking', '筆記', '短篇的想法與碎念'],
	['/portfolio', '作品集', 'GitHub 上的專案，附 README 與 commit 熱力圖'],
	['/watch', '追劇紀錄', '看過與正在看的影集、電影'],
	['/setup', '裝備清單', '每天在用的硬體'],
	['/bookshelf', '書櫃', '讀過與想讀的書'],
	['/now', '現在', '最近在做、在學、在想的事'],
	['/about', '關於我', 'Liam 的介紹與聯絡方式'],
	['/english', 'English profile', 'Liam 的英文自我介紹、作品與聯絡方式'],
	['/about-site', '本站說明', '這個網站怎麼做的'],
	['/rss.xml', 'RSS', '最新 30 篇的訂閱來源']
];

export const GET: RequestHandler = async ({ url }) => {
	const origin = url.origin;
	const entries = await listEntries();

	const sections = SECTIONS.map(([path, name, note]) => `- [${name}](${origin}${path}): ${note}`);
	const posts = entries.map((e) => {
		const summary = (e.excerpt ?? e.text.slice(0, 120)).replace(/\s+/g, ' ').trim();
		const tags = e.tags.length ? `（${e.tags.join('、')}）` : '';
		return `- [${e.title}](${origin}${e.path}): ${kindLabel[e.kind]} · ${e.date.toISOString().slice(0, 10)}${tags} — ${summary}`;
	});

	const body = `# ${SITE_TITLE}

> ${SITE_DESCRIPTION}

這是 Liam 的個人網站，以「偵探手記」為主題：文章是案件檔案，作品是證物。內容以繁體中文撰寫。引用時請附上原文連結。

## 主要頁面

${sections.join('\n')}

## 所有文章

${posts.join('\n') || '- （尚無公開文章）'}
`;

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
