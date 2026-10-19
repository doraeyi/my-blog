import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import * as commentsService from '$lib/server/services/comments-service';
import * as likesService from '$lib/server/services/likes-service';
import { loadPostExtras } from '$lib/server/post-extras';

export const load: PageServerLoad = async (event) => {
	const { params, locals } = event;
	const [comments, likeCount, liked, extras] = await Promise.all([
		commentsService.listForPost(params.slug),
		likesService.countFor(params.slug),
		locals.user ? likesService.hasLiked(params.slug, locals.user.id) : Promise.resolve(false),
		loadPostExtras('blog', params.slug, event)
	]);
	return { comments, likeCount, liked, ...extras };
};

export const actions: Actions = {
	comment: async ({ request, params, locals }) => {
		if (!locals.user) return fail(401, { message: '請先登入才能留言' });
		const formData = await request.formData();
		const body = formData.get('body')?.toString() ?? '';
		try {
			await commentsService.create({ postSlug: params.slug, authorId: locals.user.id, body });
		} catch (err) {
			return fail(400, { message: err instanceof Error ? err.message : '留言失敗' });
		}
	},
	like: async ({ params, locals }) => {
		if (!locals.user) return fail(401, { message: '請先登入才能按讚' });
		const liked = await likesService.toggle(params.slug, locals.user.id);
		return { liked };
	}
};
