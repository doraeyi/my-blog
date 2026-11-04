import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { kindLabel, listEntries } from '$lib/server/content-index';
import { listProjects } from '$lib/server/services/projects-service';
import { getCurrentlyWatching, listWatched } from '$lib/server/services/watch-service';
import { PAGE, type SearchDoc } from '$lib/search.svelte';
import { drawers, entryName } from '$lib/site-nav';

// Every page in the site's chapters, findable by what it is in plain words
// ("劇" finds 監視紀錄) as well as by its case-file name.
const pages: SearchDoc[] = drawers
	.filter((d) => d.id !== 'cover')
	.flatMap((d) => {
		const own: SearchDoc[] = d.cards.length
			? []
			: [
					{
						type: PAGE,
						title: d.label,
						path: d.href,
						excerpt: d.blurb ?? d.plain,
						tags: d.keywords?.split(' '),
						text: ''
					}
				];
		return [
			...own,
			...d.cards.map((c) => {
				const { plain, label } = entryName(c);
				return {
					type: PAGE,
					title: label ? `${plain} · ${label}` : plain,
					path: c.href,
					excerpt: `${d.label} › ${c.note}`,
					tags: c.keywords?.split(' '),
					text: ''
				};
			})
		];
	});

export const GET: RequestHandler = async () => {
	const [entries, projects, watching, watched] = await Promise.all([
		listEntries(),
		listProjects(),
		getCurrentlyWatching(),
		listWatched()
	]);

	const docs: SearchDoc[] = [
		...pages,
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
		}))
	];

	return json(docs, { headers: { 'Cache-Control': 'public, max-age=300' } });
};
