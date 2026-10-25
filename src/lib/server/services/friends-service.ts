import { and, asc, desc, eq, inArray, notInArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { friend, friendPost } from '$lib/server/db/schema';
import { safeFetch } from '$lib/server/safe-fetch';
import { notifyFriendApplication } from '$lib/server/discord';
import * as webmentionService from '$lib/server/services/webmention-service';
import { SITE_ORIGIN, layout, mailEnabled, paragraph, sendMail } from '$lib/server/mail';
import {
	FEED_GUESSES,
	looksLikeFeed,
	parseFeed,
	parseSiteMeta,
	type SiteMeta
} from '$lib/server/feed';

export type Friend = typeof friend.$inferSelect;
export type FriendPost = typeof friendPost.$inferSelect;

/** This blog's host; a friend's page "links back" when it mentions it. */
export const OWN_HOST = 'blog.doraeyi.com';
/** A friend counts as 失聯 after this long without a successful check. */
export const LOST_AFTER_MS = 3 * 24 * 60 * 60 * 1000;
const REFRESH_EVERY_MS = 3 * 60 * 60 * 1000;
const POSTS_PER_FRIEND = 15;

// ── reading ──────────────────────────────────────────────────────────────────

export function isLost(
	f: Pick<Friend, 'checkedAt' | 'lastOkAt' | 'approvedAt' | 'createdAt'>,
	now = Date.now()
): boolean {
	if (!f.checkedAt) return false;
	// Never reached yet: count from when they joined, not from 1970.
	const since = (f.lastOkAt ?? f.approvedAt ?? f.createdAt).getTime();
	return f.checkedAt.getTime() > since && now - since > LOST_AFTER_MS;
}

/** Approved friends with their newest post, in display order. */
export async function listPublic() {
	const rows = await db.query.friend.findMany({
		where: eq(friend.status, 'approved'),
		orderBy: [asc(friend.sortOrder), asc(friend.approvedAt)],
		with: { posts: { orderBy: desc(friendPost.publishedAt), limit: 1 } }
	});
	// Only what the public page shows: no email, status token or private note.
	return rows.map((f) => ({
		id: f.id,
		name: f.name,
		url: f.url,
		avatar: f.avatar,
		description: f.description,
		feedUrl: f.feedUrl,
		groupName: f.groupName,
		backlinkOk: f.backlinkOk,
		checkedAt: f.checkedAt,
		latencyMs: f.latencyMs,
		latest: f.posts[0] ?? null,
		lost: isLost(f)
	}));
}

/** 朋友圈: newest posts from approved friends who joined it. */
export async function listCircle(limit = 120) {
	const members = await db
		.select({
			id: friend.id,
			name: friend.name,
			url: friend.url,
			avatar: friend.avatar,
			feedFetchedAt: friend.feedFetchedAt
		})
		.from(friend)
		.where(and(eq(friend.status, 'approved'), eq(friend.joinCircle, true)));
	if (members.length === 0) return { members: [], posts: [] };
	const posts = await db
		.select()
		.from(friendPost)
		.where(
			inArray(
				friendPost.friendId,
				members.map((m) => m.id)
			)
		)
		.orderBy(desc(friendPost.publishedAt))
		.limit(limit);
	return { members, posts };
}

export function listAll() {
	return db.query.friend.findMany({
		orderBy: [asc(friend.sortOrder), desc(friend.createdAt)],
		with: { posts: { columns: { id: true } } }
	});
}

export function getByToken(token: string) {
	return db.query.friend.findFirst({ where: eq(friend.token, token) });
}

// ── writing ──────────────────────────────────────────────────────────────────

export interface FriendInput {
	name: string;
	url: string;
	avatar?: string | null;
	description: string;
	email?: string | null;
	feedUrl?: string | null;
	backlinkUrl?: string | null;
	joinCircle?: boolean;
}

function normalizeUrl(
	raw: string | null | undefined,
	label: string,
	required = false
): string | null {
	const value = raw?.trim();
	if (!value) {
		if (required) throw new Error(`請填寫${label}`);
		return null;
	}
	let url: URL;
	try {
		url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
	} catch {
		throw new Error(`${label}看起來不是網址`);
	}
	if (url.protocol !== 'https:' && url.protocol !== 'http:')
		throw new Error(`${label}要是 http(s) 網址`);
	if (value.length > 300) throw new Error(`${label}太長了`);
	url.hash = '';
	return url.href;
}

/** Validated, trimmed values ready for the table. */
export function clean(input: FriendInput) {
	const name = input.name.trim();
	const description = input.description.trim();
	if (!name) throw new Error('請填寫網站名稱');
	if (name.length > 40) throw new Error('網站名稱最多 40 字');
	if (!description) throw new Error('請填寫一句話介紹');
	if (description.length > 120) throw new Error('介紹最多 120 字');
	const email = input.email?.trim() || null;
	if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Email 格式不對');
	const url = normalizeUrl(input.url, '網站網址', true)!;
	if (new URL(url).hostname === OWN_HOST) throw new Error('這是本站喔');
	return {
		name,
		url,
		description,
		email,
		avatar: normalizeUrl(input.avatar, '頭像網址'),
		feedUrl: normalizeUrl(input.feedUrl, 'RSS 網址'),
		backlinkUrl: normalizeUrl(input.backlinkUrl, '友鏈頁網址'),
		joinCircle: input.joinCircle ?? true
	};
}

/** Same site regardless of trailing slash or www. */
function siteKey(url: string) {
	const u = new URL(url);
	return u.hostname.replace(/^www\./, '') + u.pathname.replace(/\/+$/, '');
}

async function assertNew(url: string, exceptId?: string) {
	const key = siteKey(url);
	const rows = await db
		.select({ id: friend.id, url: friend.url, status: friend.status })
		.from(friend);
	const dup = rows.find((r) => r.id !== exceptId && siteKey(r.url) === key);
	if (dup) {
		throw new Error(
			dup.status === 'pending' ? '這個網站已經申請過了，正在等審核' : '這個網站已經在名單裡了'
		);
	}
}

/** Emails the applicant about their application; best effort, never blocks the action. */
function mailApplicant(
	f: Pick<Friend, 'email' | 'name' | 'token'>,
	what: 'received' | 'approved' | 'rejected',
	note: string | null = null
) {
	if (!f.email || !mailEnabled()) return;
	const statusUrl = `${SITE_ORIGIN}/friends/status/${f.token}`;
	const copy = {
		received: {
			subject: `收到你的友鏈申請：${f.name}`,
			heading: '友鏈申請收到了',
			lines: [
				'謝謝你想跟我交換友鏈！我會盡快看，結果出來時會再寄信給你。',
				'這段期間可以從下面的連結看審核進度，以及系統自動幫你做的檢查。'
			],
			button: '查看申請進度'
		},
		approved: {
			subject: `友鏈申請通過：${f.name}`,
			heading: '歡迎加入線人名單',
			lines: [
				'你的網站已經掛上 Liam 偵探手記的友鏈頁了。',
				'如果有填 RSS，你的新文章也會出現在朋友圈。之後有任何資料要改，回信告訴我就好。'
			],
			button: '看看你的卡片'
		},
		rejected: {
			subject: `友鏈申請結果：${f.name}`,
			heading: '這次的友鏈申請沒有通過',
			lines: [
				'謝謝你的申請，這次先不交換。',
				...(note ? [`原因：${note}`] : []),
				'如果之後情況有變，歡迎再申請一次。'
			],
			button: '查看申請紀錄'
		}
	}[what];
	sendMail({
		to: f.email,
		subject: copy.subject,
		text: `${copy.lines.join('\n')}\n\n${statusUrl}`,
		html: layout({
			preheader: copy.lines[0],
			heading: copy.heading,
			body: copy.lines.map(paragraph).join(''),
			button: {
				label: copy.button,
				href: what === 'approved' ? `${SITE_ORIGIN}/friends` : statusUrl
			},
			footer: '這封信是因為你在 Liam 偵探手記申請了友鏈。'
		})
	}).catch((err) => console.warn('[friends] mail failed:', err?.message ?? err));
}

// Per-IP throttle for the public form: a handful of applications an hour.
const APPLY_LIMIT = 3;
const APPLY_WINDOW_MS = 60 * 60 * 1000;
const recentApplies = new Map<string, number[]>();

export async function apply(input: FriendInput, ip: string) {
	const now = Date.now();
	const times = (recentApplies.get(ip) ?? []).filter((t) => now - t < APPLY_WINDOW_MS);
	if (times.length >= APPLY_LIMIT) throw new Error('送出太多次了，過一小時再試試');
	const values = clean(input);
	if (!values.email) throw new Error('請留一個 email，審核有問題時才聯絡得到你');
	if (!values.avatar) throw new Error('請填寫頭像網址');
	await assertNew(values.url);
	recentApplies.set(ip, [...times, now]);
	const [row] = await db
		.insert(friend)
		.values({ ...values, status: 'pending' })
		.returning();
	notifyFriendApplication(row);
	mailApplicant(row, 'received');
	// Check right away so the review queue already shows reachability and the backlink.
	void checkFriend(row.id).catch(() => {});
	return row;
}

export async function create(input: FriendInput & { groupName?: string }) {
	const values = clean(input);
	await assertNew(values.url);
	const [row] = await db
		.insert(friend)
		.values({
			...values,
			groupName: input.groupName?.trim() || '朋友',
			status: 'approved',
			approvedAt: new Date()
		})
		.returning();
	void checkFriend(row.id).catch(() => {});
	return row;
}

export async function update(
	id: string,
	input: FriendInput & { groupName?: string; sortOrder?: number; adminNote?: string | null }
) {
	const values = clean(input);
	await assertNew(values.url, id);
	await db
		.update(friend)
		.set({
			...values,
			groupName: input.groupName?.trim() || '朋友',
			sortOrder: input.sortOrder ?? 0,
			adminNote: input.adminNote?.trim() || null
		})
		.where(eq(friend.id, id));
}

export async function setStatus(id: string, status: Friend['status'], reviewNote?: string | null) {
	const row = await db.query.friend.findFirst({ where: eq(friend.id, id) });
	if (!row) throw new Error('找不到這個朋友');
	// Tell the applicant how the review went — only when deciding a pending application.
	if (row.status === 'pending' && (status === 'approved' || status === 'rejected'))
		mailApplicant(row, status === 'approved' ? 'approved' : 'rejected', reviewNote ?? null);
	await db
		.update(friend)
		.set({
			status,
			...(reviewNote !== undefined ? { reviewNote: reviewNote?.trim() || null } : {}),
			...(status === 'approved' && !row.approvedAt ? { approvedAt: new Date() } : {})
		})
		.where(eq(friend.id, id));
	if (status === 'approved') void checkFriend(id).catch(() => {});
}

export async function remove(id: string) {
	await db.delete(friend).where(eq(friend.id, id));
}

// ── checking ─────────────────────────────────────────────────────────────────

/** Title, description, icon and feed of a site, for filling in the form. */
export async function discover(rawUrl: string): Promise<SiteMeta & { url: string }> {
	const url = normalizeUrl(rawUrl, '網站網址', true)!;
	const res = await safeFetch(url, { accept: 'text/html' });
	if (res.status >= 400) throw new Error(`網站回應 ${res.status}`);
	const meta = parseSiteMeta(res.body, res.url);
	if (!meta.icon) meta.icon = new URL('/favicon.ico', res.url).href;
	if (!meta.feedUrl) meta.feedUrl = await guessFeed(res.url);
	return { ...meta, url };
}

async function guessFeed(site: string): Promise<string | null> {
	for (const path of FEED_GUESSES) {
		const candidate = new URL(path, site).href;
		try {
			const res = await safeFetch(candidate, { timeoutMs: 5000, maxBytes: 4000 });
			if (res.status < 400 && looksLikeFeed(res.body)) return res.url;
		} catch {
			// Try the next spot.
		}
	}
	return null;
}

/** Reachability, backlink and (for circle members) the newest posts of one friend. */
export async function checkFriend(id: string) {
	const f = await db.query.friend.findFirst({ where: eq(friend.id, id) });
	if (!f) return;
	const now = new Date();
	const patch: Partial<typeof friend.$inferInsert> = { checkedAt: now };

	let homepage = '';
	let homeUrl = f.url;
	try {
		const res = await safeFetch(f.url, { accept: 'text/html' });
		patch.httpStatus = res.status;
		patch.latencyMs = res.latencyMs;
		homepage = res.body;
		homeUrl = res.url;
		if (res.status < 400) patch.lastOkAt = now;
	} catch {
		patch.httpStatus = 0;
		patch.latencyMs = null;
	}

	// Backlink: their link page if they gave one, otherwise the homepage.
	try {
		const page = f.backlinkUrl
			? (await safeFetch(f.backlinkUrl, { accept: 'text/html' })).body
			: homepage;
		patch.backlinkOk = page ? page.includes(OWN_HOST) : null;
	} catch {
		patch.backlinkOk = null;
	}

	if (f.joinCircle) {
		try {
			let feedUrl = f.feedUrl;
			if (!feedUrl && homepage)
				feedUrl = parseSiteMeta(homepage, homeUrl).feedUrl ?? (await guessFeed(homeUrl));
			if (!feedUrl) throw new Error('找不到 RSS');
			const res = await safeFetch(feedUrl, {
				accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml'
			});
			if (res.status >= 400) throw new Error(`RSS 回應 ${res.status}`);
			const items = parseFeed(res.body, res.url, POSTS_PER_FRIEND);
			if (items.length === 0) throw new Error('RSS 裡沒有文章');
			patch.feedUrl = f.feedUrl ?? feedUrl;
			patch.feedFetchedAt = now;
			patch.feedError = null;
			db.transaction((tx) => {
				for (const item of items) {
					tx.insert(friendPost)
						.values({
							friendId: f.id,
							title: item.title,
							url: item.url,
							summary: item.summary,
							publishedAt: item.publishedAt
						})
						.onConflictDoUpdate({
							target: [friendPost.friendId, friendPost.url],
							set: { title: item.title, summary: item.summary, publishedAt: item.publishedAt }
						})
						.run();
				}
				// Keep only what's still in the feed.
				tx.delete(friendPost)
					.where(
						and(
							eq(friendPost.friendId, f.id),
							notInArray(
								friendPost.url,
								items.map((i) => i.url)
							)
						)
					)
					.run();
			});
			// Their posts that link to ours show up under our post as mentions.
			if (f.status === 'approved') {
				for (const item of items) {
					await webmentionService
						.recordFromFriendFeed(f, item)
						.catch((err) => console.warn('[friends] mention failed', err));
				}
			}
		} catch (err) {
			patch.feedError = err instanceof Error ? err.message.slice(0, 120) : 'RSS 讀取失敗';
		}
	}

	await db.update(friend).set(patch).where(eq(friend.id, f.id));
}

let running: Promise<void> | null = null;
let lastRun = 0;

/** Checks every approved and pending friend, three at a time. */
export function refreshAll(): Promise<void> {
	running ??= (async () => {
		try {
			const rows = await db
				.select({ id: friend.id })
				.from(friend)
				.where(inArray(friend.status, ['approved', 'pending']));
			const queue = rows.map((r) => r.id);
			await Promise.all(
				Array.from({ length: 3 }, async () => {
					for (let id = queue.shift(); id; id = queue.shift()) {
						await checkFriend(id).catch((err) => console.warn('[friends] check failed', id, err));
					}
				})
			);
			lastRun = Date.now();
		} finally {
			running = null;
		}
	})();
	return running;
}

/** Kicks off a background refresh when the last one is stale; never waits for it. */
export async function refreshIfStale() {
	if (running) return;
	if (!lastRun) {
		const [row] = await db
			.select({ at: friend.checkedAt })
			.from(friend)
			.where(eq(friend.status, 'approved'))
			.orderBy(asc(friend.checkedAt))
			.limit(1);
		lastRun = row?.at?.getTime() ?? 0;
		if (!row) return;
	}
	if (Date.now() - lastRun > REFRESH_EVERY_MS) void refreshAll();
}

export function lastRefreshed(): Date | null {
	return lastRun ? new Date(lastRun) : null;
}
