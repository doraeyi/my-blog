import type { PageServerLoad } from './$types';
import { listEntries } from '$lib/server/content-index';
import { listProjects } from '$lib/server/services/projects-service';
import { listWatched } from '$lib/server/services/watch-service';

export type TimelineKind = 'blog' | 'article' | 'mood' | 'watch' | 'project';

export const load: PageServerLoad = async () => {
	const [entries, watched, projects] = await Promise.all([
		listEntries(),
		listWatched(),
		listProjects()
	]);

	const items = [
		...entries.map((e) => ({
			kind: e.kind as TimelineKind,
			title: e.title,
			path: e.path,
			date: e.date
		})),
		...watched
			.filter((w) => w.watchedAt)
			.map((w) => ({
				kind: 'watch' as TimelineKind,
				title: w.title,
				path: `/watch/${w.id}`,
				date: w.watchedAt!
			})),
		...projects.map((p) => ({
			kind: 'project' as TimelineKind,
			title: p.githubRepo,
			path: `/portfolio/${p.id}`,
			date: p.createdAt
		}))
	].sort((a, b) => b.date.getTime() - a.date.getTime());

	// year → month → items, preserving newest-first order.
	const years: { year: number; months: { month: number; items: typeof items }[] }[] = [];
	for (const item of items) {
		const y = item.date.getFullYear();
		const m = item.date.getMonth() + 1;
		let year = years.at(-1);
		if (year?.year !== y) years.push((year = { year: y, months: [] }));
		let month = year.months.at(-1);
		if (month?.month !== m) year.months.push((month = { month: m, items: [] }));
		month.items.push(item);
	}

	return { years, total: items.length };
};
