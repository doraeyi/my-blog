import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { resolve } from '$app/paths';
import * as postsService from '$lib/server/services/posts-service';

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const kind = formData.get('kind')?.toString();
		const slug = formData.get('slug')?.toString().trim();
		const title = formData.get('title')?.toString().trim();
		const excerpt = formData.get('excerpt')?.toString().trim() || undefined;
		const body = formData.get('body')?.toString() ?? '';
		const published = formData.get('published') === 'on';

		if (kind !== 'article' && kind !== 'mood') return fail(400, { message: '請選擇文章類型' });
		if (!slug || !title) return fail(400, { message: '請填寫標題與網址代稱' });

		try {
			await postsService.create({
				kind,
				slug,
				title,
				excerpt,
				body,
				published,
				authorId: locals.user!.id
			});
		} catch (err) {
			return fail(400, { message: err instanceof Error ? err.message : '建立失敗' });
		}

		throw redirect(303, resolve('/admin/posts'));
	}
};
