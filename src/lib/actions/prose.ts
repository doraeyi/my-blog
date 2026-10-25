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

// ── Image zoom ─────────────────────────────────────────────────────────────
// Click an image and it lifts off the page to fill the screen (FLIP from where
// it sat), with its alt text as a caption; click, Esc or scroll puts it back.

let openZoom: (() => void) | null = null;

function zoomImage(img: HTMLImageElement) {
	if (openZoom) return;
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const from = img.getBoundingClientRect();

	const overlay = document.createElement('div');
	overlay.className = 'lightbox';
	overlay.setAttribute('role', 'dialog');
	overlay.setAttribute('aria-modal', 'true');
	overlay.setAttribute('aria-label', img.alt || '放大的圖片');
	const big = document.createElement('img');
	big.src = img.currentSrc || img.src;
	big.alt = img.alt;
	big.className = 'lightbox-img';
	overlay.append(big);
	if (img.alt) {
		const cap = document.createElement('p');
		cap.className = 'lightbox-caption';
		cap.textContent = img.alt;
		overlay.append(cap);
	}
	document.body.append(overlay);

	// Fit inside the viewport with a margin, never upscaling past 2x the natural size.
	const pad = window.innerWidth < 640 ? 12 : 48;
	const naturalW = img.naturalWidth || from.width;
	const naturalH = img.naturalHeight || from.height;
	const scale = Math.min(
		(window.innerWidth - pad * 2) / naturalW,
		(window.innerHeight - pad * 2 - (img.alt ? 40 : 0)) / naturalH,
		2
	);
	const w = naturalW * scale;
	const h = naturalH * scale;
	Object.assign(big.style, {
		width: `${w}px`,
		height: `${h}px`,
		left: `${(window.innerWidth - w) / 2}px`,
		top: `${(window.innerHeight - h - (img.alt ? 40 : 0)) / 2}px`
	});

	const to = big.getBoundingClientRect();
	const flip = `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`;
	const timing = { duration: reduce ? 0 : 380, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' };
	img.style.visibility = 'hidden';
	big.animate([{ transform: flip }, { transform: 'none' }], timing);
	overlay.animate([{ opacity: 0 }, { opacity: 1 }], timing);

	const startY = window.scrollY;
	function close() {
		if (openZoom !== close) return;
		openZoom = null;
		window.removeEventListener('keydown', onKey);
		window.removeEventListener('scroll', onScroll);
		const back = img.getBoundingClientRect();
		const now = big.getBoundingClientRect();
		const home = `translate(${back.left - now.left}px, ${back.top - now.top}px) scale(${back.width / now.width}, ${back.height / now.height})`;
		const out = { ...timing, duration: reduce ? 0 : 300, fill: 'forwards' as const };
		overlay.animate([{ opacity: 1 }, { opacity: 0 }], out);
		big.animate([{ transform: 'none' }, { transform: home }], out).finished.then(() => {
			img.style.visibility = '';
			overlay.remove();
			img.focus({ preventScroll: true });
		});
	}
	function onKey(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}
	function onScroll() {
		if (Math.abs(window.scrollY - startY) > 40) close();
	}
	overlay.addEventListener('click', close);
	window.addEventListener('keydown', onKey);
	window.addEventListener('scroll', onScroll, { passive: true });
	openZoom = close;
}

function addImageZoom(root: HTMLElement) {
	for (const img of root.querySelectorAll<HTMLImageElement>('img')) {
		// Linked images keep their link; tiny ones (icons, badges) aren't worth zooming.
		if (img.dataset.zoom || img.closest('a')) continue;
		img.dataset.zoom = 'on';
		img.tabIndex = 0;
		img.setAttribute('role', 'button');
		img.setAttribute('aria-label', `放大圖片${img.alt ? `：${img.alt}` : ''}`);
		const open = () => {
			if (img.getBoundingClientRect().width >= 80) zoomImage(img);
		};
		img.addEventListener('click', open);
		img.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				open();
			}
		});
	}
}

function enhance(node: HTMLElement) {
	ensureHeadingIds(node);
	addAnchors(node);
	addCopyButtons(node);
	addImageZoom(node);
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
