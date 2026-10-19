import { and, count, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { postReaction } from '$lib/server/db/schema';

export async function countFor(postSlug: string): Promise<number> {
	const [row] = await db
		.select({ count: count() })
		.from(postReaction)
		.where(eq(postReaction.postSlug, postSlug));
	return row?.count ?? 0;
}

export async function hasLiked(postSlug: string, userId: string): Promise<boolean> {
	const [row] = await db
		.select({ id: postReaction.id })
		.from(postReaction)
		.where(and(eq(postReaction.postSlug, postSlug), eq(postReaction.userId, userId)))
		.limit(1);
	return Boolean(row);
}

/** Returns the new liked state (true = now liked, false = now unliked). */
export async function toggle(postSlug: string, userId: string): Promise<boolean> {
	const liked = await hasLiked(postSlug, userId);
	if (liked) {
		await db
			.delete(postReaction)
			.where(and(eq(postReaction.postSlug, postSlug), eq(postReaction.userId, userId)));
		return false;
	}
	await db.insert(postReaction).values({ postSlug, userId });
	return true;
}

/** Like count per post key, for list views. */
export async function countsByKey(): Promise<Map<string, number>> {
	const rows = await db
		.select({ key: postReaction.postSlug, n: count() })
		.from(postReaction)
		.groupBy(postReaction.postSlug);
	return new Map(rows.map((r) => [r.key, r.n]));
}
