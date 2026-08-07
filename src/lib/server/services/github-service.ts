import { env } from '$env/dynamic/private';

const GITHUB_API = 'https://api.github.com';
const MAX_COMMIT_PAGES = 20;

function authHeaders(accept = 'application/vnd.github+json') {
	const headers: Record<string, string> = {
		Accept: accept,
		'X-GitHub-Api-Version': '2022-11-28'
	};
	if (env.GITHUB_TOKEN) headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
	return headers;
}

async function githubFetch(path: string, accept?: string): Promise<Response> {
	const res = await fetch(`${GITHUB_API}${path}`, { headers: authHeaders(accept) });
	if (!res.ok) {
		throw new Error(`GitHub API ${path} failed: ${res.status} ${res.statusText}`);
	}
	return res;
}

export interface RepoMeta {
	description: string | null;
	homepageUrl: string | null;
	starCount: number;
}

export async function fetchRepoMeta(owner: string, repo: string): Promise<RepoMeta> {
	const res = await githubFetch(`/repos/${owner}/${repo}`);
	const data = await res.json();
	return {
		description: data.description ?? null,
		homepageUrl: data.homepage || null,
		starCount: data.stargazers_count ?? 0
	};
}

export async function fetchReadme(owner: string, repo: string): Promise<string> {
	const res = await githubFetch(`/repos/${owner}/${repo}/readme`, 'application/vnd.github.raw');
	return res.text();
}

export interface GithubCollaborator {
	githubUsername: string;
	avatarUrl: string;
	profileUrl: string;
	role: 'owner' | 'collaborator';
}

export async function fetchCollaborators(
	owner: string,
	repo: string
): Promise<GithubCollaborator[]> {
	const res = await githubFetch(`/repos/${owner}/${repo}/collaborators?per_page=100`);
	const data: Array<{ login: string; avatar_url: string; html_url: string }> = await res.json();
	return data.map((c) => ({
		githubUsername: c.login,
		avatarUrl: c.avatar_url,
		profileUrl: c.html_url,
		role: c.login.toLowerCase() === owner.toLowerCase() ? 'owner' : 'collaborator'
	}));
}

export interface DailyCommitCount {
	date: string;
	count: number;
}

/** Aggregates commit counts per day for a single author — not the raw commit list. */
export async function fetchCommitDailyCounts(
	owner: string,
	repo: string,
	githubUsername: string,
	sinceIso?: string
): Promise<DailyCommitCount[]> {
	const counts = new Map<string, number>();
	const perPage = 100;
	let page = 1;
	let hasMore = true;

	while (hasMore && page <= MAX_COMMIT_PAGES) {
		const params = new URLSearchParams({
			author: githubUsername,
			per_page: String(perPage),
			page: String(page)
		});
		if (sinceIso) params.set('since', sinceIso);

		const res = await githubFetch(`/repos/${owner}/${repo}/commits?${params}`);
		const commits: Array<{ commit: { author: { date: string } | null } }> = await res.json();

		for (const c of commits) {
			const date = c.commit.author?.date;
			if (!date) continue;
			const day = date.slice(0, 10);
			counts.set(day, (counts.get(day) ?? 0) + 1);
		}

		hasMore = commits.length === perPage;
		page += 1;
	}

	return Array.from(counts, ([date, count]) => ({ date, count }));
}
