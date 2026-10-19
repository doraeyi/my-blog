import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getPublishedBySlug, renderBody } from '$lib/server/services/posts-service';
import * as commentsService from '$lib/server/services/comments-service';
import { loadPostExtras } from '$lib/server/post-extras';

export const load: PageServerLoad = async (event) => {
	const { params } = event;
	const post = await getPublishedBySlug('mood', params.slug);
	if (!post) throw error(404, 'Mood post not found');

	const [bodyHtml, comments, extras] = await Promise.all([
		renderBody(post.body),
		commentsService.listForPost(`mood/${params.slug}`),
		loadPostExtras('mood', params.slug, event)
	]);

	return { post, bodyHtml, comments, ...extras };
};

export const actions: Actions = {
	comment: async ({ request, params, locals }) => {
		if (!locals.user) return fail(401, { message: '請先登入才能留言' });
		const formData = await request.formData();
		const body = formData.get('body')?.toString() ?? '';
		try {
			await commentsService.create({
				postSlug: `mood/${params.slug}`,
				authorId: locals.user.id,
				body
			});
		} catch (err) {
			return fail(400, { message: err instanceof Error ? err.message : '留言失敗' });
		}
	}
};
