import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { mailEnabled } from '$lib/server/mail';
import * as newsletterService from '$lib/server/services/newsletter-service';

export const load: PageServerLoad = async () => {
	const [subscribers, issues] = await Promise.all([
		newsletterService.listSubscribers(),
		newsletterService.listIssues()
	]);
	return { subscribers, issues, enabled: mailEnabled() };
};

async function attempt<T>(fn: () => Promise<T>, fallback: string) {
	try {
		return await fn();
	} catch (err) {
		return fail(400, { message: err instanceof Error ? err.message : fallback });
	}
}

export const actions: Actions = {
	send: async ({ request }) => {
		const key = (await request.formData()).get('key')?.toString() ?? '';
		return attempt(async () => {
			const sent = await newsletterService.sendIssue(key);
			return { notice: `已寄給 ${sent} 位訂閱者` };
		}, '寄送失敗');
	},
	test: async ({ request, locals }) => {
		const key = (await request.formData()).get('key')?.toString() ?? '';
		return attempt(async () => {
			await newsletterService.sendTest(key, locals.user!.email);
			return { notice: `測試信已寄到 ${locals.user!.email}` };
		}, '寄送失敗');
	},
	remove: async ({ request }) => {
		const id = (await request.formData()).get('id')?.toString() ?? '';
		return attempt(() => newsletterService.removeSubscriber(id), '刪除失敗');
	}
};
