import type { PageServerLoad } from './$types';
import { kindLabel, listEntries } from '$lib/server/content-index';
import { listProjects } from '$lib/server/services/projects-service';
import { getCurrentlyWatching, listWatched } from '$lib/server/services/watch-service';
import * as tmdb from '$lib/server/services/tmdb-service';

export const load: PageServerLoad = async () => {
	const [entries, watching, watched, projects] = await Promise.all([
		listEntries(),
		getCurrentlyWatching(),
		listWatched(),
		listProjects()
	]);

	return {
		watching: watching && {
			id: watching.id,
			title: watching.title,
			posterUrl: tmdb.posterUrl(watching.posterPath, 'w342'),
			season: watching.currentSeason,
			episode: watching.currentEpisode,
			totalEpisodes: watching.totalEpisodes,
			mediaType: watching.mediaType
		},
		recentlyWatched: watched.slice(0, 4).map((w) => ({
			id: w.id,
			title: w.title,
			posterUrl: tmdb.posterUrl(w.posterPath, 'w185')
		})),
		latest: entries.slice(0, 4).map((e) => ({
			title: e.title,
			path: e.path,
			date: e.date,
			type: kindLabel[e.kind]
		})),
		projects: projects.slice(0, 3).map((p) => ({
			id: p.id,
			name: p.githubRepo,
			description: p.description
		}))
	};
};
