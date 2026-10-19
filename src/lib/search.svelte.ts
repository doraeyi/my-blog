export interface SearchDoc {
	type: string;
	title: string;
	path: string;
	tags?: string[];
	excerpt?: string;
	text: string;
}

export interface SearchHit {
	doc: SearchDoc;
	snippet: string;
}

/** Global open/close state so the navbar button and the keyboard shortcut drive one palette. */
export const search = $state({ open: false });

let index: Promise<SearchDoc[]> | null = null;

export function loadIndex(): Promise<SearchDoc[]> {
	index ??= fetch('/search.json')
		.then((r) => (r.ok ? r.json() : []))
		.catch(() => {
			index = null;
			return [];
		});
	return index;
}

function snippetAround(text: string, at: number): string {
	const start = Math.max(0, at - 30);
	const end = Math.min(text.length, at + 70);
	return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
}

/** Every whitespace-separated term must appear somewhere; title/tag matches rank highest. */
export function runSearch(docs: SearchDoc[], query: string, limit = 12): SearchHit[] {
	const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
	if (terms.length === 0) return [];

	const hits: { hit: SearchHit; score: number }[] = [];
	for (const doc of docs) {
		const title = doc.title.toLowerCase();
		const tags = (doc.tags ?? []).join(' ').toLowerCase();
		const excerpt = (doc.excerpt ?? '').toLowerCase();
		const text = doc.text.toLowerCase();

		let score = 0;
		let matchedAll = true;
		for (const t of terms) {
			const s =
				(title.includes(t) ? 10 : 0) +
				(title.startsWith(t) ? 5 : 0) +
				(tags.includes(t) ? 6 : 0) +
				(excerpt.includes(t) ? 3 : 0) +
				(text.includes(t) ? 1 : 0);
			if (s === 0) {
				matchedAll = false;
				break;
			}
			score += s;
		}
		if (!matchedAll) continue;

		const at = text.indexOf(terms[0]);
		const snippet =
			at >= 0 && !title.includes(terms[0]) ? snippetAround(doc.text, at) : (doc.excerpt ?? '');
		hits.push({ hit: { doc, snippet }, score });
	}

	return hits
		.sort((a, b) => b.score - a.score)
		.slice(0, limit)
		.map((h) => h.hit);
}
