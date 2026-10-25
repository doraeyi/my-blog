import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { listEntries } from '$lib/server/content-index';
import * as webmentionService from '$lib/server/services/webmention-service';

export const load: PageServerLoad = async () => {
	const [mentions, entries] = await Promise.all([webmentionService.listAll(), listEntries()]);
	const titles = new Map(entries.map((e) => [e.path, e.title]));
	return {
		mentions: mentions.map((m) => ({ ...m, targetTitle: titles.get(m.target) ?? m.target })),
		posts: entries.slice(0, 12).map((e) => ({ path: e.path, title: e.title }))
	};
};

const field = async (request: Request, name: string) =>
	(await request.formData()).get(name)?.toString() ?? '';

export const actions: Actions = {
	hide: async ({ request }) => webmentionService.setHidden(await field(request, 'id'), true),
	show: async ({ request }) => webmentionService.setHidden(await field(request, 'id'), false),
	remove: async ({ request }) => webmentionService.remove(await field(request, 'id')),
	verify: async ({ request }) => webmentionService.verify(await field(request, 'id')),
	send: async ({ request }) => {
		const path = await field(request, 'path');
		try {
			return { path, results: await webmentionService.sendFor(path) };
		} catch (err) {
			return fail(400, { message: err instanceof Error ? err.message : '發送失敗' });
		}
	}
};
