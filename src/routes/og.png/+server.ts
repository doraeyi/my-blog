import type { RequestHandler } from './$types';
import { renderOgImage, pngResponse } from '$lib/server/og';
import { SITE_DESCRIPTION } from '$lib/site';

export const GET: RequestHandler = async () => {
	const png = await renderOgImage(
		{
			eyebrow: 'CASE FILE // SITE',
			title: 'Liam 的偵探手記',
			subtitle: SITE_DESCRIPTION,
			footer: '文章 · 心情 · 作品 · 追劇'
		},
		'site'
	);
	return pngResponse(png);
};
