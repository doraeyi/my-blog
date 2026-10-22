import { error, json } from '@sveltejs/kit';
import { timingSafeEqual } from 'node:crypto';
import { and, eq, like } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { post } from '$lib/server/db/schema';
import { user } from '$lib/server/db/auth.schema';
import * as postsService from '$lib/server/services/posts-service';
import { redact, type Redaction } from '$lib/server/redact';
import type { RequestHandler } from './$types';

/**
 * Drafts from the /tech-note Claude Code skill:
 *   POST { title, body, excerpt?, tags?, series?, slug? }
 *   Authorization: Bearer <TECH_NOTE_TOKEN>
 * Always lands as an unpublished 技術文章 owned by the site owner, after a
 * redaction pass; review and publish it from /admin/posts. Off until the
 * token is set.
 */
function authorized(header: string | null): boolean {
	const token = env.TECH_NOTE_TOKEN;
	if (!token || !header?.startsWith('Bearer ')) return false;
	const given = Buffer.from(header.slice(7));
	const expected = Buffer.from(token);
	return given.length === expected.length && timingSafeEqual(given, expected);
}

const str = (v: unknown, max: number) =>
	typeof v === 'string' && v.trim() && v.length <= max ? v.trim() : undefined;

function slugify(title: string) {
	const ascii = title
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 60)
		.replace(/-$/, '');
	// Mostly-CJK titles leave little behind; fall back to a dated slug.
	if (ascii.length >= 8) return ascii;
	const d = new Date();
	const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
	return `note-${ymd}${ascii ? `-${ascii}` : ''}`;
}

async function uniqueSlug(base: string) {
	const taken = new Set(
		(
			await db
				.select({ slug: post.slug })
				.from(post)
				.where(and(eq(post.kind, 'article'), like(post.slug, `${base}%`)))
		).map((r) => r.slug)
	);
	if (!taken.has(base)) return base;
	for (let n = 2; ; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
}

export const POST: RequestHandler = async ({ request, url }) => {
	if (!env.TECH_NOTE_TOKEN) throw error(503, 'TECH_NOTE_TOKEN is not set');
	if (!authorized(request.headers.get('authorization'))) throw error(401, 'Unauthorized');

	let input: Record<string, unknown>;
	try {
		input = ((await request.json()) ?? {}) as Record<string, unknown>;
	} catch {
		throw error(400, 'Expected JSON');
	}

	const title = str(input.title, 200);
	const body = str(input.body, 200_000);
	if (!title || !body) throw error(400, 'title and body are required');
	const excerpt = str(input.excerpt, 500);
	const series = str(input.series, 100) ?? null;
	const tags = Array.isArray(input.tags)
		? postsService.parseTags(input.tags.filter((t) => typeof t === 'string').join(','))
		: postsService.parseTags(typeof input.tags === 'string' ? input.tags : '');
	const requestedSlug = str(input.slug, 80)
		?.toLowerCase()
		.replace(/[^a-z0-9-]+/g, '-')
		.replace(/^-|-$/g, '');

	const owner = await db.query.user.findFirst({
		where: eq(user.role, 'Liam'),
		columns: { id: true }
	});
	if (!owner) throw error(500, 'No owner account to file the draft under');

	// Scrub every field that ends up on the page.
	const all: Redaction[] = [];
	const scrub = (s: string) => {
		const r = redact(s);
		for (const x of r.redactions) {
			const hit = all.find((a) => a.rule === x.rule);
			if (hit) hit.count += x.count;
			else all.push({ ...x });
		}
		return r.text;
	};
	const clean = {
		title: scrub(title),
		body: scrub(body),
		excerpt: excerpt ? scrub(excerpt) : undefined
	};

	const slug = await uniqueSlug(requestedSlug || slugify(clean.title));
	const id = await postsService.create({
		kind: 'article',
		slug,
		title: clean.title,
		excerpt: clean.excerpt,
		body: clean.body,
		tags,
		series,
		published: false,
		authorId: owner.id
	});

	return json(
		{
			ok: true,
			id,
			slug,
			editUrl: new URL(`/admin/posts/${id}/edit`, url).href,
			redactions: all
		},
		{ status: 201 }
	);
};
