import { toString } from 'mdast-util-to-string';
import { computeReadingTime } from '../reading-time.js';
import type { Root } from 'mdast';

interface VFileLike {
	data: Record<string, unknown>;
}

/**
 * Remark plugin: stores computed reading time on `file.data.readingTime`. Pass into mdsvex's `remarkPlugins`.
 * The tree param is intentionally untyped: mdsvex pins an old unist/mdast major version that's
 * structurally incompatible with this package's newer remark/unist dependencies.
 */
export function remarkReadingTime() {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (tree: any, file: VFileLike) => {
		file.data.readingTime = computeReadingTime(toString(tree as Root));
	};
}
