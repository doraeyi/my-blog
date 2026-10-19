import { and, count, desc, eq } from 'drizzle-orm';
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

/** Newest visible comments across the whole site — the homepage's "精選留言". */
export async function latestVisible(limit: number) {
	return db.query.comment.findMany({
		where: eq(comment.status, 'visible'),
		orderBy: desc(comment.createdAt),
		limit,
		with: { author: { columns: authorColumns } }
	});
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
