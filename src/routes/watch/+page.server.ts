import type { PageServerLoad } from './$types';
import * as watchService from '$lib/server/services/watch-service';
import * as tmdb from '$lib/server/services/tmdb-service';

export const load: PageServerLoad = async () => {
	const [current, watched] = await Promise.all([
		watchService.getCurrentlyWatching(),
		watchService.listWatched()
	]);

	return {
		current: current
			? {
					...current,
					posterUrl: tmdb.posterUrl(current.posterPath, 'w500'),
					backdropUrl: tmdb.posterUrl(current.backdropPath, 'w1280'),
					live: watchService.isLive(current.lastSeenAt)
				}
			: null,
		watched: watched.map((item) => ({
			...item,
			posterUrl: tmdb.posterUrl(item.posterPath, 'w342')
		}))
	};
};
