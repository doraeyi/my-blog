import { desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { newsletterIssue, subscriber } from '$lib/server/db/schema';
import { listEntries, kindLabel } from '$lib/server/content-index';
import { escapeXml as esc } from '$lib/server/xml';
import { SITE_ORIGIN, layout, paragraph, sendMail, sendMany } from '$lib/server/mail';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RESEND_CONFIRM_AFTER_MS = 10 * 60 * 1000;

// Per-IP throttle on the public form.
const LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;
const recent = new Map<string, number[]>();

const confirmUrl = (token: string) => `${SITE_ORIGIN}/subscribe/confirm/${token}`;
const unsubscribeUrl = (token: string) => `${SITE_ORIGIN}/subscribe/unsubscribe/${token}`;

function unsubscribeFooter(token: string) {
	return `你會收到這封信，是因為你訂閱了 Liam 偵探手記。<a href="${unsubscribeUrl(token)}" style="color:#8a6d45">取消訂閱</a>只要按一下。`;
}

/**
 * Starts a subscription. Always answers the same way whether or not the address
 * is already on the list, so the form can't be used to find out who subscribes.
 */
export async function subscribe(rawEmail: string, ip: string) {
	const email = rawEmail.trim().toLowerCase();
	if (!EMAIL.test(email) || email.length > 200) throw new Error('Email 格式不對');

	const now = Date.now();
	const times = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
	if (times.length >= LIMIT) throw new Error('送出太多次了，過一陣子再試');
	recent.set(ip, [...times, now]);

	const existing = await db.query.subscriber.findFirst({ where: eq(subscriber.email, email) });
	if (existing?.status === 'active') return;
	if (existing?.confirmSentAt && now - existing.confirmSentAt.getTime() < RESEND_CONFIRM_AFTER_MS)
		return;

	const [row] = existing ? [existing] : await db.insert(subscriber).values({ email }).returning();
	if (!row) throw new Error('訂閱失敗，稍後再試');
	await db
		.update(subscriber)
		.set({ status: 'pending', confirmSentAt: new Date() })
		.where(eq(subscriber.id, row.id));

	await sendMail({
		to: email,
		subject: '確認訂閱 Liam 偵探手記',
		text: `按下這個連結完成訂閱：${confirmUrl(row.token)}\n\n如果不是你本人申請的，忽略這封信就好，不會收到任何東西。`,
		html: layout({
			preheader: '按一下確認，之後有新文章就會寄給你。',
			heading: '再一步就訂閱好了',
			body:
				paragraph('有人（希望是你）用這個信箱訂閱了 Liam 偵探手記。') +
				paragraph('按下面的按鈕確認，之後有新文章就會寄給你，大概一個月幾封，不會更多。'),
			button: { label: '確認訂閱', href: confirmUrl(row.token) },
			footer: '如果不是你本人申請的，忽略這封信就好，不會收到任何東西。'
		})
	});
}

export async function confirm(token: string) {
	const row = await db.query.subscriber.findFirst({ where: eq(subscriber.token, token) });
	if (!row) return null;
	if (row.status !== 'active')
		await db
			.update(subscriber)
			.set({ status: 'active', confirmedAt: new Date() })
			.where(eq(subscriber.id, row.id));
	return row.email;
}

export async function findByToken(token: string) {
	return db.query.subscriber.findFirst({ where: eq(subscriber.token, token) });
}

export async function unsubscribe(token: string) {
	const row = await findByToken(token);
	if (!row) return null;
	await db.update(subscriber).set({ status: 'unsubscribed' }).where(eq(subscriber.id, row.id));
	return row.email;
}

// ── Admin ────────────────────────────────────────────────────────────────────

export function listSubscribers() {
	return db.query.subscriber.findMany({ orderBy: desc(subscriber.createdAt) });
}

export async function removeSubscriber(id: string) {
	await db.delete(subscriber).where(eq(subscriber.id, id));
}

/** Recent posts, each marked with whether (and to how many) it already went out. */
export async function listIssues() {
	const [entries, sent] = await Promise.all([listEntries(), db.select().from(newsletterIssue)]);
	const byKey = new Map(sent.map((s) => [s.key, s]));
	return entries.slice(0, 15).map((e) => ({
		key: e.key,
		title: e.title,
		path: e.path,
		kind: kindLabel[e.kind],
		date: e.date,
		sent: byKey.get(e.key) ?? null
	}));
}

function issueMail(e: Awaited<ReturnType<typeof listEntries>>[number], token: string) {
	const url = `${SITE_ORIGIN}${e.path}`;
	const excerpt = e.excerpt || e.text.slice(0, 160) + (e.text.length > 160 ? '…' : '');
	return {
		subject: `新${kindLabel[e.kind]}：${e.title}`,
		text: `${e.title}\n\n${excerpt}\n\n閱讀全文：${url}\n\n取消訂閱：${unsubscribeUrl(token)}`,
		html: layout({
			preheader: excerpt,
			heading: e.title,
			body:
				`<p style="margin:0 0 12px;font:12px monospace;letter-spacing:2px;color:#b3362b">${esc(kindLabel[e.kind])} · ${e.date.toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' })}</p>` +
				paragraph(excerpt),
			button: { label: '閱讀全文', href: url },
			footer: unsubscribeFooter(token)
		}),
		headers: {
			'List-Unsubscribe': `<${unsubscribeUrl(token)}>`,
			'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
		}
	};
}

/** Emails one post to every active subscriber, once. */
export async function sendIssue(key: string) {
	if (await db.query.newsletterIssue.findFirst({ where: eq(newsletterIssue.key, key) }))
		throw new Error('這篇已經寄過了');
	const entry = (await listEntries()).find((e) => e.key === key);
	if (!entry) throw new Error('找不到這篇文章（要先發佈）');
	const active = await db.select().from(subscriber).where(eq(subscriber.status, 'active'));
	if (active.length === 0) throw new Error('還沒有確認過的訂閱者');
	const sent = await sendMany(active.map((s) => ({ to: s.email, ...issueMail(entry, s.token) })));
	await db.insert(newsletterIssue).values({ key, title: entry.title, recipients: sent });
	return sent;
}

/** The same email, to the owner only, to see how it looks. */
export async function sendTest(key: string, to: string) {
	const entry = (await listEntries()).find((e) => e.key === key);
	if (!entry) throw new Error('找不到這篇文章');
	await sendMail({ to, ...issueMail(entry, 'preview') });
}
