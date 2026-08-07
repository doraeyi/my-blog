import type { PageServerLoad } from './$types';
import { listPostsByTag } from '$lib/content-service';

export const load: PageServerLoad = ({ params }) => {
	return { tag: params.tag, posts: listPostsByTag(params.tag) };
};
