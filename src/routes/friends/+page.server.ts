import type { Actions, PageServerLoad } from './$types';
import { loadPageComments, pageCommentAction } from '$lib/server/page-comments';

export const load: PageServerLoad = async () => {
	return { comments: await loadPageComments('friends') };
};

export const actions: Actions = {
	comment: pageCommentAction('friends')
};
