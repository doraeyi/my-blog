import type { PageServerLoad } from './$types';
import { tagCounts } from '$lib/server/content-index';

export const load: PageServerLoad = async () => {
	return { tags: await tagCounts() };
};
