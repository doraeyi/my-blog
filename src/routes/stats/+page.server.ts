import type { PageServerLoad } from './$types';
import { listEntries, kindLabel, type EntryKind } from '$lib/server/content-index';
import * as thoughtsService from '$lib/server/services/thoughts-service';
import { countsFor } from '$lib/server/services/views-service';
import { readingMinutes } from '$lib/format';

const TZ = 'Asia/Taipei';
const dayKey = (d: Date) => d.toLocaleDateString('sv-SE', { timeZone: TZ });

/** Characters for CJK, words for Latin — what a reader would call 字數. */
function wordCount(text: string) {
	const cjk = text.match(/[㐀-鿿豈-﫿]/g)?.length ?? 0;
	const latin = text.replace(/[㐀-鿿豈-﫿]/g, ' ').match(/[A-Za-z0-9]+/g)?.length ?? 0;
	return cjk + latin;
}

export const load: PageServerLoad = async () => {
	const [entries, thoughts] = await Promise.all([listEntries(), thoughtsService.list()]);
	const views = await countsFor(entries.map((e) => e.key));

	// ── Heatmap: the last 53 weeks, Sunday-started columns, ending this week.
	const perDay = new Map<string, { posts: number; thoughts: number; titles: string[] }>();
	const bump = (d: Date, field: 'posts' | 'thoughts', title?: string) => {
		const k = dayKey(d);
		const cell = perDay.get(k) ?? { posts: 0, thoughts: 0, titles: [] };
		cell[field]++;
		if (title) cell.titles.push(title);
		perDay.set(k, cell);
	};
	for (const e of entries) bump(e.date, 'posts', e.title);
	for (const t of thoughts) bump(t.createdAt, 'thoughts');

	const today = new Date(`${dayKey(new Date())}T00:00:00Z`);
	const start = new Date(today);
	start.setUTCDate(start.getUTCDate() - today.getUTCDay() - 52 * 7);
	const days: { date: string; posts: number; thoughts: number; titles: string[] }[] = [];
	for (const d = new Date(start); d <= today; d.setUTCDate(d.getUTCDate() + 1)) {
		const k = d.toISOString().slice(0, 10);
		days.push({ date: k, ...(perDay.get(k) ?? { posts: 0, thoughts: 0, titles: [] }) });
	}

	// ── Streaks, in weeks: a week counts when anything at all was written in it.
	const weekOf = (k: string) => {
		const d = new Date(`${k}T00:00:00Z`);
		d.setUTCDate(d.getUTCDate() - d.getUTCDay());
		return d.toISOString().slice(0, 10);
	};
	const activeWeeks = new Set([...perDay.keys()].map(weekOf));
	const sortedWeeks = [...activeWeeks].sort();
	let longest = 0;
	let run = 0;
	let prev: string | null = null;
	for (const w of sortedWeeks) {
		const gap = prev ? (Date.parse(w) - Date.parse(prev)) / (7 * 864e5) : 1;
		run = gap === 1 ? run + 1 : 1;
		longest = Math.max(longest, run);
		prev = w;
	}
	let current = 0;
	for (
		let w = new Date(`${weekOf(dayKey(new Date()))}T00:00:00Z`);
		activeWeeks.has(w.toISOString().slice(0, 10));
		w.setUTCDate(w.getUTCDate() - 7)
	)
		current++;

	// ── Totals.
	const words = entries.map((e) => ({ e, n: wordCount(e.text) }));
	const totalWords = words.reduce((s, w) => s + w.n, 0);
	const byKind = (['article', 'blog', 'mood'] as EntryKind[]).map((kind) => ({
		kind,
		label: kindLabel[kind],
		count: entries.filter((e) => e.kind === kind).length
	}));

	// ── Tags, months.
	const tagCounts = new Map<string, number>();
	for (const e of entries) for (const t of e.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
	const tags = [...tagCounts]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 18)
		.map(([tag, count]) => ({ tag, count }));

	const months: { label: string; count: number }[] = [];
	for (let i = 11; i >= 0; i--) {
		const d = new Date(today);
		d.setUTCDate(1);
		d.setUTCMonth(d.getUTCMonth() - i);
		const key = d.toISOString().slice(0, 7);
		months.push({
			label: `${d.getUTCMonth() + 1}月`,
			count: entries.filter((e) => dayKey(e.date).startsWith(key)).length
		});
	}

	const link = (e: (typeof entries)[number]) => ({ title: e.title, path: e.path, date: e.date });
	const longestPost = words.sort((a, b) => b.n - a.n)[0];
	const mostRead = [...entries].sort(
		(a, b) => (views.get(b.key) ?? 0) - (views.get(a.key) ?? 0)
	)[0];

	return {
		days,
		totals: {
			files: entries.length,
			thoughts: thoughts.length,
			words: totalWords,
			minutes: entries.reduce((s, e) => s + readingMinutes(e.text), 0),
			views: [...views.values()].reduce((s, n) => s + n, 0),
			activeDays: [...perDay.keys()].length,
			since: entries.at(-1)?.date ?? null
		},
		streak: { longest, current },
		byKind,
		tags,
		months,
		records: {
			longest: longestPost ? { ...link(longestPost.e), value: longestPost.n } : null,
			mostRead: mostRead ? { ...link(mostRead), value: views.get(mostRead.key) ?? 0 } : null,
			latest: entries[0] ? link(entries[0]) : null
		}
	};
};
