import type { Actions, PageServerLoad } from './$types';
import * as newsletterService from '$lib/server/services/newsletter-service';

export const load: PageServerLoad = async ({ params }) => {
	const row = await newsletterService.findByToken(params.token);
	return { email: row?.email ?? null, status: row?.status ?? null };
};

export const actions: Actions = {
	// Also what mail apps' one-click "unsubscribe" (RFC 8058) posts to.
	default: async ({ params }) => {
		await newsletterService.unsubscribe(params.token);
		return { done: true };
	}
};
