import { theme } from '$lib/theme.svelte';

let mermaidModulePromise: Promise<typeof import('mermaid')> | null = null;
function loadMermaid() {
	if (!mermaidModulePromise) mermaidModulePromise = import('mermaid');
	return mermaidModulePromise;
}

/**
 * Finds ```mermaid code blocks rendered by renderMarkdown() (plain <pre><code class="language-mermaid">
 * text — the unified pipeline has no diagram renderer) and replaces them with live SVG via the
 * `mermaid` package. Re-renders on data-theme change so diagrams follow the site's light/dark toggle.
 *
 * Pass the rendered HTML string as the action argument (`use:mermaidDiagrams={html}`) so it
 * re-scans whenever content changes — SvelteKit reuses this component instance across client-side
 * navigation, and {@html} swaps content without remounting the element.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- only there so Svelte calls update() when the HTML changes
export function mermaidDiagrams(node: HTMLElement, _content?: string) {
	const sources = new Map<HTMLElement, string>();
	let renderToken = 0;

	function collect() {
		sources.clear();
		for (const code of node.querySelectorAll<HTMLElement>('pre > code.language-mermaid')) {
			const pre = code.parentElement;
			if (!pre) continue;
			const source = code.textContent ?? '';
			const wrapper = document.createElement('div');
			wrapper.className = 'mermaid-diagram not-prose my-6 overflow-x-auto';
			pre.replaceWith(wrapper);
			sources.set(wrapper, source);
		}
	}

	async function renderAll() {
		if (sources.size === 0) return;
		const token = ++renderToken;
		const { default: mermaid } = await loadMermaid();
		mermaid.initialize({
			startOnLoad: false,
			theme: theme.current === 'dark' ? 'dark' : 'default'
		});

		let i = 0;
		for (const [wrapper, source] of sources) {
			try {
				const { svg } = await mermaid.render(`mermaid-${Date.now()}-${i++}`, source);
				if (token !== renderToken) return;
				wrapper.innerHTML = svg;
			} catch (err) {
				console.error('Mermaid render failed', err);
				wrapper.textContent = source;
			}
		}
	}

	function scan() {
		collect();
		renderAll();
	}

	scan();

	const themeObserver = new MutationObserver(() => renderAll());
	themeObserver.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ['data-theme']
	});

	return {
		// Deferred a tick: {@html} swaps the DOM as part of the same update as this action's
		// parameter change, and we need that swap to have landed before we re-scan for blocks.
		update: () => queueMicrotask(scan),
		destroy() {
			themeObserver.disconnect();
		}
	};
}
