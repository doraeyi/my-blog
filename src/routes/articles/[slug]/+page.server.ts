import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { commentAction } from '$lib/server/page-comments';
import { getPublishedBySlug, renderBody } from '$lib/server/services/posts-service';
import * as commentsService from '$lib/server/services/comments-service';
import * as likesService from '$lib/server/services/likes-service';
import { loadPostExtras } from '$lib/server/post-extras';

export const load: PageServerLoad = async (event) => {
	const { params, locals } = event;
	const post = await getPublishedBySlug('article', params.slug);
	if (!post) throw error(404, 'Article not found');

	const key = `article/${params.slug}`;
	const [bodyHtml, comments, likeCount, liked, extras] = await Promise.all([
		renderBody(post.body),
		commentsService.listForPost(key),
		likesService.countFor(key),
		locals.user ? likesService.hasLiked(key, locals.user.id) : Promise.resolve(false),
		loadPostExtras('article', params.slug, event)
	]);

	return { post, bodyHtml, comments, likeCount, liked, ...extras };
};

export const actions: Actions = {
	like: async ({ params, locals }) => {
		if (!locals.user) return fail(401, { message: '請先登入才能按讚' });
		const liked = await likesService.toggle(`article/${params.slug}`, locals.user.id);
		return { liked };
	},
	comment: commentAction(({ params }) => `article/${params.slug}`)
};
