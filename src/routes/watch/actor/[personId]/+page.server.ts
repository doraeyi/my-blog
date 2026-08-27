import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import * as tmdb from '$lib/server/services/tmdb-service';
import * as watchService from '$lib/server/services/watch-service';

export const load: PageServerLoad = async ({ params }) => {
	const personId = Number(params.personId);
	if (!Number.isInteger(personId)) throw error(404, 'Not found');

	let person, credits;
	try {
		[person, credits] = await Promise.all([
			tmdb.fetchPerson(personId),
			tmdb.fetchPersonCredits(personId)
		]);
	} catch {
		throw error(404, '找不到這位演員');
	}

	const localMatches = await watchService.findLocalMatches(credits.map((c) => c.tmdbId));

	return {
		person: { ...person, profileUrl: tmdb.profileUrl(person.profilePath, 'h632') },
		credits: credits.map((c) => ({
			...c,
			posterUrl: tmdb.posterUrl(c.posterPath, 'w185'),
			localId: localMatches.get(`${c.tmdbId}:${c.mediaType}`) ?? null
		}))
	};
};
