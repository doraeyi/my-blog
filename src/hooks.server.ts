import { sequence } from '@sveltejs/kit/hooks';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import type { Handle } from '@sveltejs/kit';
import { getTextDirection } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) =>
				html
					// Content is Traditional Chinese except the English profile under /english,
					// whatever the (unused) paraglide locale says; screen readers and search
					// engines go by this.
					.replace(
						'%paraglide.lang%',
						event.url.pathname === '/english' || event.url.pathname.startsWith('/english/')
							? 'en'
							: locale === 'en'
								? 'zh-Hant-TW'
								: locale
					)
					.replace('%paraglide.dir%', getTextDirection(locale))
		});
	});

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

// Form actions don't run the admin layout's `load`, so its role check never
// covers POSTs — without this, anyone could call /admin/*?/delete directly.
const guardAdminWrites: Handle = ({ event, resolve }) => {
	if (
		event.url.pathname.startsWith('/admin') &&
		event.request.method !== 'GET' &&
		event.request.method !== 'HEAD' &&
		event.locals.user?.role !== 'Liam'
	) {
		return new Response('Forbidden', { status: 403 });
	}
	return resolve(event);
};

export const handle: Handle = sequence(handleParaglide, handleBetterAuth, guardAdminWrites);
