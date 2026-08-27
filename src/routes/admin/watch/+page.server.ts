import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import * as watchService from '$lib/server/services/watch-service';
import * as tmdb from '$lib/server/services/tmdb-service';
import type { MediaType } from '$lib/server/services/tmdb-service';

export const load: PageServerLoad = async () => {
	const items = await watchService.listAllForAdmin();
	return {
		items: items.map((item) => ({ ...item, posterUrl: tmdb.posterUrl(item.posterPath, 'w342') }))
	};
};

function parseMediaType(input: FormDataEntryValue | null): MediaType | null {
	return input === 'movie' || input === 'tv' ? input : null;
}

function splitCsvLine(line: string): string[] {
	const cells: string[] = [];
	let current = '';
	let inQuotes = false;
	for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		if (inQuotes) {
			if (ch === '"') {
				if (line[i + 1] === '"') {
					current += '"';
					i++;
				} else {
					inQuotes = false;
				}
			} else {
				current += ch;
			}
		} else if (ch === '"') {
			inQuotes = true;
		} else if (ch === ',') {
			cells.push(current);
			current = '';
		} else {
			current += ch;
		}
	}
	cells.push(current);
	return cells;
}

/** Parses `title,type` rows — a bare header row is dropped since "type" isn't movie/tv. */
function parseCsv(text: string): Array<{ title: string; type: MediaType }> {
	const rows: Array<{ title: string; type: MediaType }> = [];
	for (const rawLine of text.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line) continue;
		const [title, type] = splitCsvLine(line);
		const mediaType = parseMediaType(type?.trim().toLowerCase() ?? null);
		if (!title?.trim() || !mediaType) continue;
		rows.push({ title: title.trim(), type: mediaType });
	}
	return rows;
}

export const actions: Actions = {
	addByTitle: async ({ request }) => {
		const formData = await request.formData();
		const title = formData.get('title')?.toString().trim() ?? '';
		const mediaType = parseMediaType(formData.get('type'));
		if (!title || !mediaType) return fail(400, { message: '請輸入片名並選擇類型' });

		try {
			await watchService.addByTitle(title, mediaType);
		} catch (err) {
			return fail(400, { message: err instanceof Error ? err.message : '新增失敗' });
		}
	},
	importCsv: async ({ request }) => {
		const formData = await request.formData();
		const file = formData.get('file');
		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { message: '請選擇 CSV 檔案' });
		}

		const rows = parseCsv(await file.text());
		if (rows.length === 0) return fail(400, { message: 'CSV 沒有可匯入的資料' });

		const results = await watchService.importCsv(rows);
		return { results };
	},
	setStatus: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		const status = formData.get('status')?.toString();
		if (!id || (status !== 'watching' && status !== 'watched')) {
			return fail(400, { message: '參數錯誤' });
		}

		try {
			await watchService.setStatus(id, status);
		} catch (err) {
			return fail(400, { message: err instanceof Error ? err.message : '更新失敗' });
		}
	},
	updateProgress: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		if (!id) return fail(400, { message: '缺少 id' });

		const seasonRaw = formData.get('currentSeason')?.toString().trim();
		const episodeRaw = formData.get('currentEpisode')?.toString().trim();

		await watchService.updateProgress(id, {
			currentSeason: seasonRaw ? Number(seasonRaw) : null,
			currentEpisode: episodeRaw ? Number(episodeRaw) : null
		});
	},
	sync: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		if (!id) return fail(400, { message: '缺少 id' });

		try {
			await watchService.syncItem(id);
		} catch (err) {
			return fail(400, { message: err instanceof Error ? err.message : '同步失敗' });
		}
	},
	remove: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		if (id) await watchService.removeItem(id);
	}
};
