import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { escapeXml as esc } from '$lib/server/xml';

/**
 * Outgoing email through Resend (RESEND_API_KEY + MAIL_FROM, a sender on a
 * domain verified in Resend). Without a key, local dev prints each email to the
 * console instead, and production simply reports email as unavailable.
 */

export interface Mail {
	to: string;
	subject: string;
	html: string;
	text: string;
	headers?: Record<string, string>;
}

export const SITE_ORIGIN = (env.ORIGIN || 'https://blog.doraeyi.com').replace(/\/$/, '');

export function mailEnabled(): boolean {
	return Boolean(env.RESEND_API_KEY) || dev;
}

const from = () => env.MAIL_FROM || 'Liam 偵探手記 <newsletter@doraeyi.com>';

async function resend(path: string, body: unknown) {
	const res = await fetch(`https://api.resend.com${path}`, {
		method: 'POST',
		headers: {
			authorization: `Bearer ${env.RESEND_API_KEY}`,
			'content-type': 'application/json'
		},
		body: JSON.stringify(body),
		signal: AbortSignal.timeout(15000)
	});
	if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

function devPrint(mail: Mail) {
	console.info(`\n[mail → ${mail.to}] ${mail.subject}\n${mail.text}\n`);
}

export async function sendMail(mail: Mail) {
	if (!env.RESEND_API_KEY) {
		if (dev) return devPrint(mail);
		throw new Error('寄信功能尚未設定（RESEND_API_KEY）');
	}
	await resend('/emails', { from: from(), ...mail });
}

/** Many emails, 100 per request (Resend's batch limit). Returns how many went out. */
export async function sendMany(mails: Mail[]): Promise<number> {
	if (!env.RESEND_API_KEY) {
		if (dev) {
			mails.forEach(devPrint);
			return mails.length;
		}
		throw new Error('寄信功能尚未設定（RESEND_API_KEY）');
	}
	let sent = 0;
	for (let i = 0; i < mails.length; i += 100) {
		const chunk = mails.slice(i, i + 100);
		await resend(
			'/emails/batch',
			chunk.map((m) => ({ from: from(), ...m }))
		);
		sent += chunk.length;
	}
	return sent;
}

// ── Templates ────────────────────────────────────────────────────────────────
// Table-free, inline-styled HTML that survives Gmail and Apple Mail: a cream
// index card with the red seal colour as the only accent.

export function layout(opts: {
	preheader: string;
	heading: string;
	body: string;
	button?: { label: string; href: string };
	footer: string;
}) {
	return `<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;background:#efe6cf;padding:32px 12px;font-family:-apple-system,'PingFang TC','Noto Sans TC','Microsoft JhengHei',sans-serif;color:#2c2118">
<span style="display:none;max-height:0;overflow:hidden">${esc(opts.preheader)}</span>
<div style="max-width:560px;margin:0 auto">
<p style="margin:0 0 12px;font:12px/1 monospace;letter-spacing:3px;color:#8a6d45">LIAM 偵探手記 · CASE FILE</p>
<div style="background:#f8f1df;border-top:4px solid #b3362b;border-radius:4px;padding:28px 28px 24px;box-shadow:0 12px 30px -16px rgba(44,33,24,.45)">
<h1 style="margin:0 0 14px;font-size:22px;line-height:1.4;color:#2c2118">${esc(opts.heading)}</h1>
<div style="font-size:15px;line-height:1.8;color:#4a3925">${opts.body}</div>
${
	opts.button
		? `<p style="margin:24px 0 4px"><a href="${esc(opts.button.href)}" style="display:inline-block;background:#b3362b;color:#fff;text-decoration:none;padding:11px 22px;border-radius:999px;font-size:14px">${esc(opts.button.label)}</a></p>`
		: ''
}
</div>
<p style="margin:16px 4px 0;font-size:12px;line-height:1.7;color:#8a6d45">${opts.footer}</p>
</div></body></html>`;
}

export const paragraph = (text: string) => `<p style="margin:0 0 10px">${esc(text)}</p>`;
