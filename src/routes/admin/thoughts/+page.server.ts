import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import * as thoughtsService from '$lib/server/services/thoughts-service';

export const load: PageServerLoad = async () => {
	return { thoughts: await thoughtsService.list() };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		try {
			await thoughtsService.create({
				body: formData.get('body')?.toString() ?? '',
				linkUrl: formData.get('linkUrl')?.toString()
			});
		} catch (err) {
			return fail(400, { message: err instanceof Error ? err.message : '發佈失敗' });
		}
	},
	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		if (id) await thoughtsService.remove(id);
	}
};
