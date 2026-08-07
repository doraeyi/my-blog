import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import * as projectsService from '$lib/server/services/projects-service';

export const load: PageServerLoad = async () => {
	return { projects: await projectsService.listProjects() };
};

function parseGithubRepo(input: string): { owner: string; repo: string } | null {
	const trimmed = input.trim();
	const urlMatch = trimmed.match(/github\.com\/([^/\s]+)\/([^/\s#?]+)/i);
	if (urlMatch) return { owner: urlMatch[1], repo: urlMatch[2].replace(/\.git$/, '') };
	const shortMatch = trimmed.match(/^([^/\s]+)\/([^/\s]+)$/);
	if (shortMatch) return { owner: shortMatch[1], repo: shortMatch[2] };
	return null;
}

export const actions: Actions = {
	add: async ({ request }) => {
		const formData = await request.formData();
		const input = formData.get('repo')?.toString() ?? '';
		const parsed = parseGithubRepo(input);
		if (!parsed) return fail(400, { message: '請輸入 owner/repo 或完整的 GitHub URL' });

		try {
			await projectsService.addProject(parsed.owner, parsed.repo);
		} catch (err) {
			return fail(400, { message: err instanceof Error ? err.message : '新增失敗' });
		}
	},
	sync: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		if (!id) return fail(400, { message: '缺少 id' });

		try {
			await projectsService.syncProject(id);
		} catch (err) {
			return fail(400, { message: err instanceof Error ? err.message : '同步失敗' });
		}
	},
	remove: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		if (id) await projectsService.removeProject(id);
	}
};
