import type { PageServerLoad } from './$types';
import * as newsletterService from '$lib/server/services/newsletter-service';

export const load: PageServerLoad = async ({ params }) => ({
	email: await newsletterService.confirm(params.token)
});
