import { fail, type Action, type RequestEvent } from '@sveltejs/kit';
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

/**
 * The `?/comment` form action every comment thread posts to. `key` is the
 * thread key (or derives it from the request); an optional `replyTo` field
 * makes the new comment a reply.
 */
export function commentAction(key: string | ((event: RequestEvent) => string)): Action {
	return async (event) => {
		const { request, locals } = event;
		if (!locals.user) return fail(401, { message: '請先登入才能留言' });
		const formData = await request.formData();
		const body = formData.get('body')?.toString() ?? '';
		const replyTo = formData.get('replyTo')?.toString() || null;
		if (body.length > 2000) return fail(400, { message: '留言太長了（上限 2000 字）' });
		try {
			await commentsService.create({
				postSlug: typeof key === 'string' ? key : key(event),
				authorId: locals.user.id,
				body,
				replyTo
			});
		} catch (err) {
			return fail(400, { message: err instanceof Error ? err.message : '留言失敗' });
		}
	};
}

export function pageCommentAction(name: string): Action {
	return commentAction(pageCommentKey(name));
}
