/**
 * Turntable stills for the /setup cards. Each 3D gear component can hand out a
 * `Shoot` function; the dev-only /dev/gear-shots page uses it to render a strip
 * of frames into static/gear/, so the list shows plain images and only the one
 * exhibit on the stand runs WebGL.
 */
import type { GearModel } from './collections';

/** Renders one frame with the object turned `yaw` radians from its resting pose; returns a PNG data URL. */
export type Shoot = (yaw: number) => string;

export const SPIN_FRAMES = 24;
/** Frame size of the stills, 4:3. */
export const SHOT_W = 640;
export const SHOT_H = 480;

export function gearSlug(name: string) {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

/** Yaw for frame i: a full turn for compact gear, a gentle sway for wide boards that read badly edge-on. */
export function spinYaw(model: GearModel, i: number) {
	const t = i / SPIN_FRAMES;
	return model.kind === 'gpro-x-tkl' ? Math.sin(t * Math.PI * 2) * 0.45 : t * Math.PI * 2;
}

export const posterUrl = (slug: string) => `/gear/${slug}.webp`;
export const spinUrl = (slug: string) => `/gear/${slug}-spin.webp`;
