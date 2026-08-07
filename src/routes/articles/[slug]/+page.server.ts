import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getPublishedBySlug, renderBody } from '$lib/server/services/posts-service';
import * as commentsService from '$lib/server/services/comments-service';

export const load: PageServerLoad = async ({ params }) => {
	const post = await getPublishedBySlug('article', params.slug);
	if (!post) throw error(404, 'Article not found');

	const [bodyHtml, comments] = await Promise.all([
		renderBody(post.body),
		commentsService.listForPost(`article/${params.slug}`)
	]);

	return { post, bodyHtml, comments };
};

export const actions: Actions = {
	comment: async ({ request, params, locals }) => {
		if (!locals.user) return fail(401, { message: '請先登入才能留言' });
		const formData = await request.formData();
		const body = formData.get('body')?.toString() ?? '';
		try {
			await commentsService.create({
				postSlug: `article/${params.slug}`,
				authorId: locals.user.id,
				body
			});
		} catch (err) {
			return fail(400, { message: err instanceof Error ? err.message : '留言失敗' });
		}
	}
};
