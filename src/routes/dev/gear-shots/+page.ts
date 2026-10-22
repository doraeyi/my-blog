import { dev } from '$app/environment';
import { error } from '@sveltejs/kit';

// Dev-only tool: renders the /setup card stills into static/gear/.
export const ssr = false;

export function load() {
	if (!dev) error(404, 'Not found');
}
