import { desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { thought } from '$lib/server/db/schema';

export async function list(limit?: number) {
	return db.query.thought.findMany({ orderBy: desc(thought.createdAt), limit });
}

export async function create(input: { body: string; linkUrl?: string | null }) {
	const body = input.body.trim();
	if (!body) throw new Error('碎念不能是空的');
	const linkUrl = input.linkUrl?.trim() || null;
	if (linkUrl && !/^https?:\/\//i.test(linkUrl))
		throw new Error('連結要以 http:// 或 https:// 開頭');
	await db.insert(thought).values({ body, linkUrl });
}

export async function remove(id: string) {
	await db.delete(thought).where(eq(thought.id, id));
}

/** "https://www.youtube.com/watch?v=…" → "youtube.com" — the chip under a thought's link. */
export function linkHost(url: string): string {
	try {
		return new URL(url).hostname.replace(/^www\./, '');
	} catch {
		return url;
	}
}
