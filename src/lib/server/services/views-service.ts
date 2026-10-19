import { eq, inArray, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { pageView } from '$lib/server/db/schema';

const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|headless/i;
const DEDUPE_MS = 30 * 60 * 1000;
// visitor+key → last counted at. In-memory is fine for one process; a restart
// just means a returning reader might be counted once more.
const recent = new Map<string, number>();

function shouldCount(visitor: string, key: string, userAgent: string): boolean {
	if (!userAgent || BOT_UA.test(userAgent)) return false;
	const now = Date.now();
	const id = `${visitor}|${key}`;
	const last = recent.get(id);
	if (last && now - last < DEDUPE_MS) return false;
	recent.set(id, now);
	if (recent.size > 10_000) {
		for (const [k, t] of recent) if (now - t > DEDUPE_MS) recent.delete(k);
	}
	return true;
}

/** Counts a view (unless it's a bot, the site owner, or a repeat within 30 min) and returns the total. */
export async function recordView(
	key: string,
	visitor: { id: string; userAgent: string; isOwner: boolean }
): Promise<number> {
	if (!visitor.isOwner && shouldCount(visitor.id, key, visitor.userAgent)) {
		const [row] = await db
			.insert(pageView)
			.values({ key, count: 1 })
			.onConflictDoUpdate({ target: pageView.key, set: { count: sql`${pageView.count} + 1` } })
			.returning({ count: pageView.count });
		return row.count;
	}
	return countFor(key);
}

export async function countFor(key: string): Promise<number> {
	const row = await db.query.pageView.findFirst({ where: eq(pageView.key, key) });
	return row?.count ?? 0;
}

export async function countsFor(keys: string[]): Promise<Map<string, number>> {
	if (keys.length === 0) return new Map();
	const rows = await db.select().from(pageView).where(inArray(pageView.key, keys));
	return new Map(rows.map((r) => [r.key, r.count]));
}
