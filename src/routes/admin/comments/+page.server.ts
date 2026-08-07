import type { Actions, PageServerLoad } from './$types';
import * as commentsService from '$lib/server/services/comments-service';

export const load: PageServerLoad = async () => {
	return { comments: await commentsService.listAll() };
};

export const actions: Actions = {
	hide: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		if (id) await commentsService.moderate(id, 'hidden');
	},
	unhide: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		if (id) await commentsService.moderate(id, 'visible');
	},
	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		if (id) await commentsService.remove(id);
	}
};
