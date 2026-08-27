import { and, eq, inArray, ne } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { watchItem, watchItemCast } from '$lib/server/db/schema';
import * as tmdb from './tmdb-service';
import type { MediaType } from './tmdb-service';

type Status = 'watching' | 'watched';

export async function getCurrentlyWatching() {
	return db.query.watchItem.findFirst({
		where: eq(watchItem.status, 'watching'),
		with: { cast: { orderBy: (c, { asc }) => asc(c.sortOrder) } }
	});
}

export async function listWatched() {
	return db.query.watchItem.findMany({
		where: eq(watchItem.status, 'watched'),
		orderBy: (w, { desc }) => desc(w.watchedAt)
	});
}

export async function listAllForAdmin() {
	return db.query.watchItem.findMany({ orderBy: (w, { desc }) => desc(w.createdAt) });
}

export async function getItem(id: string) {
	return db.query.watchItem.findFirst({
		where: eq(watchItem.id, id),
		with: { cast: { orderBy: (c, { asc }) => asc(c.sortOrder) } }
	});
}

async function upsertFromTmdb(
	tmdbId: number,
	mediaType: MediaType,
	status: Status
): Promise<string> {
	const [details, cast] = await Promise.all([
		tmdb.fetchDetails(tmdbId, mediaType),
		tmdb.fetchCredits(tmdbId, mediaType)
	]);

	const existing = await db.query.watchItem.findFirst({
		where: and(eq(watchItem.tmdbId, tmdbId), eq(watchItem.mediaType, mediaType))
	});

	const id = existing?.id ?? crypto.randomUUID();
	const watchedAt = status === 'watched' ? new Date() : null;

	db.transaction((tx) => {
		if (status === 'watching') {
			// Only one item may be "watching" at a time — demote whatever held that slot before.
			tx.update(watchItem)
				.set({ status: 'watched', watchedAt: new Date() })
				.where(and(eq(watchItem.status, 'watching'), ne(watchItem.id, id)))
				.run();
		}

		const values = {
			id,
			tmdbId,
			mediaType,
			title: details.title,
			overview: details.overview,
			posterPath: details.posterPath,
			backdropPath: details.backdropPath,
			releaseDate: details.releaseDate,
			voteAverage: details.voteAverage,
			totalSeasons: details.totalSeasons,
			totalEpisodes: details.totalEpisodes,
			status,
			watchedAt
		};

		if (existing) {
			tx.update(watchItem).set(values).where(eq(watchItem.id, id)).run();
		} else {
			tx.insert(watchItem).values(values).run();
		}

		tx.delete(watchItemCast).where(eq(watchItemCast.watchItemId, id)).run();
		for (const member of cast) {
			tx.insert(watchItemCast)
				.values({ watchItemId: id, ...member })
				.run();
		}
	});

	return id;
}

export async function addByTmdbId(
	tmdbId: number,
	mediaType: MediaType,
	status: Status = 'watching'
): Promise<string> {
	return upsertFromTmdb(tmdbId, mediaType, status);
}

export async function addByTitle(
	title: string,
	mediaType: MediaType,
	status: Status = 'watching'
): Promise<string> {
	const found = await tmdb.searchTitle(title, mediaType);
	if (!found) throw new Error(`找不到「${title}」`);
	return upsertFromTmdb(found.tmdbId, mediaType, status);
}

export interface CsvImportResult {
	title: string;
	ok: boolean;
	error?: string;
}

/** Bulk imports as already-watched — the single "currently watching" slot stays admin-controlled. */
export async function importCsv(
	rows: Array<{ title: string; type: MediaType }>
): Promise<CsvImportResult[]> {
	const results: CsvImportResult[] = [];
	for (const row of rows) {
		try {
			await addByTitle(row.title, row.type, 'watched');
			results.push({ title: row.title, ok: true });
		} catch (err) {
			results.push({
				title: row.title,
				ok: false,
				error: err instanceof Error ? err.message : '匯入失敗'
			});
		}
	}
	return results;
}

export async function setStatus(id: string, status: Status): Promise<void> {
	const existing = await db.query.watchItem.findFirst({ where: eq(watchItem.id, id) });
	if (!existing) throw new Error('Watch item not found');

	db.transaction((tx) => {
		if (status === 'watching') {
			tx.update(watchItem)
				.set({ status: 'watched', watchedAt: new Date() })
				.where(and(eq(watchItem.status, 'watching'), ne(watchItem.id, id)))
				.run();
		}
		tx.update(watchItem)
			.set({ status, watchedAt: status === 'watched' ? new Date() : null })
			.where(eq(watchItem.id, id))
			.run();
	});
}

export async function updateProgress(
	id: string,
	progress: { currentSeason: number | null; currentEpisode: number | null }
): Promise<void> {
	await db.update(watchItem).set(progress).where(eq(watchItem.id, id));
}

/** Re-fetches from TMDB using the stored tmdbId/mediaType — preserves current status and progress. */
export async function syncItem(id: string): Promise<void> {
	const existing = await db.query.watchItem.findFirst({ where: eq(watchItem.id, id) });
	if (!existing) throw new Error('Watch item not found');
	await upsertFromTmdb(existing.tmdbId, existing.mediaType, existing.status);
}

export async function removeItem(id: string): Promise<void> {
	await db.delete(watchItem).where(eq(watchItem.id, id));
}

/** Maps `"{tmdbId}:{mediaType}"` -> local watch item id, for the given tmdbIds already in our db. */
export async function findLocalMatches(tmdbIds: number[]): Promise<Map<string, string>> {
	if (tmdbIds.length === 0) return new Map();
	const rows = await db.query.watchItem.findMany({
		where: inArray(watchItem.tmdbId, tmdbIds),
		columns: { id: true, tmdbId: true, mediaType: true }
	});
	return new Map(rows.map((row) => [`${row.tmdbId}:${row.mediaType}`, row.id]));
}
