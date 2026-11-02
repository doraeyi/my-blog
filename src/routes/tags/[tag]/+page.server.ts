import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { kindLabel, listEntries } from '$lib/server/content-index';

export const load: PageServerLoad = async ({ params }) => {
	const entries = (await listEntries()).filter((e) => e.tags.includes(params.tag));
	// A tag nothing is filed under isn't a page (and shouldn't be indexed as one).
	if (entries.length === 0) error(404, '沒有這個標籤');
	return {
		tag: params.tag,
		posts: entries.map((e) => ({
			title: e.title,
			path: e.path,
			excerpt: e.excerpt,
			date: e.date,
			type: kindLabel[e.kind]
		}))
	};
};
