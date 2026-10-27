import { listEntries } from '$lib/server/content-index';
import * as watchService from '$lib/server/services/watch-service';
import { posterUrl } from '$lib/server/services/tmdb-service';
import { listProjects } from '$lib/server/services/projects-service';
import { gear } from '$lib/collections';
import { photoUrl } from '$lib/gear-photos';
import { now } from '$lib/now';
import type { SuspectBoardData } from '$lib/suspect-board';

/**
 * Everything the homepage evidence board pins up, pulled from real content:
 * the latest notes, a project, the latest mood, what's being watched, the desk
 * gear, and what's on his mind. Each piece says one thing about Liam.
 */
export async function loadSuspectBoard(): Promise<SuspectBoardData> {
	const [entries, watched, current, projects] = await Promise.all([
		listEntries(),
		watchService.listWatched(),
		watchService.getCurrentlyWatching(),
		listProjects().catch(() => [])
	]);

	const mood = entries.find((e) => e.kind === 'mood') ?? null;
	const desk = gear.flatMap((g) => g.items);
	const keyboard = desk.find((i) => /keyboard|TKL|PRO X/i.test(i.name));
	const mouse = desk.find((i) => /G502/.test(i.name));
	const gpu = desk.find((i) => /RTX/.test(i.name));
	const tapes = [current, ...watched].filter(Boolean).slice(0, 3) as NonNullable<typeof current>[];
	const project = projects[0] ?? null;

	const excerpt = (e: (typeof entries)[number]) =>
		(e.excerpt ?? e.text.slice(0, 110)) + (e.text.length > 110 && !e.excerpt ? '…' : '');

	return {
		// The field-notes sheet lists a few recent files, so the board shows what he writes about.
		notes: entries
			.filter((e) => e.kind !== 'mood')
			.slice(0, 3)
			.map((e) => ({ title: e.title, href: e.path, date: e.date })),
		evidence: {
			badge: { since: '2024.08', org: 'MSI 微星科技', role: '前端工程師' },
			project: project
				? {
						name: project.githubRepo.split('/').pop() ?? project.githubRepo,
						description: project.description ?? '',
						href: `/portfolio/${project.id}`
					}
				: null,
			mood: mood
				? { title: mood.title, excerpt: excerpt(mood), href: mood.path, date: mood.date }
				: null,
			tapes: tapes.map((t) => ({ title: t.title, poster: posterUrl(t.posterPath, 'w342') })),
			gear: [keyboard, mouse, gpu]
				.filter((g) => g !== undefined)
				.map((g) => ({ name: g.name, spec: g.spec ?? '', photo: photoUrl(g.name) })),
			note: { thinking: now.thinking[0] ?? '', learning: now.learning[0] ?? '' }
		}
	};
}
