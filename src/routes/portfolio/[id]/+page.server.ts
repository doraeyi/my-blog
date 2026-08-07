import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getProject } from '$lib/server/services/projects-service';
import * as commentsService from '$lib/server/services/comments-service';

export const load: PageServerLoad = async ({ params }) => {
	const project = await getProject(params.id);
	if (!project) throw error(404, 'Project not found');

	// Reuses the blog comment table/service, keyed by the project id instead of a post slug —
	// `postSlug` is just a generic string key, not a real FK to a `posts` table.
	const comments = await commentsService.listForPost(project.id);

	return { project, comments };
};

export const actions: Actions = {
	comment: async ({ request, params, locals }) => {
		if (!locals.user) return fail(401, { message: '請先登入才能留言' });
		const formData = await request.formData();
		const body = formData.get('body')?.toString() ?? '';
		try {
			await commentsService.create({ postSlug: params.id, authorId: locals.user.id, body });
		} catch (err) {
			return fail(400, { message: err instanceof Error ? err.message : '留言失敗' });
		}
	}
};
