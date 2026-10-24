import { and, count, desc, eq, isNull } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { notification } from '$lib/server/db/schema';

export async function notify(input: {
	userId: string;
	actorName: string;
	summary: string;
	excerpt?: string;
	url: string;
}) {
	await db.insert(notification).values(input);
}

export async function unreadCount(userId: string): Promise<number> {
	const [row] = await db
		.select({ n: count() })
		.from(notification)
		.where(and(eq(notification.userId, userId), isNull(notification.readAt)));
	return row?.n ?? 0;
}

export async function listFor(userId: string, limit = 50) {
	return db.query.notification.findMany({
		where: eq(notification.userId, userId),
		orderBy: desc(notification.createdAt),
		limit
	});
}

export async function markAllRead(userId: string) {
	await db
		.update(notification)
		.set({ readAt: new Date() })
		.where(and(eq(notification.userId, userId), isNull(notification.readAt)));
}
