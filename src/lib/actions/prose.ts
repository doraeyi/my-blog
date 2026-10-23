import type { Action } from 'svelte/action';

/**
 * Reading aids on rendered article HTML (both mdsvex posts and DB-backed
 * articles, which arrive as {@html}): every heading gets a stable id and a
 * "#" anchor, every code block gets its language label and a copy button.
 * Idempotent — safe to re-run when the HTML changes (pass it as the parameter).
 */

const HEADINGS = 'h2, h3, h4';

function slug(text: string) {
	return (
		text
			.trim()
			.toLowerCase()
			// Keep letters/numbers in any script (CJK included), dash everything else.
			.replace(/[^\p{L}\p{N}]+/gu, '-')
			.replace(/^-+|-+$/g, '') || 'section'
	);
}

/** Gives every heading in `root` an id (keeps existing ones), unique within the page. */
export function ensureHeadingIds(root: HTMLElement) {
	const taken = new Set(
		Array.from(document.querySelectorAll('[id]'), (el) => el.id).filter(Boolean)
	);
	for (const h of root.querySelectorAll<HTMLElement>(HEADINGS)) {
		if (h.id) continue;
		const base = slug(h.textContent ?? '');
		let id = base;
		for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
		h.id = id;
		taken.add(id);
	}
}

/** Visible text of a heading, without the "#" anchor we add. */
export function headingText(h: HTMLElement) {
	const clone = h.cloneNode(true) as HTMLElement;
	clone.querySelectorAll('.heading-anchor').forEach((a) => a.remove());
	return clone.textContent?.trim() ?? '';
}

function addAnchors(root: HTMLElement) {
	for (const h of root.querySelectorAll<HTMLElement>(HEADINGS)) {
		if (h.querySelector('.heading-anchor')) continue;
		const a = document.createElement('a');
		a.className = 'heading-anchor';
		a.href = `#${h.id}`;
		a.setAttribute('aria-label', `連結到「${headingText(h)}」`);
		a.textContent = '#';
		h.append(a);
	}
}

async function copyText(text: string) {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		// Insecure context or denied permission: fall back to a hidden textarea.
		const ta = document.createElement('textarea');
		ta.value = text;
		ta.setAttribute('readonly', '');
		ta.style.position = 'fixed';
		ta.style.opacity = '0';
		document.body.append(ta);
		ta.select();
		const ok = document.execCommand('copy');
		ta.remove();
		return ok;
	}
}

const LANG_NAMES: Record<string, string> = {
	js: 'JavaScript',
	javascript: 'JavaScript',
	ts: 'TypeScript',
	typescript: 'TypeScript',
	sh: 'Shell',
	bash: 'Bash',
	shell: 'Shell',
	zsh: 'Shell',
	ps1: 'PowerShell',
	powershell: 'PowerShell',
	py: 'Python',
	python: 'Python',
	yml: 'YAML',
	yaml: 'YAML',
	md: 'Markdown',
	markdown: 'Markdown',
	svelte: 'Svelte',
	html: 'HTML',
	css: 'CSS',
	json: 'JSON',
	sql: 'SQL',
	dockerfile: 'Dockerfile',
	diff: 'Diff',
	text: '',
	txt: '',
	plaintext: ''
};

function languageOf(pre: HTMLElement) {
	const cls = `${pre.className} ${pre.querySelector('code')?.className ?? ''}`;
	const raw = /language-([\w+#-]+)/.exec(cls)?.[1]?.toLowerCase();
	if (!raw) return '';
	return raw in LANG_NAMES ? LANG_NAMES[raw] : raw.toUpperCase();
}

function addCopyButtons(root: HTMLElement) {
	for (const pre of root.querySelectorAll<HTMLElement>('pre')) {
		if (pre.parentElement?.classList.contains('code-block')) continue;
		// Mermaid source blocks are swapped for diagrams elsewhere; leave them alone.
		if (pre.querySelector('code.language-mermaid')) continue;

		const wrap = document.createElement('div');
		wrap.className = 'code-block';
		pre.before(wrap);
		wrap.append(pre);

		const bar = document.createElement('div');
		bar.className = 'code-bar';
		const lang = document.createElement('span');
		lang.className = 'code-lang';
		lang.textContent = languageOf(pre);
		const btn = document.createElement('button');
		btn.type = 'button';
		btn.className = 'code-copy';
		btn.textContent = '複製';
		btn.setAttribute('aria-label', '複製程式碼');
		let timer = 0;
		btn.addEventListener('click', async () => {
			const code = pre.querySelector('code') ?? pre;
			const ok = await copyText(code.textContent ?? '');
			btn.textContent = ok ? '已複製' : '複製失敗';
			btn.dataset.state = ok ? 'done' : 'fail';
			clearTimeout(timer);
			timer = window.setTimeout(() => {
				btn.textContent = '複製';
				delete btn.dataset.state;
			}, 1600);
		});
		bar.append(lang, btn);
		wrap.prepend(bar);
	}
}

function enhance(node: HTMLElement) {
	ensureHeadingIds(node);
	addAnchors(node);
	addCopyButtons(node);
}

export const proseEnhance: Action<HTMLElement, unknown> = (node) => {
	// After the {@html} / component content has been inserted.
	queueMicrotask(() => enhance(node));
	return {
		update() {
			queueMicrotask(() => enhance(node));
		}
	};
};
