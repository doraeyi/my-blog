import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listFor, markAllRead } from '$lib/server/services/notifications-service';

export const load: PageServerLoad = async ({ locals, depends }) => {
	if (!locals.user) throw redirect(303, '/login');
	depends('app:notifications');
	const items = await listFor(locals.user.id);
	// Opening the page counts as reading everything on it.
	await markAllRead(locals.user.id);
	return { items };
};
