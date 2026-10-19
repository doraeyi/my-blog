import { fail, type Action } from '@sveltejs/kit';
import * as commentsService from '$lib/server/services/comments-service';

/**
 * Comment threads for standalone pages (guestbook, friends, about-site, …).
 * They live in the same `comment` table as post comments, under a `page/<name>`
 * key, so the admin moderation queue covers them for free.
 */
export function pageCommentKey(name: string): string {
	return `page/${name}`;
}

export function loadPageComments(name: string) {
	return commentsService.listForPost(pageCommentKey(name));
}

export function pageCommentAction(name: string): Action {
	return async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: '請先登入才能留言' });
		const formData = await request.formData();
		const body = formData.get('body')?.toString() ?? '';
		if (body.length > 2000) return fail(400, { message: '留言太長了（上限 2000 字）' });
		try {
			await commentsService.create({
				postSlug: pageCommentKey(name),
				authorId: locals.user.id,
				body
			});
		} catch (err) {
			return fail(400, { message: err instanceof Error ? err.message : '留言失敗' });
		}
	};
}
