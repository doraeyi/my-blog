import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loadPageComments, pageCommentAction } from '$lib/server/page-comments';
import * as friendsService from '$lib/server/services/friends-service';

export const load: PageServerLoad = async () => {
	void friendsService.refreshIfStale();
	const [friends, circle, comments] = await Promise.all([
		friendsService.listPublic(),
		friendsService.listCircle(),
		loadPageComments('friends')
	]);
	return { friends, circlePosts: circle.posts.length, comments };
};

export const actions: Actions = {
	comment: pageCommentAction('friends'),
	apply: async ({ request, getClientAddress }) => {
		const formData = await request.formData();
		const s = (k: string) => formData.get(k)?.toString() ?? '';
		const values = {
			name: s('name'),
			url: s('url'),
			avatar: s('avatar'),
			description: s('description'),
			email: s('email'),
			feedUrl: s('feedUrl'),
			backlinkUrl: s('backlinkUrl'),
			joinCircle: formData.get('joinCircle') === 'on'
		};
		// Honeypot: people never see this field, form-filling bots do.
		if (s('nickname')) return { applied: { token: '', name: values.name } };
		try {
			const row = await friendsService.apply(values, getClientAddress());
			return { applied: { token: row.token, name: row.name } };
		} catch (err) {
			return fail(400, {
				applyError: err instanceof Error ? err.message : '送出失敗',
				values
			});
		}
	}
};
