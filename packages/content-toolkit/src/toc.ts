import { fromMarkdown } from 'mdast-util-from-markdown';
import { toString } from 'mdast-util-to-string';
import { visit } from 'unist-util-visit';
import GithubSlugger from 'github-slugger';
import type { Root, Heading } from 'mdast';

export interface TocEntry {
	depth: number;
	text: string;
	slug: string;
}

export function extractTocFromTree(tree: Root): TocEntry[] {
	const slugger = new GithubSlugger();
	const entries: TocEntry[] = [];
	visit(tree, 'heading', (node: Heading) => {
		const text = toString(node);
		entries.push({ depth: node.depth, text, slug: slugger.slug(text) });
	});
	return entries;
}

export function buildToc(content: string): TocEntry[] {
	return extractTocFromTree(fromMarkdown(content));
}
