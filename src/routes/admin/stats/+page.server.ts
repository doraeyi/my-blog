import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { friend } from '$lib/server/db/schema';
import { listEntries } from '$lib/server/content-index';
import { countsFor } from '$lib/server/services/views-service';
import * as trafficService from '$lib/server/services/traffic-service';

const RANGES = [7, 30, 90];

/** Titles for the fixed pages; posts get theirs from the content index. */
const PAGE_TITLES: Record<string, string> = {
	'/': '封面',
	'/blog': '文章',
	'/about': '關於我',
	'/english': 'English profile',
	'/friends': '線人名單',
	'/friends/circle': '朋友圈',
	'/messages': '留言板',
	'/stats': '案件統計',
	'/board': '證物牆',
	'/portfolio': '作品集',
	'/watch': '追劇',
	'/thinking': '碎念',
	'/now': '現在',
	'/setup': '裝備',
	'/archive': '時間軸',
	'/tags': '標籤索引'
};

export const load: PageServerLoad = async ({ url }) => {
	const asked = Number(url.searchParams.get('days'));
	const days = RANGES.includes(asked) ? asked : 30;

	const [report, entries, friends] = await Promise.all([
		trafficService.report(days),
		listEntries(),
		db
			.select({ name: friend.name, url: friend.url })
			.from(friend)
			.where(eq(friend.status, 'approved'))
	]);

	const titles = new Map(entries.map((e) => [e.path, e.title]));
	const friendByHost = new Map(
		friends.map((f) => [new URL(f.url).hostname.replace(/^www\./, ''), f.name])
	);

	// All-time reads per post (counted since the site started, before this dashboard existed).
	const views = await countsFor(entries.map((e) => e.key));
	const allTime = entries
		.map((e) => ({ title: e.title, path: e.path, views: views.get(e.key) ?? 0 }))
		.filter((e) => e.views > 0)
		.sort((a, b) => b.views - a.views)
		.slice(0, 10);

	return {
		days,
		ranges: RANGES,
		...report,
		pages: report.pages.map((p) => ({
			...p,
			title: titles.get(p.path) ?? PAGE_TITLES[p.path] ?? null
		})),
		sources: report.sources.map((s) => ({ ...s, friend: friendByHost.get(s.source) ?? null })),
		allTime
	};
};
