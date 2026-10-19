import type { PageServerLoad } from './$types';
import { listEntries, kindLabel } from '$lib/server/content-index';
import * as thoughtsService from '$lib/server/services/thoughts-service';
import * as commentsService from '$lib/server/services/comments-service';

/** Turns a comment's thread key back into where that thread lives. */
function threadPath(key: string): string {
	if (key.startsWith('article/')) return `/articles/${key.slice(8)}`;
	if (key.startsWith('mood/')) return `/moods/${key.slice(5)}`;
	if (key.startsWith('page/')) return `/${key.slice(5)}`;
	return `/blog/${key}`;
}

export const load: PageServerLoad = async () => {
	const [entries, thoughts, comments] = await Promise.all([
		listEntries(),
		thoughtsService.list(3),
		commentsService.latestVisible(1)
	]);

	const year = new Date().getFullYear();
	const titleByPath = new Map(entries.map((e) => [e.path, e.title]));
	const latest = comments[0];

	return {
		recent: entries.slice(0, 5).map((e) => ({
			title: e.title,
			path: e.path,
			kindLabel: kindLabel[e.kind],
			date: e.date
		})),
		thoughts,
		featuredComment: latest && {
			body: latest.body,
			author: latest.author.name,
			path: threadPath(latest.postSlug),
			on: titleByPath.get(threadPath(latest.postSlug)) ?? null
		},
		year,
		yearEntries: entries
			.filter((e) => e.date.getFullYear() === year)
			.map((e) => ({ title: e.title, path: e.path, date: e.date }))
			.reverse()
	};
};
