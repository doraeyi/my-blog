import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import * as friendsService from '$lib/server/services/friends-service';

export const load: PageServerLoad = async ({ params }) => {
	const f = await friendsService.getByToken(params.token);
	if (!f) throw error(404, '找不到這筆申請');
	return {
		application: {
			name: f.name,
			url: f.url,
			avatar: f.avatar,
			description: f.description,
			status: f.status,
			reviewNote: f.reviewNote,
			backlinkOk: f.backlinkOk,
			httpStatus: f.httpStatus,
			feedError: f.joinCircle ? f.feedError : null,
			feedOk: f.joinCircle && !!f.feedFetchedAt && !f.feedError,
			checkedAt: f.checkedAt,
			createdAt: f.createdAt
		}
	};
};
