import type { PageServerLoad } from './$types';
import { kindLabel, listEntries } from '$lib/server/content-index';

export const load: PageServerLoad = async () => {
	const entries = await listEntries();
	return {
		posts: entries.map((e) => ({
			path: e.path,
			title: e.title,
			kind: kindLabel[e.kind],
			date: e.date.toISOString().slice(0, 10),
			tags: e.tags,
			excerpt: (e.excerpt ?? e.text).replace(/\s+/g, ' ').slice(0, 70)
		}))
	};
};
