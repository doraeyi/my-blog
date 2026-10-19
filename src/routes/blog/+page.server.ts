import type { PageServerLoad } from './$types';
import { listEntries, kindLabel, type EntryKind } from '$lib/server/content-index';
import { countsFor } from '$lib/server/services/views-service';
import * as commentsService from '$lib/server/services/comments-service';
import * as likesService from '$lib/server/services/likes-service';

const KINDS: EntryKind[] = ['article', 'blog', 'mood'];
const SORTS = ['new', 'old', 'hot'] as const;
type Sort = (typeof SORTS)[number];

/**
 * 手記 — every piece of writing (Markdown posts, articles, moods) in one
 * timeline. Category / tag / sort live in the URL so filtered views are
 * shareable and work without JS.
 */
export const load: PageServerLoad = async ({ url }) => {
	const catParam = url.searchParams.get('cat');
	const cat = KINDS.includes(catParam as EntryKind) ? (catParam as EntryKind) : null;
	const tag = url.searchParams.get('tag');
	const sortParam = url.searchParams.get('sort');
	const sort: Sort = SORTS.includes(sortParam as Sort) ? (sortParam as Sort) : 'new';

	const entries = await listEntries();
	const [views, comments, likes] = await Promise.all([
		countsFor(entries.map((e) => e.key)),
		commentsService.countsByKey(),
		likesService.countsByKey()
	]);

	const all = entries.map((e) => ({
		kind: e.kind,
		kindLabel: kindLabel[e.kind],
		path: e.path,
		title: e.title,
		excerpt: e.excerpt || e.text.slice(0, 140),
		date: e.date,
		tags: e.tags,
		views: views.get(e.key) ?? 0,
		comments: comments.get(e.key) ?? 0,
		likes: likes.get(e.key) ?? 0
	}));

	let list = all.filter((e) => (!cat || e.kind === cat) && (!tag || e.tags.includes(tag)));
	if (sort === 'old') list = list.reverse();
	if (sort === 'hot') list = [...list].sort((a, b) => b.views - a.views || +b.date - +a.date);

	const tagCounts = new Map<string, number>();
	for (const e of all) for (const t of e.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);

	return {
		list,
		cat,
		tag,
		sort,
		totals: {
			posts: all.length,
			tags: tagCounts.size,
			views: all.reduce((n, e) => n + e.views, 0)
		},
		categories: [
			{ key: null, label: '全部', count: all.length },
			...KINDS.map((k) => ({
				key: k,
				label: kindLabel[k],
				count: all.filter((e) => e.kind === k).length
			}))
		],
		tags: [...tagCounts]
			.map(([name, count]) => ({ name, count }))
			.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
	};
};
