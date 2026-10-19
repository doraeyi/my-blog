import type { Actions, PageServerLoad } from './$types';
import * as postsService from '$lib/server/services/posts-service';
import { countsFor } from '$lib/server/services/views-service';

export const load: PageServerLoad = async () => {
	const posts = await postsService.listAll();
	const views = await countsFor(posts.map((p) => `${p.kind}/${p.slug}`));
	return { posts: posts.map((p) => ({ ...p, views: views.get(`${p.kind}/${p.slug}`) ?? 0 })) };
};

export const actions: Actions = {
	remove: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		if (id) await postsService.remove(id);
	}
};
