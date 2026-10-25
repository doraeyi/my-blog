import { and, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { friend, webmention } from '$lib/server/db/schema';
import { listEntries, rawMarkdown } from '$lib/server/content-index';
import { safeFetch, safePostForm } from '$lib/server/safe-fetch';
import { parseSiteMeta, plainText, decodeEntities } from '$lib/server/feed';
import { SITE_ORIGIN } from '$lib/server/mail';
import { notifyMention } from '$lib/server/discord';

/**
 * Webmention (https://www.w3.org/TR/webmention/): another site tells us "this
 * page of mine links to that post of yours", we fetch their page to check, and
 * show it under the post. Also sends them out: for a post of ours, every site
 * it links to that has a Webmention endpoint gets told.
 */

export type Mention = typeof webmention.$inferSelect;

const OWN_HOST = new URL(SITE_ORIGIN).hostname;
/** Links count when they point at the public domain, wherever this instance runs. */
const OUR_HOSTS = new Set([OWN_HOST, 'blog.doraeyi.com']);

function hostOf(url: string) {
	try {
		return new URL(url).hostname.replace(/^www\./, '');
	} catch {
		return '';
	}
}

/** The post path a target URL points at, or null when it isn't one of our posts. */
async function postPath(target: string): Promise<string | null> {
	let url: URL;
	try {
		url = new URL(target);
	} catch {
		return null;
	}
	if (!OUR_HOSTS.has(url.hostname)) return null;
	const path = decodeURI(url.pathname).replace(/\/+$/, '');
	return (await listEntries()).some((e) => e.path === path) ? path : null;
}

async function friendFor(source: string) {
	const host = hostOf(source);
	const rows = await db
		.select({ id: friend.id, name: friend.name, url: friend.url, avatar: friend.avatar })
		.from(friend)
		.where(eq(friend.status, 'approved'));
	return rows.find((f) => hostOf(f.url) === host) ?? null;
}

// ── Receiving ────────────────────────────────────────────────────────────────

/** Accepts a Webmention request and verifies it in the background. */
export async function receive(source: string, target: string) {
	if (!/^https?:\/\//i.test(source)) throw new Error('source must be an http(s) URL');
	if (source === target) throw new Error('source and target are the same');
	if (OUR_HOSTS.has(hostOf(source))) throw new Error('source is on this site');
	const path = await postPath(target);
	if (!path) throw new Error('target is not a post on this site');

	const [row] = await db
		.insert(webmention)
		.values({ source, target: path })
		.onConflictDoUpdate({
			target: [webmention.source, webmention.target],
			set: { status: 'pending' }
		})
		.returning();
	void verify(row!.id).catch((err) => console.warn('[webmention] verify failed', err));
}

/** Where on their page our link sits: the anchor tag and the text around it. */
function findLink(html: string, path: string) {
	const targets = [SITE_ORIGIN, ...[...OUR_HOSTS].map((h) => `https://${h}`)].map(
		(origin) => `${origin}${path}`
	);
	const anchors = html.match(/<a\b[^>]*>/gi) ?? [];
	for (const a of anchors) {
		const href = decodeEntities(a.match(/href\s*=\s*["']([^"']+)["']/i)?.[1] ?? '').replace(
			/[#?].*$|\/$/,
			''
		);
		if (!targets.includes(href)) continue;
		const at = html.indexOf(a);
		const before = plainText(html.slice(Math.max(0, at - 1200), at), 10_000);
		const after = plainText(html.slice(at, at + 1200), 10_000);
		const snippet = `${before.slice(-70)}${after.slice(0, 90)}`.trim();
		const cls = a.match(/class\s*=\s*["']([^"']+)["']/i)?.[1] ?? '';
		const kind = /u-in-reply-to/.test(cls)
			? 'reply'
			: /u-like-of/.test(cls)
				? 'like'
				: /u-repost-of/.test(cls)
					? 'repost'
					: 'mention';
		return { snippet, kind } as const;
	}
	return null;
}

export async function verify(id: string) {
	const row = await db.query.webmention.findFirst({ where: eq(webmention.id, id) });
	if (!row) return;
	let res;
	try {
		res = await safeFetch(row.source, { accept: 'text/html' });
	} catch {
		await db.update(webmention).set({ status: 'invalid' }).where(eq(webmention.id, id));
		return;
	}
	// Gone, or no longer links here: the mention is withdrawn.
	const found = res.status < 400 ? findLink(res.body, row.target) : null;
	if (!found) {
		await db.update(webmention).set({ status: 'invalid' }).where(eq(webmention.id, id));
		return;
	}
	const meta = parseSiteMeta(res.body, res.url);
	const ogTitle = res.body.match(
		/<meta[^>]+property\s*=\s*["']og:title["'][^>]+content\s*=\s*["']([^"']+)["']/i
	)?.[1];
	const pageTitle = res.body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
	const f = await friendFor(row.source);
	const wasNew = row.status !== 'verified' && row.status !== 'hidden';
	await db
		.update(webmention)
		.set({
			status: row.status === 'hidden' ? 'hidden' : 'verified',
			kind: found.kind,
			title: plainText(decodeEntities(ogTitle ?? pageTitle ?? ''), 120) || null,
			excerpt: found.snippet || null,
			authorName: f?.name ?? meta.title ?? hostOf(row.source),
			authorUrl: f?.url ?? new URL('/', res.url).href,
			authorPhoto: f?.avatar ?? meta.icon ?? new URL('/favicon.ico', res.url).href,
			friendId: f?.id ?? null,
			verifiedAt: new Date()
		})
		.where(eq(webmention.id, id));
	if (wasNew) notifyMention(row.target, f?.name ?? hostOf(row.source), row.source);
}

/**
 * A friend's feed post that links to one of our posts counts as a mention too,
 * so friends whose blogs don't speak Webmention still show up.
 */
export async function recordFromFriendFeed(
	f: { id: string; name: string; url: string; avatar: string | null },
	item: { url: string; title: string; summary: string | null; html: string }
) {
	const links = item.html.match(/https?:\/\/[^\s"'<>)]+/g) ?? [];
	for (const link of new Set(links)) {
		const path = await postPath(link.replace(/[#?].*$/, ''));
		if (!path) continue;
		const existing = await db.query.webmention.findFirst({
			where: and(eq(webmention.source, item.url), eq(webmention.target, path))
		});
		if (existing) continue;
		await db.insert(webmention).values({
			source: item.url,
			target: path,
			status: 'verified',
			title: item.title,
			excerpt: item.summary,
			authorName: f.name,
			authorUrl: f.url,
			authorPhoto: f.avatar,
			friendId: f.id,
			verifiedAt: new Date()
		});
		notifyMention(path, f.name, item.url);
	}
}

export function listFor(path: string) {
	return db.query.webmention.findMany({
		where: and(eq(webmention.target, path), eq(webmention.status, 'verified')),
		orderBy: desc(webmention.verifiedAt)
	});
}

// ── Admin ────────────────────────────────────────────────────────────────────

export function listAll() {
	return db.query.webmention.findMany({ orderBy: desc(webmention.createdAt), limit: 200 });
}

export async function setHidden(id: string, hidden: boolean) {
	await db
		.update(webmention)
		.set({ status: hidden ? 'hidden' : 'verified' })
		.where(eq(webmention.id, id));
}

export async function remove(id: string) {
	await db.delete(webmention).where(eq(webmention.id, id));
}

// ── Sending ──────────────────────────────────────────────────────────────────

async function discoverEndpoint(target: string): Promise<string | null> {
	const res = await safeFetch(target, { accept: 'text/html', timeoutMs: 6000 });
	const fromHeader = res.link.match(/<([^>]+)>\s*;[^,]*rel\s*=\s*"?[^",]*\bwebmention\b/i)?.[1];
	const fromHtml =
		res.body.match(/<(?:link|a)\b[^>]*rel\s*=\s*["'][^"']*\bwebmention\b[^"']*["'][^>]*>/i)?.[0] ??
		null;
	const href =
		fromHeader ?? (fromHtml ? fromHtml.match(/href\s*=\s*["']([^"']*)["']/i)?.[1] : null);
	return href != null ? new URL(decodeEntities(href), res.url).href : null;
}

/** Tells every outside page a post links to that it was mentioned. Returns what happened per link. */
export async function sendFor(path: string) {
	const entry = (await listEntries()).find((e) => e.path === path);
	if (!entry) throw new Error('找不到這篇文章');
	const markdown = await rawMarkdown(entry);
	const links = [
		...new Set(
			(markdown.match(/https?:\/\/[^\s)"'<>\]]+/g) ?? [])
				.map((l) => l.replace(/[.,;:!?。，]+$/, ''))
				.filter((l) => hostOf(l) && !OUR_HOSTS.has(hostOf(l)))
		)
	].slice(0, 30);
	const source = `${SITE_ORIGIN}${entry.path}`;
	const results: { target: string; result: string }[] = [];
	for (const target of links) {
		try {
			const endpoint = await discoverEndpoint(target);
			if (!endpoint) {
				results.push({ target, result: '對方不支援' });
				continue;
			}
			const status = await safePostForm(endpoint, { source, target });
			results.push({ target, result: status < 300 ? '已通知' : `失敗（${status}）` });
		} catch (err) {
			results.push({ target, result: err instanceof Error ? err.message : '失敗' });
		}
	}
	return results;
}
