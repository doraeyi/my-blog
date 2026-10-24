import type { LayoutServerLoad } from './$types';
import { getPublishedStats } from '$lib/server/services/posts-service';
import { unreadCount } from '$lib/server/services/notifications-service';

export const load: LayoutServerLoad = async ({ locals }) => {
	const [stats, unread] = await Promise.all([
		getPublishedStats(),
		locals.user ? unreadCount(locals.user.id) : Promise.resolve(0)
	]);
	return { user: locals.user, stats, unread };
};
