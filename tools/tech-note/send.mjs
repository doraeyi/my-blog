#!/usr/bin/env node
/**
 * Sends a /tech-note draft to the blog's draft API.
 *
 *   node send.mjs <draft.md> [--dry-run]
 *
 * The file is Markdown with a small YAML front matter:
 *   ---
 *   title: ...
 *   excerpt: ...
 *   tags: [sveltekit, docker]
 *   series: ...        (optional)
 *   kind: mood         (optional; default is a 技術文章)
 *   slug: ...          (optional, ascii)
 *   ---
 *   body…
 *
 * Endpoint + token come from ~/.claude/tech-note.json ({ "url", "token" }) or
 * the TECH_NOTE_URL / TECH_NOTE_TOKEN environment variables. The token is
 * never printed.
 */
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const dryRun = args.includes('--dry-run');
if (!file) {
	console.error('usage: node send.mjs <draft.md> [--dry-run]');
	process.exit(2);
}

function loadConfig() {
	const path = join(homedir(), '.claude', 'tech-note.json');
	const fromFile = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {};
	const url = process.env.TECH_NOTE_URL || fromFile.url;
	const token = process.env.TECH_NOTE_TOKEN || fromFile.token;
	if (!url || !token) {
		console.error(`缺少設定：請在 ${path} 放 { "url": "https://你的網域", "token": "…" }`);
		process.exit(2);
	}
	return { url: url.replace(/\/$/, ''), token };
}

/** Just enough YAML for the keys above: scalars and [a, b] / "- a" lists. */
function parse(md) {
	const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(md);
	if (!m) return { meta: {}, body: md };
	const meta = {};
	let listKey = null;
	for (const raw of m[1].split(/\r?\n/)) {
		const item = /^\s*-\s+(.*)$/.exec(raw);
		if (item && listKey) {
			meta[listKey].push(unquote(item[1]));
			continue;
		}
		const kv = /^([A-Za-z_]+):\s*(.*)$/.exec(raw);
		if (!kv) continue;
		const [, key, value] = kv;
		listKey = null;
		if (value === '') {
			meta[key] = [];
			listKey = key;
		} else if (/^\[.*\]$/.test(value)) {
			meta[key] = value
				.slice(1, -1)
				.split(',')
				.map((s) => unquote(s.trim()))
				.filter(Boolean);
		} else meta[key] = unquote(value);
	}
	return { meta, body: m[2].trim() };
}
function unquote(s) {
	return s.replace(/^(["'])(.*)\1$/, '$2');
}

const { meta, body } = parse(readFileSync(file, 'utf8'));
const payload = {
	kind: meta.kind === 'mood' ? 'mood' : 'article',
	title: meta.title,
	excerpt: meta.excerpt,
	tags: meta.tags ?? [],
	series: meta.series,
	slug: meta.slug,
	body
};
if (!payload.title || !payload.body) {
	console.error('草稿需要 front matter 的 title 和內文。');
	process.exit(2);
}
if (dryRun) {
	console.log(JSON.stringify({ ...payload, body: `${payload.body.length} chars` }, null, 2));
	process.exit(0);
}

const { url, token } = loadConfig();
const res = await fetch(`${url}/api/posts/draft`, {
	method: 'POST',
	headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
	body: JSON.stringify(payload)
});
const text = await res.text();
if (!res.ok) {
	console.error(`送出失敗 ${res.status}: ${text}`);
	process.exit(1);
}
const out = JSON.parse(text);
console.log(`已存成草稿：${out.slug}`);
console.log(`編輯／發布：${out.editUrl}`);
console.log(
	out.redactions.length
		? `伺服器另外遮掉：${out.redactions.map((r) => `${r.rule} ×${r.count}`).join('、')}`
		: '伺服器沒有再找到要遮的資料。'
);
