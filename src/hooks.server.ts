import { sequence } from '@sveltejs/kit/hooks';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import type { Handle, HandleServerError, ServerInit } from '@sveltejs/kit';
import { getTextDirection } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { startBackupSchedule } from '$lib/server/backup';
import { notifyOps } from '$lib/server/discord';

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

// SvelteKit's built-in cross-site form check, minus the endpoints that other
// servers legitimately post to without an Origin header: webmention senders,
// and mail apps' one-click unsubscribe (RFC 8058). Both only ever act on a URL
// or token the poster already has, so there's nothing to forge.
const CSRF_EXEMPT = /^\/(webmention$|subscribe\/unsubscribe\/)/;
const FORM_TYPES = /^(application\/x-www-form-urlencoded|multipart\/form-data|text\/plain)/i;

const guardCrossSiteForms: Handle = ({ event, resolve }) => {
	const { request, url } = event;
	if (
		!building &&
		['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) &&
		FORM_TYPES.test(request.headers.get('content-type') ?? '') &&
		request.headers.get('origin') !== url.origin &&
		!CSRF_EXEMPT.test(url.pathname)
	) {
		return new Response(`Cross-site ${request.method} form submissions are forbidden`, {
			status: 403
		});
	}
	return resolve(event);
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

export const handle: Handle = sequence(
	guardCrossSiteForms,
	handleParaglide,
	handleBetterAuth,
	guardAdminWrites
);

export const init: ServerInit = () => {
	if (!building) startBackupSchedule();
};

// Anything that wasn't a deliberate error(…) — a crash in a load, an action or
// an endpoint — pings Discord with where it happened, then shows the normal
// error page.
export const handleError: HandleServerError = ({ error, event, status, message }) => {
	if (status !== 404) {
		const detail =
			error instanceof Error
				? [error.message, ...(error.stack?.split('\n').slice(1, 6) ?? [])].join('\n')
				: String(error);
		notifyOps(
			`網站出錯：${event.request.method} ${event.url.pathname}（${status}）`,
			detail,
			event.url.href
		);
		console.error(error);
	}
	return { message };
};
