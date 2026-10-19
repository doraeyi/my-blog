import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { resolve } from '$app/paths';
import * as postsService from '$lib/server/services/posts-service';

export const load: PageServerLoad = async ({ params }) => {
	const post = await postsService.getById(params.id);
	if (!post) throw error(404, 'Post not found');
	return { post };
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const formData = await request.formData();
		const slug = formData.get('slug')?.toString().trim();
		const title = formData.get('title')?.toString().trim();
		const excerpt = formData.get('excerpt')?.toString().trim() || null;
		const body = formData.get('body')?.toString() ?? '';
		const tags = postsService.parseTags(formData.get('tags')?.toString());
		const series = formData.get('series')?.toString().trim() || null;
		const published = formData.get('published') === 'on';

		if (!slug || !title) return fail(400, { message: '請填寫標題與網址代稱' });

		try {
			await postsService.update(params.id, { slug, title, excerpt, body, tags, series, published });
		} catch (err) {
			return fail(400, { message: err instanceof Error ? err.message : '更新失敗' });
		}

		throw redirect(303, resolve('/admin/posts'));
	}
};
