import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getEntry, kindLabel, type EntryKind } from '$lib/server/content-index';
import { renderOgImage, pngResponse } from '$lib/server/og';
import { formatDate, readingMinutes } from '$lib/format';

const kinds = new Set<string>(['blog', 'article', 'mood']);

export const GET: RequestHandler = async ({ params }) => {
	if (!kinds.has(params.kind)) throw error(404);
	const entry = await getEntry(params.kind as EntryKind, params.slug);
	if (!entry) throw error(404);

	const png = await renderOgImage(
		{
			eyebrow: `CASE FILE // ${params.kind.toUpperCase()}`,
			title: entry.title,
			subtitle: entry.excerpt,
			footer: `${kindLabel[entry.kind]} · ${formatDate(entry.date)} · ${readingMinutes(entry.text)} 分鐘閱讀`
		},
		`${entry.key}@${entry.updated.getTime()}`
	);
	return pngResponse(png);
};
