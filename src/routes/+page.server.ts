import type { PageServerLoad } from './$types';
import { loadSuspectBoard } from '$lib/server/suspect-board';
import * as friendsService from '$lib/server/services/friends-service';

/** The homepage is Liam's study: the book (the evidence) and the whiteboard (friends). */
export const load: PageServerLoad = async () => {
	const [board, friends] = await Promise.all([
		loadSuspectBoard(),
		friendsService.listPublic().catch(() => [])
	]);
	return {
		board,
		friends: friends.map((f) => ({
			id: f.id,
			name: f.name,
			url: f.url,
			avatar: f.avatar,
			description: f.description,
			lost: f.lost
		}))
	};
};
