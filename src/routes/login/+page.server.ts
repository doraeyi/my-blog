import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import type { PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth/api';
import { safeNext } from '$lib/login-next';

/** better-auth's messages are English; these are the ones a visitor actually meets. */
const messages: Record<string, string> = {
	INVALID_EMAIL_OR_PASSWORD: 'Email 或密碼不對，再試一次。',
	INVALID_EMAIL: 'Email 的格式好像不對。',
	INVALID_PASSWORD: 'Email 或密碼不對，再試一次。',
	USER_ALREADY_EXISTS: '這個 Email 已經註冊過了，直接登入就好。',
	USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: '這個 Email 已經註冊過了，直接登入就好。',
	PASSWORD_TOO_SHORT: '密碼太短了，至少要 8 個字元。',
	PASSWORD_TOO_LONG: '密碼太長了。',
	USER_NOT_FOUND: '找不到這個帳號，要不要先註冊？'
};

function failWith(error: unknown, fallback: string, mode: 'in' | 'up', email: string) {
	if (error instanceof APIError) {
		const code = (error.body as { code?: string } | undefined)?.code ?? '';
		return fail(400, { message: messages[code] ?? fallback, mode, email });
	}
	return fail(500, { message: '伺服器出了點問題，晚點再試。', mode, email });
}

export const load: PageServerLoad = (event) => {
	if (event.locals.user) {
		return redirect(302, safeNext(event.url.searchParams.get('next')));
	}
	return {};
};

export const actions: Actions = {
	signInEmail: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';
		const next = safeNext(formData.get('next'));

		try {
			await auth.api.signInEmail({
				body: {
					email,
					password,
					callbackURL: next
				}
			});
		} catch (error) {
			return failWith(error, '登入沒有成功，再試一次。', 'in', email);
		}

		return redirect(302, next);
	},
	signUpEmail: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';
		const name = formData.get('name')?.toString().trim() ?? '';
		const next = safeNext(formData.get('next'));

		if (!name)
			return fail(400, { message: '取個暱稱吧，留言時會顯示。', mode: 'up' as const, email });

		try {
			await auth.api.signUpEmail({
				body: {
					email,
					password,
					name,
					callbackURL: next
				}
			});
		} catch (error) {
			return failWith(error, '註冊沒有成功，再試一次。', 'up', email);
		}

		return redirect(302, next);
	},
	signInSocial: async (event) => {
		const formData = await event.request.formData();
		const provider = formData.get('provider')?.toString() ?? 'github';
		const callbackURL = safeNext(formData.get('callbackURL'));

		const result = await auth.api.signInSocial({
			body: {
				provider: provider as 'github',
				callbackURL
			}
		});

		if (result.url) {
			return redirect(302, result.url);
		}
		return fail(400, { message: 'GitHub 登入沒有成功，再試一次。' });
	},
	signOut: async (event) => {
		await auth.api.signOut({ headers: event.request.headers });
		// Stay on the page you signed out from, rather than landing on the login form.
		const from = event.request.headers.get('referer');
		const back = from && new URL(from).origin === event.url.origin ? new URL(from) : null;
		return redirect(302, safeNext(back ? back.pathname + back.search : '/'));
	}
};
