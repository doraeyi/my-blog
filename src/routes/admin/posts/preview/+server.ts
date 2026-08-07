import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { renderBody } from '$lib/server/services/posts-service';

// +server.ts endpoints are NOT covered by admin/+layout.server.ts's guard — that `load`
// only runs for page renders, so this check has to be repeated here.
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) throw error(401, '請先登入才能使用後台。');
	if (locals.user.role !== 'Liam') throw error(403, '你的帳號沒有後台權限。');

	const { markdown } = await request.json();
	const html = await renderBody(typeof markdown === 'string' ? markdown : '');
	return json({ html });
};
