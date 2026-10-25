import { createHash, randomBytes } from 'node:crypto';
import { and, desc, gte, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { referrerDaily, trafficDaily, visitsDaily } from '$lib/server/db/schema';

/**
 * Site-wide traffic, counted from a beacon the layout sends on every page view
 * (full loads and client-side navigations alike). Only daily rollups are
 * stored: views per page, views per source, and unique visitors per day.
 * Visitors are told apart by a salted hash of IP + user agent that lives in
 * memory for one day and is never written down.
 */

const TZ = 'Asia/Taipei';
export const dayKey = (d = new Date()) => d.toLocaleDateString('sv-SE', { timeZone: TZ });

const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|headless|lighthouse/i;
// Admin, internals, and pages whose URL carries a private token.
const SKIP_PATH =
	/^\/(admin|api|login|logout|og|_app|subscribe\/(confirm|unsubscribe)|friends\/status)(\/|$)/;
const DEDUPE_MS = 30 * 60 * 1000;

let today = '';
let salt = '';
let seenToday = new Set<string>();
const recent = new Map<string, number>();

/** Where a visit came from, in words the dashboard can show. */
export function sourceFor(referrer: string | null, ownHost: string): string | null {
	if (!referrer) return null;
	let host: string;
	try {
		host = new URL(referrer).hostname.replace(/^(www|m|l|lm)\./, '');
	} catch {
		return null;
	}
	if (!host || host === ownHost) return null;
	if (/(^|\.)google\./.test(host)) return 'Google';
	if (/(^|\.)bing\.com$/.test(host)) return 'Bing';
	if (/duckduckgo\.com$/.test(host)) return 'DuckDuckGo';
	if (/threads\.(net|com)$/.test(host)) return 'Threads';
	if (/(facebook\.com|fb\.me)$/.test(host)) return 'Facebook';
	if (/instagram\.com$/.test(host)) return 'Instagram';
	if (/^(t\.co|x\.com|twitter\.com)$/.test(host)) return 'X';
	if (/github\.com$/.test(host)) return 'GitHub';
	if (/linkedin\.com$|lnkd\.in$/.test(host)) return 'LinkedIn';
	if (/(chatgpt\.com|openai\.com|perplexity\.ai|claude\.ai)$/.test(host)) return 'AI 搜尋';
	return host;
}

export async function recordHit(input: {
	path: string;
	referrer: string | null;
	ip: string;
	userAgent: string;
	ownHost: string;
}) {
	const path = input.path.split(/[?#]/)[0].slice(0, 200) || '/';
	if (!path.startsWith('/') || SKIP_PATH.test(path)) return;
	if (!input.userAgent || BOT_UA.test(input.userAgent)) return;

	const day = dayKey();
	if (day !== today) {
		today = day;
		salt = randomBytes(16).toString('hex');
		seenToday = new Set();
		recent.clear();
	}
	const visitor = createHash('sha256')
		.update(`${salt}|${input.ip}|${input.userAgent}`)
		.digest('base64url')
		.slice(0, 16);

	const now = Date.now();
	const key = `${visitor}|${path}`;
	if (now - (recent.get(key) ?? 0) < DEDUPE_MS) return;
	recent.set(key, now);

	const isNewVisitor = !seenToday.has(visitor);
	seenToday.add(visitor);
	const source = sourceFor(input.referrer, input.ownHost);

	db.transaction((tx) => {
		tx.insert(trafficDaily)
			.values({ day, path, views: 1 })
			.onConflictDoUpdate({
				target: [trafficDaily.day, trafficDaily.path],
				set: { views: sql`${trafficDaily.views} + 1` }
			})
			.run();
		tx.insert(visitsDaily)
			.values({ day, views: 1, visitors: isNewVisitor ? 1 : 0 })
			.onConflictDoUpdate({
				target: visitsDaily.day,
				set: {
					views: sql`${visitsDaily.views} + 1`,
					visitors: sql`${visitsDaily.visitors} + ${isNewVisitor ? 1 : 0}`
				}
			})
			.run();
		if (source) {
			tx.insert(referrerDaily)
				.values({ day, source, views: 1 })
				.onConflictDoUpdate({
					target: [referrerDaily.day, referrerDaily.source],
					set: { views: sql`${referrerDaily.views} + 1` }
				})
				.run();
		}
	});
}

/** Everything the dashboard shows for the last `days` days, plus the period before for comparison. */
export async function report(days: number) {
	const start = new Date();
	start.setDate(start.getDate() - (days - 1));
	const prevStart = new Date(start);
	prevStart.setDate(prevStart.getDate() - days);
	const from = dayKey(start);
	const prevFrom = dayKey(prevStart);

	const daily = await db
		.select()
		.from(visitsDaily)
		.where(gte(visitsDaily.day, prevFrom))
		.orderBy(visitsDaily.day);
	const current = daily.filter((d) => d.day >= from);
	const previous = daily.filter((d) => d.day < from);
	const sum = (rows: typeof daily, k: 'views' | 'visitors') => rows.reduce((s, r) => s + r[k], 0);

	// Every day in range, zero-filled so the chart has no gaps.
	const byDay = new Map(current.map((d) => [d.day, d]));
	const series = [];
	for (let i = 0; i < days; i++) {
		const d = new Date(start);
		d.setDate(d.getDate() + i);
		const k = dayKey(d);
		series.push({ day: k, views: byDay.get(k)?.views ?? 0, visitors: byDay.get(k)?.visitors ?? 0 });
	}

	const pages = await db
		.select({ path: trafficDaily.path, views: sql<number>`sum(${trafficDaily.views})` })
		.from(trafficDaily)
		.where(gte(trafficDaily.day, from))
		.groupBy(trafficDaily.path)
		.orderBy(desc(sql`sum(${trafficDaily.views})`))
		.limit(15);

	const sources = await db
		.select({ source: referrerDaily.source, views: sql<number>`sum(${referrerDaily.views})` })
		.from(referrerDaily)
		.where(and(gte(referrerDaily.day, from)))
		.groupBy(referrerDaily.source)
		.orderBy(desc(sql`sum(${referrerDaily.views})`))
		.limit(15);

	return {
		series,
		totals: {
			views: sum(current, 'views'),
			visitors: sum(current, 'visitors'),
			prevViews: sum(previous, 'views'),
			prevVisitors: sum(previous, 'visitors'),
			referred: sources.reduce((s, r) => s + Number(r.views), 0)
		},
		pages: pages.map((p) => ({ path: p.path, views: Number(p.views) })),
		sources: sources.map((s) => ({ source: s.source, views: Number(s.views) }))
	};
}
