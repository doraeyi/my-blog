import type { PageServerLoad } from './$types';
import { kindLabel, listEntries } from '$lib/server/content-index';

export const load: PageServerLoad = async ({ params }) => {
	const entries = (await listEntries()).filter((e) => e.tags.includes(params.tag));
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
