import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';

/**
 * Renders markdown from an untrusted source (e.g. a fetched README) to sanitized HTML.
 * GitHub profile READMEs commonly mix markdown with raw HTML (`<div align="center">`, bare
 * `<img>`/`<br>` for layout) — allowDangerousHtml + rehype-raw parses that HTML into real nodes
 * instead of silently dropping it, and rehype-sanitize (GitHub-style schema, run *after* raw
 * parsing) still strips anything actually dangerous. Never reorder sanitize before raw.
 * Headings get slugged ids (rehype-slug, before sanitizing) so consumers can build a table of
 * contents / anchor links.
 */
export async function renderMarkdown(source: string): Promise<string> {
	const file = await unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypeRaw)
		.use(rehypeSlug)
		.use(rehypeSanitize)
		.use(rehypeStringify)
		.process(source);

	return String(file);
}
