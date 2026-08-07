import type { PageServerLoad } from './$types';
import { listPosts } from '$lib/content-service';

export const load: PageServerLoad = () => {
	return { posts: listPosts() };
};
