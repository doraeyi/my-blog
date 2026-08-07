import { and, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { comment } from '$lib/server/db/schema';

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

export async function create(input: { postSlug: string; authorId: string; body: string }) {
	const body = input.body.trim();
	if (!body) throw new Error('Comment body cannot be empty');
	await db.insert(comment).values({ postSlug: input.postSlug, authorId: input.authorId, body });
}

export async function moderate(commentId: string, status: 'visible' | 'hidden') {
	await db.update(comment).set({ status }).where(eq(comment.id, commentId));
}

export async function remove(commentId: string) {
	await db.delete(comment).where(eq(comment.id, commentId));
}
