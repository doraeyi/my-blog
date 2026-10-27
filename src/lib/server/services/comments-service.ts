import { and, count, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { comment } from '$lib/server/db/schema';
import { getRequestEvent } from '$app/server';
import { notifyComment, titleFor } from '$lib/server/discord';
import { notify } from './notifications-service';

/** Tells someone their comment got a reply, linking straight to the reply. */
async function notifyReply(input: { recipientId: string; commentId: string; body: string }) {
	let event;
	try {
		event = getRequestEvent();
	} catch {
		return;
	}
	const actor = event.locals.user;
	if (!actor) return;
	const path = event.url.pathname;
	const title = await titleFor(path);
	await notify({
		userId: input.recipientId,
		actorName: actor.name,
		summary: `回覆了你在《${title}》的留言`,
		excerpt: input.body.length > 80 ? `${input.body.slice(0, 79)}…` : input.body,
		url: `${path}#comment-${input.commentId}`
	});
}

const authorColumns = { id: true, name: true, image: true } as const;

export async function listForPost(postSlug: string) {
	return db.query.comment.findMany({
		where: and(eq(comment.postSlug, postSlug), eq(comment.status, 'visible')),
		orderBy: desc(comment.createdAt),
		with: { author: { columns: authorColumns } }
	});
}

export async function listAll() {
	return db.query.comment.findMany({
		orderBy: desc(comment.createdAt),
		with: { author: { columns: authorColumns } }
	});
}

/**
 * `replyTo` is the comment being answered (a top-level one or another reply).
 * Replies always hang off the thread's top-level comment, and whoever wrote
 * the comment being answered gets an in-site notification.
 */
export async function create(input: {
	postSlug: string;
	authorId: string;
	body: string;
	replyTo?: string | null;
}) {
	const body = input.body.trim();
	if (!body) throw new Error('Comment body cannot be empty');

	let parentId: string | null = null;
	let target: { authorId: string; authorName: string } | null = null;
	if (input.replyTo) {
		const answered = await db.query.comment.findFirst({
			where: and(eq(comment.id, input.replyTo), eq(comment.postSlug, input.postSlug)),
			with: { author: { columns: authorColumns } }
		});
		if (!answered) throw new Error('要回覆的留言不存在');
		parentId = answered.parentId ?? answered.id;
		target = { authorId: answered.authorId, authorName: answered.author.name };
	}

	const [row] = await db
		.insert(comment)
		.values({ postSlug: input.postSlug, authorId: input.authorId, body, parentId })
		.returning({ id: comment.id });

	notifyComment(body, target?.authorName);
	if (target && target.authorId !== input.authorId) {
		await notifyReply({ recipientId: target.authorId, commentId: row.id, body });
	}
}

export async function moderate(commentId: string, status: 'visible' | 'hidden') {
	await db.update(comment).set({ status }).where(eq(comment.id, commentId));
}

export async function remove(commentId: string) {
	await db.delete(comment).where(eq(comment.id, commentId));
}

/** Visible-comment count per thread key, for list views. */
export async function countsByKey(): Promise<Map<string, number>> {
	const rows = await db
		.select({ key: comment.postSlug, n: count() })
		.from(comment)
		.where(eq(comment.status, 'visible'))
		.groupBy(comment.postSlug);
	return new Map(rows.map((r) => [r.key, r.n]));
}
