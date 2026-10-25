import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { mailEnabled } from '$lib/server/mail';
import * as newsletterService from '$lib/server/services/newsletter-service';

export const load: PageServerLoad = () => ({ enabled: mailEnabled() });

export const actions: Actions = {
	// Every subscribe box on the site posts here.
	default: async ({ request, getClientAddress }) => {
		const formData = await request.formData();
		if (formData.get('nickname')) return { subscribed: true }; // honeypot
		try {
			await newsletterService.subscribe(
				formData.get('email')?.toString() ?? '',
				getClientAddress()
			);
			return { subscribed: true };
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : '訂閱失敗，稍後再試' });
		}
	}
};
