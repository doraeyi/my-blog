import { and, desc, eq } from 'drizzle-orm';
import { renderMarkdown } from '@doraeyi/content-toolkit';
import { db } from '$lib/server/db';
import { post } from '$lib/server/db/schema';

type PostKind = 'article' | 'mood';
const authorColumns = { id: true, name: true, image: true } as const;

export async function listPublished(kind: PostKind) {
	return db.query.post.findMany({
		where: and(eq(post.kind, kind), eq(post.published, true)),
		orderBy: desc(post.createdAt),
		with: { author: { columns: authorColumns } }
	});
}

export async function listAll() {
	return db.query.post.findMany({
		orderBy: desc(post.createdAt),
		with: { author: { columns: { id: true, name: true } } }
	});
}

// Across both kinds — used by the homepage's "recent activity" feed, which doesn't
// care whether something is an article or a mood. Only the columns that feed
// actually needs — no `body`, which can be large.
export async function listRecentPublished(limit: number) {
	return db.query.post.findMany({
		where: eq(post.published, true),
		orderBy: desc(post.createdAt),
		limit,
		columns: { id: true, kind: true, slug: true, title: true, excerpt: true, createdAt: true }
	});
}

export async function getPublishedStats() {
	const rows = await db.query.post.findMany({
		where: eq(post.published, true),
		columns: { body: true, createdAt: true }
	});

	if (rows.length === 0) {
		return { postCount: 0, charCount: 0, daysActive: 0 };
	}

	const charCount = rows.reduce((sum, r) => sum + r.body.length, 0);
	const earliest = rows.reduce(
		(min, r) => (r.createdAt < min ? r.createdAt : min),
		rows[0].createdAt
	);
	const daysActive = Math.max(1, Math.floor((Date.now() - earliest.getTime()) / 86_400_000));

	return { postCount: rows.length, charCount, daysActive };
}

/** "svelte, 前端 ,  svelte" → ["svelte", "前端"] — accepts ASCII or full-width commas. */
export function parseTags(raw: string | undefined | null): string[] {
	const seen = new Set<string>();
	for (const t of (raw ?? '').split(/[,，]/)) {
		const tag = t.trim().replace(/^#/, '');
		if (tag) seen.add(tag);
	}
	return [...seen];
}

export async function getById(id: string) {
	return db.query.post.findFirst({ where: eq(post.id, id) });
}

export async function getPublishedBySlug(kind: PostKind, slug: string) {
	return db.query.post.findFirst({
		where: and(eq(post.kind, kind), eq(post.slug, slug), eq(post.published, true)),
		with: { author: { columns: authorColumns } }
	});
}

export async function renderBody(markdown: string): Promise<string> {
	return renderMarkdown(markdown);
}

export async function create(input: {
	kind: PostKind;
	slug: string;
	title: string;
	excerpt?: string;
	body: string;
	tags?: string[];
	series?: string | null;
	published: boolean;
	authorId: string;
}): Promise<string> {
	const [row] = await db.insert(post).values(input).returning({ id: post.id });
	return row.id;
}

export async function update(
	id: string,
	input: Partial<{
		slug: string;
		title: string;
		excerpt: string | null;
		body: string;
		tags: string[];
		series: string | null;
		published: boolean;
	}>
) {
	await db
		.update(post)
		.set({ ...input, updatedAt: new Date() })
		.where(eq(post.id, id));
}

export async function remove(id: string) {
	await db.delete(post).where(eq(post.id, id));
}
