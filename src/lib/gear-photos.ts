/**
 * Cut-out product photos for /setup, one per piece of gear, in static/gear/
 * named after the item. Official product shots (Apple, Logitech), trimmed to
 * a transparent background.
 */
export function gearSlug(name: string) {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

export const photoUrl = (name: string) => `/gear/${gearSlug(name)}.webp`;
