/** What the homepage evidence board (SuspectBoard.svelte) needs, loaded by $lib/server/suspect-board. */
export interface SuspectBoardData {
	notes: { title: string; href: string; date: Date }[];
	/** The newest files of every kind, labelled — the study's screen lists these. */
	latest: { title: string; href: string; date: Date; kind: string }[];
	evidence: {
		badge: { since: string; org: string; role: string };
		project: { name: string; description: string; href: string } | null;
		mood: { title: string; excerpt: string; href: string; date: Date } | null;
		tapes: { title: string; poster: string | null }[];
		gear: { name: string; spec: string; photo: string }[];
		note: { thinking: string; learning: string };
	};
}
