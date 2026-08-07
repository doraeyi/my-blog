import type { Actions, PageServerLoad } from './$types';
import * as postsService from '$lib/server/services/posts-service';

export const load: PageServerLoad = async () => {
	return { posts: await postsService.listAll() };
};

export const actions: Actions = {
	remove: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		if (id) await postsService.remove(id);
	}
};
