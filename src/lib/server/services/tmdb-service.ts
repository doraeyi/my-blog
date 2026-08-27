import { env } from '$env/dynamic/private';

const TMDB_API = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p';

export type MediaType = 'movie' | 'tv';

async function tmdbFetch(path: string, params: Record<string, string> = {}) {
	if (!env.TMDB_API_KEY) throw new Error('TMDB_API_KEY is not set');
	const qs = new URLSearchParams({ api_key: env.TMDB_API_KEY, language: 'zh-TW', ...params });
	const res = await fetch(`${TMDB_API}${path}?${qs}`);
	if (!res.ok) throw new Error(`TMDB API ${path} failed: ${res.status} ${res.statusText}`);
	return res.json();
}

export interface TmdbSearchResult {
	tmdbId: number;
	title: string;
}

/** Strips a trailing "(2026)"/"（2026）" year suffix — TMDB's own pages display titles that
 *  way, but the year isn't part of the actual title and makes TMDB's search return nothing. */
function stripYearSuffix(title: string): string {
	return title.replace(/\s*[(（]\d{4}[)）]\s*$/, '').trim();
}

export async function searchTitle(
	title: string,
	mediaType: MediaType
): Promise<TmdbSearchResult | null> {
	const endpoint = mediaType === 'movie' ? '/search/movie' : '/search/tv';
	const query = stripYearSuffix(title) || title;
	const data = await tmdbFetch(endpoint, { query });
	const first = data.results?.[0];
	if (!first) return null;
	return { tmdbId: first.id, title: mediaType === 'movie' ? first.title : first.name };
}

export interface TmdbDetails {
	title: string;
	overview: string | null;
	posterPath: string | null;
	backdropPath: string | null;
	releaseDate: string | null;
	voteAverage: number | null;
	totalSeasons: number | null;
	totalEpisodes: number | null;
}

export async function fetchDetails(tmdbId: number, mediaType: MediaType): Promise<TmdbDetails> {
	const data = await tmdbFetch(`/${mediaType}/${tmdbId}`);
	return {
		title: mediaType === 'movie' ? data.title : data.name,
		overview: data.overview || null,
		posterPath: data.poster_path ?? null,
		backdropPath: data.backdrop_path ?? null,
		releaseDate: (mediaType === 'movie' ? data.release_date : data.first_air_date) || null,
		voteAverage: data.vote_average ?? null,
		totalSeasons: mediaType === 'tv' ? (data.number_of_seasons ?? null) : null,
		totalEpisodes: mediaType === 'tv' ? (data.number_of_episodes ?? null) : null
	};
}

export interface TmdbCastMember {
	tmdbPersonId: number;
	name: string;
	character: string | null;
	profilePath: string | null;
	sortOrder: number;
}

const MAX_CAST = 15;

export async function fetchCredits(
	tmdbId: number,
	mediaType: MediaType
): Promise<TmdbCastMember[]> {
	const data = await tmdbFetch(`/${mediaType}/${tmdbId}/credits`);
	const cast: Array<{
		id: number;
		name: string;
		character: string | null;
		profile_path: string | null;
		order: number;
	}> = data.cast ?? [];
	return cast.slice(0, MAX_CAST).map((c) => ({
		tmdbPersonId: c.id,
		name: c.name,
		character: c.character || null,
		profilePath: c.profile_path ?? null,
		sortOrder: c.order
	}));
}

export interface TmdbPerson {
	name: string;
	biography: string | null;
	profilePath: string | null;
	birthday: string | null;
	placeOfBirth: string | null;
}

export async function fetchPerson(personId: number): Promise<TmdbPerson> {
	const data = await tmdbFetch(`/person/${personId}`);
	return {
		name: data.name,
		biography: data.biography || null,
		profilePath: data.profile_path ?? null,
		birthday: data.birthday ?? null,
		placeOfBirth: data.place_of_birth ?? null
	};
}

export interface TmdbPersonCredit {
	tmdbId: number;
	mediaType: MediaType;
	title: string;
	posterPath: string | null;
	character: string | null;
	year: string | null;
	voteAverage: number | null;
}

interface RawCombinedCredit {
	id: number;
	media_type: string;
	title?: string;
	name?: string;
	poster_path: string | null;
	character: string | null;
	release_date?: string;
	first_air_date?: string;
	vote_average: number | null;
}

export async function fetchPersonCredits(personId: number): Promise<TmdbPersonCredit[]> {
	const data = await tmdbFetch(`/person/${personId}/combined_credits`);
	const cast: RawCombinedCredit[] = data.cast ?? [];

	return cast
		.filter(
			(c): c is RawCombinedCredit & { media_type: MediaType } =>
				c.media_type === 'movie' || c.media_type === 'tv'
		)
		.map((c) => {
			const date = c.media_type === 'movie' ? c.release_date : c.first_air_date;
			return {
				tmdbId: c.id,
				mediaType: c.media_type,
				title: (c.media_type === 'movie' ? c.title : c.name) ?? '',
				posterPath: c.poster_path,
				character: c.character || null,
				year: date ? date.slice(0, 4) : null,
				voteAverage: c.vote_average ?? null
			};
		})
		.sort((a, b) => (b.year ?? '').localeCompare(a.year ?? ''));
}

export function posterUrl(path: string | null, size: string = 'w500'): string | null {
	return path ? `${IMAGE_BASE}/${size}${path}` : null;
}

export function profileUrl(path: string | null, size: string = 'w185'): string | null {
	return path ? `${IMAGE_BASE}/${size}${path}` : null;
}
