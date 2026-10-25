import type { PageServerLoad } from './$types';
import * as friendsService from '$lib/server/services/friends-service';

export const load: PageServerLoad = async () => {
	void friendsService.refreshIfStale();
	const { members, posts } = await friendsService.listCircle(200);
	const counts = new Map<string, number>();
	for (const p of posts) counts.set(p.friendId, (counts.get(p.friendId) ?? 0) + 1);
	const updated = members
		.map((m) => m.feedFetchedAt?.getTime() ?? 0)
		.reduce((a, b) => Math.max(a, b), 0);
	return {
		members: members
			.map((m) => ({
				id: m.id,
				name: m.name,
				url: m.url,
				avatar: m.avatar,
				count: counts.get(m.id) ?? 0
			}))
			.filter((m) => m.count > 0)
			.sort((a, b) => b.count - a.count),
		posts,
		updatedAt: updated ? new Date(updated) : null
	};
};
