import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import * as friendsService from '$lib/server/services/friends-service';

export const load: PageServerLoad = async () => {
	const friends = await friendsService.listAll();
	return {
		friends: friends.map(({ posts, ...f }) => ({
			...f,
			postCount: posts.length,
			lost: friendsService.isLost(f)
		}))
	};
};

function read(formData: FormData) {
	const s = (k: string) => formData.get(k)?.toString() ?? '';
	return {
		name: s('name'),
		url: s('url'),
		avatar: s('avatar'),
		description: s('description'),
		email: s('email'),
		feedUrl: s('feedUrl'),
		backlinkUrl: s('backlinkUrl'),
		joinCircle: formData.get('joinCircle') === 'on',
		groupName: s('groupName'),
		sortOrder: Number(s('sortOrder')) || 0,
		adminNote: s('adminNote')
	};
}

const id = async (request: Request) => (await request.formData()).get('id')?.toString() ?? '';

async function attempt(fn: () => Promise<unknown>, fallback: string) {
	try {
		await fn();
	} catch (err) {
		return fail(400, { message: err instanceof Error ? err.message : fallback });
	}
}

export const actions: Actions = {
	discover: async ({ request }) => {
		const url = (await request.formData()).get('url')?.toString() ?? '';
		try {
			return { discovered: await friendsService.discover(url) };
		} catch (err) {
			return fail(400, { message: err instanceof Error ? err.message : '讀不到這個網站' });
		}
	},
	create: async ({ request }) =>
		attempt(async () => friendsService.create(read(await request.formData())), '新增失敗'),
	update: async ({ request }) => {
		const formData = await request.formData();
		return attempt(
			() => friendsService.update(formData.get('id')?.toString() ?? '', read(formData)),
			'儲存失敗'
		);
	},
	approve: async ({ request }) =>
		attempt(async () => friendsService.setStatus(await id(request), 'approved'), '操作失敗'),
	reject: async ({ request }) => {
		const formData = await request.formData();
		return attempt(
			() =>
				friendsService.setStatus(
					formData.get('id')?.toString() ?? '',
					'rejected',
					formData.get('reviewNote')?.toString() ?? ''
				),
			'操作失敗'
		);
	},
	hide: async ({ request }) =>
		attempt(async () => friendsService.setStatus(await id(request), 'hidden'), '操作失敗'),
	remove: async ({ request }) =>
		attempt(async () => friendsService.remove(await id(request)), '刪除失敗'),
	check: async ({ request }) =>
		attempt(async () => friendsService.checkFriend(await id(request)), '檢查失敗'),
	checkAll: async () => attempt(() => friendsService.refreshAll(), '檢查失敗')
};
