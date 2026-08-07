import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
	if (!locals.user) throw error(401, '請先登入才能使用後台。');
	if (locals.user.role !== 'Liam') throw error(403, '你的帳號沒有後台權限。');
	return { user: locals.user };
};