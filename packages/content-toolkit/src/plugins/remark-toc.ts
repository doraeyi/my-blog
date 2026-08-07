import { extractTocFromTree } from '../toc.js';
import type { Root } from 'mdast';

interface VFileLike {
	data: Record<string, unknown>;
}

/**
 * Remark plugin: stores extracted headings on `file.data.toc`. Pass into mdsvex's `remarkPlugins`.
 * The tree param is intentionally untyped: mdsvex pins an old unist/mdast major version that's
 * structurally incompatible with this package's newer remark/unist dependencies.
 */
export function remarkToc() {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (tree: any, file: VFileLike) => {
		file.data.toc = extractTocFromTree(tree as Root);
	};
}
