import { and, desc, eq } from 'drizzle-orm';
import { listPosts } from '$lib/content-service';
import { readingMinutes } from '$lib/format';
import { db } from '$lib/server/db';
import { post } from '$lib/server/db/schema';

/**
 * One flat view over every piece of published writing, whichever system it
 * lives in — Markdown files (/blog) or DB posts (/articles, /moods). RSS,
 * sitemap, search, the archive and per-post navigation all read from here so
 * they never disagree about what exists.
 */

export type EntryKind = 'blog' | 'article' | 'mood';

export interface ContentEntry {
	kind: EntryKind;
	slug: string;
	/** Same key comments/likes/views use for this piece. */
	key: string;
	path: string;
	title: string;
	excerpt: string | null;
	date: Date;
	updated: Date;
	tags: string[];
	series: string | null;
	/** Markdown stripped down to plain prose — for search and reading time. */
	text: string;
}

export const kindLabel: Record<EntryKind, string> = {
	blog: '文章',
	article: '技術文章',
	mood: '心情'
};

const rawModules = import.meta.glob<string>('/src/lib/content/posts/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
});

export function contentKey(kind: EntryKind, slug: string): string {
	return kind === 'blog' ? slug : `${kind}/${slug}`;
}

export function entryPath(kind: EntryKind, slug: string): string {
	return kind === 'blog'
		? `/blog/${slug}`
		: kind === 'article'
			? `/articles/${slug}`
			: `/moods/${slug}`;
}

export function plainText(markdown: string): string {
	return markdown
		.replace(/^---[\s\S]*?\n---\n?/, '')
		.replace(/```[^\n]*\n?/g, '')
		.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/<[^>]+>/g, '')
		.replace(/[#>*_`~|-]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function markdownEntries(): ContentEntry[] {
	return listPosts().map((p) => {
		const date = new Date(p.date);
		return {
			kind: 'blog',
			slug: p.slug,
			key: contentKey('blog', p.slug),
			path: entryPath('blog', p.slug),
			title: p.title,
			excerpt: p.excerpt ?? null,
			date,
			updated: date,
			tags: p.tags ?? [],
			series: p.series ?? null,
			text: plainText(rawModules[`/src/lib/content/posts/${p.slug}.md`] ?? '')
		};
	});
}

function rowToEntry(r: typeof post.$inferSelect): ContentEntry {
	return {
		kind: r.kind,
		slug: r.slug,
		key: contentKey(r.kind, r.slug),
		path: entryPath(r.kind, r.slug),
		title: r.title,
		excerpt: r.excerpt,
		date: r.createdAt,
		updated: r.updatedAt,
		tags: r.tags,
		series: r.series,
		text: plainText(r.body)
	};
}

async function dbEntries(): Promise<ContentEntry[]> {
	const rows = await db.query.post.findMany({
		where: eq(post.published, true),
		orderBy: desc(post.createdAt)
	});
	return rows.map(rowToEntry);
}

export async function listEntries(): Promise<ContentEntry[]> {
	const all = [...markdownEntries(), ...(await dbEntries())];
	return all.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function getEntry(kind: EntryKind, slug: string): Promise<ContentEntry | undefined> {
	if (kind === 'blog') return markdownEntries().find((e) => e.slug === slug);
	const row = await db.query.post.findFirst({
		where: and(eq(post.kind, kind), eq(post.slug, slug), eq(post.published, true))
	});
	return row && rowToEntry(row);
}

export interface EntryLink {
	title: string;
	path: string;
	kind: EntryKind;
	date: Date;
}

export interface PostNav {
	minutes: number;
	tags: string[];
	prev: EntryLink | null;
	next: EntryLink | null;
	related: EntryLink[];
	series: { name: string; items: (EntryLink & { current: boolean })[] } | null;
}

function toLink(e: ContentEntry): EntryLink {
	return { title: e.title, path: e.path, kind: e.kind, date: e.date };
}

/** Reading time, previous/next within the same kind, series, and tag-based related posts. */
export async function getPostNav(kind: EntryKind, slug: string): Promise<PostNav | null> {
	const all = await listEntries();
	const current = all.find((e) => e.kind === kind && e.slug === slug);
	if (!current) return null;

	// `all` is newest-first, so "previous" (older) is further down the list.
	const sameKind = all.filter((e) => e.kind === kind);
	const i = sameKind.indexOf(current);
	const prev = sameKind[i + 1] ?? null;
	const next = sameKind[i - 1] ?? null;

	let series: PostNav['series'] = null;
	if (current.series) {
		const items = all
			.filter((e) => e.series === current.series)
			.sort((a, b) => a.date.getTime() - b.date.getTime())
			.map((e) => ({ ...toLink(e), current: e === current }));
		if (items.length > 1) series = { name: current.series, items };
	}

	const excluded = new Set([current, prev, next]);
	const related = all
		.filter((e) => !excluded.has(e))
		.map((e) => ({
			e,
			score:
				e.tags.filter((t) => current.tags.includes(t)).length * 2 +
				(e.kind === current.kind ? 1 : 0)
		}))
		.filter(({ score }) => score > 0)
		.sort((a, b) => b.score - a.score || b.e.date.getTime() - a.e.date.getTime())
		.slice(0, 3)
		.map(({ e }) => toLink(e));

	return {
		minutes: readingMinutes(current.text),
		tags: current.tags,
		prev: prev && toLink(prev),
		next: next && toLink(next),
		related,
		series
	};
}

export async function tagCounts(): Promise<{ tag: string; count: number }[]> {
	const counts = new Map<string, number>();
	for (const e of await listEntries()) {
		for (const t of e.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
	}
	return [...counts]
		.map(([tag, count]) => ({ tag, count }))
		.sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** The Markdown a post was written in (for finding the links it contains). */
export async function rawMarkdown(entry: ContentEntry): Promise<string> {
	if (entry.kind === 'blog') return rawModules[`/src/lib/content/posts/${entry.slug}.md`] ?? '';
	const row = await db.query.post.findFirst({
		where: and(eq(post.kind, entry.kind), eq(post.slug, entry.slug)),
		columns: { body: true }
	});
	return row?.body ?? '';
}
