import type { PageServerLoad } from './$types';
import { listEntries } from '$lib/server/content-index';
import { listProjects } from '$lib/server/services/projects-service';

export const load: PageServerLoad = async () => {
	const [entries, projects] = await Promise.all([listEntries(), listProjects()]);
	return {
		articles: entries
			.filter((e) => e.kind !== 'mood')
			.slice(0, 6)
			.map((e) => ({
				title: e.title,
				path: e.path,
				date: e.date.toISOString().slice(0, 10),
				tags: e.tags
			})),
		projects: projects.map((p) => ({
			id: p.id,
			name: p.githubRepo,
			owner: p.githubOwner,
			description: p.description,
			stars: p.starCount,
			hasReport: !!p.caseReport
		}))
	};
};
