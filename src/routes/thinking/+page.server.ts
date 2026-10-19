import type { PageServerLoad } from './$types';
import * as thoughtsService from '$lib/server/services/thoughts-service';

export const load: PageServerLoad = async () => {
	const thoughts = await thoughtsService.list();
	return {
		thoughts: thoughts.map((t) => ({
			...t,
			linkHost: t.linkUrl ? thoughtsService.linkHost(t.linkUrl) : null
		}))
	};
};
