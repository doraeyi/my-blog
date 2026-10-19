import type { LayoutServerLoad } from './$types';
import { getPublishedStats } from '$lib/server/services/posts-service';

export const load: LayoutServerLoad = async ({ locals }) => {
	return { user: locals.user, stats: await getPublishedStats() };
};
