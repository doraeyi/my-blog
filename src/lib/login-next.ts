/** The login link that brings you back to `here` (a path, maybe with #hash) once you're in. */
export function loginHref(here: string): string {
	return `/login?next=${encodeURIComponent(here)}`;
}

/**
 * Where to go after signing in: a path on this site only, so a crafted
 * `?next=https://…` or `//evil.example` can't bounce someone off-site.
 */
export function safeNext(next: unknown): string {
	if (typeof next !== 'string') return '/';
	if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/';
	if (next.startsWith('/login')) return '/';
	return next;
}
