import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { project, watchItem } from '$lib/server/db/schema';
import { listEntries } from '$lib/server/content-index';

/**
 * Pings the owner's Discord channel (DISCORD_WEBHOOK_URL) when someone leaves
 * a comment or likes something. Fire-and-forget: a slow or failing Discord
 * never blocks or breaks the visitor's action. Off until the webhook is set.
 * The owner's own activity is skipped unless DISCORD_NOTIFY_OWNER=true.
 */

const PAGE_TITLES: Record<string, string> = {
	'/messages': '證詞（留言板）',
	'/friends': '線人名單',
	'/about-site': '本站說明',
	'/history': '結案紀錄'
};

// One like ping per person per thing in this window, so toggling a heart on
// and off doesn't flood the channel.
const LIKE_COOLDOWN_MS = 10 * 60 * 1000;
const recentLikes = new Map<string, number>();

async function titleFor(pathname: string): Promise<string> {
	if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
	try {
		const entry = (await listEntries()).find((e) => e.path === pathname);
		if (entry) return entry.title;
		const [, section, id] = pathname.split('/');
		if (section === 'watch' && id) {
			const row = await db.query.watchItem.findFirst({
				where: eq(watchItem.id, id),
				columns: { title: true }
			});
			if (row) return row.title;
		}
		if (section === 'portfolio' && id) {
			const row = await db.query.project.findFirst({
				where: eq(project.id, id),
				columns: { githubRepo: true }
			});
			if (row) return row.githubRepo;
		}
	} catch {
		// Fall through to the bare path.
	}
	return pathname;
}

/** Who is acting and where, from the current request; null when nothing should be sent. */
function context() {
	if (!env.DISCORD_WEBHOOK_URL) return null;
	let event;
	try {
		event = getRequestEvent();
	} catch {
		return null;
	}
	const user = event.locals.user;
	if (!user) return null;
	if (user.role === 'Liam' && env.DISCORD_NOTIFY_OWNER !== 'true') return null;
	return { user, url: new URL(event.url.pathname, event.url.origin) };
}

function send(payload: object) {
	fetch(env.DISCORD_WEBHOOK_URL!, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ ...payload, allowed_mentions: { parse: [] } }),
		signal: AbortSignal.timeout(5000)
	})
		.then((res) => {
			if (!res.ok) console.warn(`[discord] webhook responded ${res.status}`);
		})
		.catch((err) => console.warn('[discord] webhook failed:', err?.message ?? err));
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export function notifyComment(body: string) {
	const ctx = context();
	if (!ctx) return;
	void titleFor(ctx.url.pathname).then((title) =>
		send({
			embeds: [
				{
					title: `新留言 · ${clip(title, 200)}`,
					url: ctx.url.href,
					description: clip(body, 1500),
					color: 0xb3362b,
					author: {
						name: ctx.user.name,
						...(ctx.user.image ? { icon_url: ctx.user.image } : {})
					},
					footer: { text: `審核：${new URL('/admin/comments', ctx.url).href}` },
					timestamp: new Date().toISOString()
				}
			]
		})
	);
}

export function notifyLike() {
	const ctx = context();
	if (!ctx) return;
	const key = `${ctx.user.id}:${ctx.url.pathname}`;
	const now = Date.now();
	if (now - (recentLikes.get(key) ?? 0) < LIKE_COOLDOWN_MS) return;
	recentLikes.set(key, now);
	if (recentLikes.size > 500) {
		for (const [k, t] of recentLikes) if (now - t >= LIKE_COOLDOWN_MS) recentLikes.delete(k);
	}
	void titleFor(ctx.url.pathname).then((title) =>
		send({
			embeds: [
				{
					description: `**${ctx.user.name}** 按讚了 [${clip(title, 200)}](${ctx.url.href})`,
					color: 0xd4ad6e,
					timestamp: new Date().toISOString()
				}
			]
		})
	);
}
