import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { getPostBySlug } from '$lib/content-service';

export const load: PageLoad = ({ params, data }) => {
	const post = getPostBySlug(params.slug);
	if (!post) throw error(404, 'Post not found');
	return { ...data, metadata: post.metadata, component: post.component };
};
