import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { commentAction } from '$lib/server/page-comments';
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
	comment: commentAction(({ params }) => params.slug!),
	like: async ({ params, locals }) => {
		if (!locals.user) return fail(401, { message: '請先登入才能按讚' });
		const liked = await likesService.toggle(params.slug, locals.user.id);
		return { liked };
	}
};
