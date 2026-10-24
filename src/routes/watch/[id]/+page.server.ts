import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { commentAction } from '$lib/server/page-comments';
import * as watchService from '$lib/server/services/watch-service';
import * as tmdb from '$lib/server/services/tmdb-service';
import * as commentsService from '$lib/server/services/comments-service';
import * as likesService from '$lib/server/services/likes-service';

export const load: PageServerLoad = async ({ params, locals }) => {
	const item = await watchService.getItem(params.id);
	if (!item) throw error(404, 'Not found');

	const [comments, likeCount, liked] = await Promise.all([
		commentsService.listForPost(item.id),
		likesService.countFor(item.id),
		locals.user ? likesService.hasLiked(item.id, locals.user.id) : Promise.resolve(false)
	]);

	return {
		item: {
			...item,
			posterUrl: tmdb.posterUrl(item.posterPath, 'w500'),
			backdropUrl: tmdb.posterUrl(item.backdropPath, 'w1280'),
			cast: item.cast.map((member) => ({
				...member,
				profileUrl: tmdb.profileUrl(member.profilePath, 'w185')
			}))
		},
		comments,
		likeCount,
		liked
	};
};

export const actions: Actions = {
	comment: commentAction(({ params }) => params.id!),
	like: async ({ params, locals }) => {
		if (!locals.user) return fail(401, { message: '請先登入才能按讚' });
		const liked = await likesService.toggle(params.id, locals.user.id);
		return { liked };
	}
};
