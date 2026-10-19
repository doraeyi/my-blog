import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { kindLabel, listEntries } from '$lib/server/content-index';
import { listProjects } from '$lib/server/services/projects-service';
import { getCurrentlyWatching, listWatched } from '$lib/server/services/watch-service';
import type { SearchDoc } from '$lib/search.svelte';

const pages: SearchDoc[] = [
	{ type: '頁面', title: '首頁', path: '/', text: '' },
	{ type: '頁面', title: '關於我', path: '/about', text: '李俊逸 前端工程師 MSI 微星科技' },
	{ type: '頁面', title: '現在 Now', path: '/now', text: '最近在做 在學 在看' },
	{ type: '頁面', title: '案件時間軸', path: '/archive', text: '歸檔 archive timeline' },
	{ type: '頁面', title: '標籤', path: '/tags', text: 'tags' },
	{ type: '頁面', title: '作品集', path: '/portfolio', text: 'portfolio projects' },
	{ type: '頁面', title: '追劇紀錄', path: '/watch', text: 'watch movies tv' }
];

export const GET: RequestHandler = async () => {
	const [entries, projects, watching, watched] = await Promise.all([
		listEntries(),
		listProjects(),
		getCurrentlyWatching(),
		listWatched()
	]);

	const docs: SearchDoc[] = [
		...entries.map((e) => ({
			type: kindLabel[e.kind],
			title: e.title,
			path: e.path,
			tags: e.tags,
			excerpt: e.excerpt ?? undefined,
			text: e.text.slice(0, 6000)
		})),
		...projects.map((p) => ({
			type: '作品',
			title: p.githubRepo,
			path: `/portfolio/${p.id}`,
			excerpt: p.description ?? undefined,
			text: ''
		})),
		...[...(watching ? [watching] : []), ...watched].map((w) => ({
			type: '追劇',
			title: w.title,
			path: `/watch/${w.id}`,
			excerpt: w.overview ?? undefined,
			text: ''
		})),
		...pages
	];

	return json(docs, { headers: { 'Cache-Control': 'public, max-age=300' } });
};
