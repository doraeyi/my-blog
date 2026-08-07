import type { PageServerLoad } from './$types';
import { listPublished } from '$lib/server/services/posts-service';

export const load: PageServerLoad = async () => {
	return { posts: await listPublished('mood') };
};
