import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';

/**
 * Renders markdown from an untrusted source (e.g. a fetched README) to sanitized HTML.
 * Strips scripts/event handlers/etc. via rehype-sanitize's default (GitHub-style) schema —
 * never skip this step for content that isn't authored in this repo. Headings get slugged
 * ids (rehype-slug, before sanitizing) so consumers can build a table of contents / anchor links.
 */
export async function renderMarkdown(source: string): Promise<string> {
	const file = await unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkRehype)
		.use(rehypeSlug)
		.use(rehypeSanitize)
		.use(rehypeStringify)
		.process(source);

	return String(file);
}
