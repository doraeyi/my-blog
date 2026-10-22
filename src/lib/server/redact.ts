/**
 * Last-line scrub for drafts written from AI coding sessions (/api/posts/draft).
 * The writer is asked to leave secrets out; this catches what slips through:
 * keys and tokens, `.env`-style secret assignments, IP addresses, e-mail
 * addresses and home-directory user names. Pure string work, no I/O.
 */

export interface Redaction {
	rule: string;
	count: number;
}

interface Rule {
	name: string;
	pattern: RegExp;
	replace: string | ((match: string, ...groups: string[]) => string);
}

const SECRET_NAME = String.raw`[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|PASSWD|PASS|API_?KEY|PRIVATE_?KEY|ACCESS_?KEY|DATABASE_URL|DSN|COOKIE)[A-Z0-9_]*`;

// Loopback / unspecified addresses carry no information about anyone's network.
const HARMLESS_IPS = new Set(['127.0.0.1', '0.0.0.0', '255.255.255.255']);

const RULES: Rule[] = [
	{
		name: '私鑰',
		pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
		replace: '[已移除私鑰]'
	},
	{
		name: 'API 金鑰／Token',
		pattern:
			/\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-(?:ant-)?[A-Za-z0-9_-]{20,}|xox[abprs]-[A-Za-z0-9-]{10,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{30,}|glpat-[A-Za-z0-9_-]{20,})\b/g,
		replace: '[已移除金鑰]'
	},
	{
		name: 'JWT',
		pattern: /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,
		replace: '[已移除 JWT]'
	},
	{
		name: 'Bearer token',
		pattern: /\b(Bearer|Basic)\s+(?!<|\[|\$|\{)[A-Za-z0-9._~+/=-]{12,}/g,
		replace: (_m, scheme) => `${scheme} [已移除]`
	},
	{
		name: '.env 機密值',
		// SOME_TOKEN=value / SOME_TOKEN: value — upper-case names only, so prose
		// like "session: 存在 cookie" is left alone. Keeps the name, drops the value.
		pattern: new RegExp(
			String.raw`(\b${SECRET_NAME}\s*[:=]\s*)(?!["']?\s*(?:$|\[已移除|<|\$\{|""|''))(["']?)[^\s"',}]+\2`,
			'gm'
		),
		replace: (_m, lead, quote) => `${lead}${quote}[已移除]${quote}`
	},
	{
		name: '設定檔機密值',
		// "apiKey": "value", 'client_secret': 'value' — quoted keys in JSON / JS config.
		pattern:
			/((["'])[A-Za-z0-9_-]*(?:secret|token|password|passwd|api_?key|private_?key|access_?key)[A-Za-z0-9_-]*\2\s*:\s*)(["'])(?!\[已移除|<|\$\{)[^"'\r\n]{4,}\3/gi,
		replace: (_m, lead, _q, quote) => `${lead}${quote}[已移除]${quote}`
	},
	{
		name: '連線字串密碼',
		pattern: /\b([a-z][a-z0-9+.-]*:\/\/[^:\s/@]+:)[^@\s/]+(@)/gi,
		replace: (_m, head, at) => `${head}[已移除]${at}`
	},
	{
		name: 'IP 位址',
		pattern: /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g,
		replace: (m) => (HARMLESS_IPS.has(m) ? m : 'x.x.x.x')
	},
	{
		name: 'Email',
		pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}\b/g,
		replace: '[email]'
	},
	{
		name: '使用者路徑',
		pattern:
			/([A-Za-z]:[\\/]+Users[\\/]+|\/home\/|\/Users\/)(?!<user>|user\b|Public\b|runner\b)[^\\/\s"'`]+/g,
		replace: (_m, head) => `${head}<user>`
	}
];

export function redact(text: string): { text: string; redactions: Redaction[] } {
	const redactions: Redaction[] = [];
	let out = text;
	for (const rule of RULES) {
		let count = 0;
		out = out.replace(rule.pattern, (match: string, ...rest: unknown[]) => {
			const groups = rest.filter((g): g is string => typeof g === 'string');
			const next = typeof rule.replace === 'string' ? rule.replace : rule.replace(match, ...groups);
			if (next !== match) count++;
			return next;
		});
		if (count) redactions.push({ rule: rule.name, count });
	}
	return { text: out, redactions };
}
