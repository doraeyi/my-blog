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
