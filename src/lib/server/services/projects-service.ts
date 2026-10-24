import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { renderMarkdown } from '@doraeyi/content-toolkit';
import { db } from '$lib/server/db';
import {
	project,
	projectCollaborator,
	projectCommitDaily,
	type CaseReport
} from '$lib/server/db/schema';
import * as github from './github-service';

export async function listProjects() {
	return db.query.project.findMany({ orderBy: (p, { desc }) => desc(p.createdAt) });
}

export async function getProject(id: string) {
	return db.query.project.findFirst({
		where: eq(project.id, id),
		with: { collaborators: true, commitDaily: true }
	});
}

export async function addProject(githubOwner: string, githubRepo: string): Promise<string> {
	const [row] = await db
		.insert(project)
		.values({ githubOwner, githubRepo })
		.returning({ id: project.id });

	try {
		await syncProject(row.id);
	} catch (err) {
		// Don't leave an unsynced row behind if the first sync fails — otherwise re-adding
		// the same repo just hits the unique constraint with no way to retry cleanly.
		await db.delete(project).where(eq(project.id, row.id));
		throw err;
	}

	return row.id;
}

/** Saves (or clears, with null) a project's hand-written case report. */
export async function saveCaseReport(id: string, report: CaseReport | null) {
	await db.update(project).set({ caseReport: report }).where(eq(project.id, id));
}

export async function removeProject(id: string) {
	await db.delete(project).where(eq(project.id, id));
}

export async function syncProject(id: string) {
	const existing = await db.query.project.findFirst({ where: eq(project.id, id) });
	if (!existing) throw new Error('Project not found');
	if (!env.GITHUB_USERNAME) throw new Error('GITHUB_USERNAME is not set');

	const { githubOwner, githubRepo } = existing;

	const [meta, readmeSource, collaborators, dailyCounts] = await Promise.all([
		github.fetchRepoMeta(githubOwner, githubRepo),
		github.fetchReadme(githubOwner, githubRepo).catch(() => ''),
		// The collaborators endpoint needs an authenticated token even for public
		// repos; without one, fall back to just the owner instead of failing the sync.
		github.fetchCollaborators(githubOwner, githubRepo).catch(() => [
			{
				githubUsername: githubOwner,
				avatarUrl: `https://github.com/${githubOwner}.png`,
				profileUrl: `https://github.com/${githubOwner}`,
				role: 'owner' as const
			}
		]),
		github.fetchCommitDailyCounts(githubOwner, githubRepo, env.GITHUB_USERNAME)
	]);

	const readmeHtml = readmeSource ? await renderMarkdown(readmeSource) : null;

	db.transaction((tx) => {
		tx.update(project)
			.set({
				description: meta.description,
				homepageUrl: meta.homepageUrl,
				starCount: meta.starCount,
				readmeHtml,
				lastSyncedAt: new Date()
			})
			.where(eq(project.id, id))
			.run();

		tx.delete(projectCollaborator).where(eq(projectCollaborator.projectId, id)).run();
		for (const collaborator of collaborators) {
			tx.insert(projectCollaborator)
				.values({ projectId: id, ...collaborator })
				.run();
		}

		for (const daily of dailyCounts) {
			tx.insert(projectCommitDaily)
				.values({ projectId: id, date: daily.date, count: daily.count })
				.onConflictDoUpdate({
					target: [projectCommitDaily.projectId, projectCommitDaily.date],
					set: { count: daily.count }
				})
				.run();
		}
	});
}
