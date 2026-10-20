/**
 * Hand-maintained collections behind /setup and /bookshelf. Both pages render a
 * tidy empty state until these have entries — fill them in whenever.
 */

export type PhoneFinish = 'natural' | 'blue' | 'white' | 'black';

export type KeycapSet = 'stock' | 'purple-cheer';

/** Items with a `model` get a spinnable 3D render instead of a plain card. */
export type GearModel =
	{ kind: 'iphone-15-pro'; finish: PhoneFinish } | { kind: 'gpro-x-tkl'; keycaps: KeycapSet };

export interface GearItem {
	name: string;
	spec?: string;
	note?: string;
	model?: GearModel;
}

export interface GearGroup {
	name: string;
	/** One-line flavour text under the group name. */
	tagline?: string;
	items: GearItem[];
}

// Example:
// { name: '主力機', tagline: '每天寫 code 的那台', items: [{ name: 'MacBook Pro 14"', spec: 'M3 Pro / 36GB' }] }
export const gear: GearGroup[] = [
	{
		name: '隨身',
		tagline: '口袋裡的那台',
		items: [
			{
				name: 'iPhone 15 Pro',
				spec: '藍色鈦金屬',
				model: { kind: 'iphone-15-pro', finish: 'blue' }
			}
		]
	},
	{
		name: '桌面',
		tagline: '每天敲的那把',
		items: [
			{
				name: 'Logitech G PRO X TKL LIGHTSPEED',
				spec: '黑 · 茶軸 · 有線 / LIGHTSPEED / 藍牙',
				model: { kind: 'gpro-x-tkl', keycaps: 'stock' }
			}
		]
	}
];

export type BookStatus = 'read' | 'reading' | 'want';

export interface Book {
	title: string;
	author: string;
	status: BookStatus;
	/** 1–5; leave out if unrated. */
	rating?: number;
	/** Cover image URL; without one the card draws a coloured spine instead. */
	cover?: string;
	/** A line or two of what stuck with you. */
	note?: string;
}

// Example:
// { title: '原子習慣', author: 'James Clear', status: 'read', rating: 4 }
export const books: Book[] = [];

export const bookStatusLabel: Record<BookStatus, string> = {
	read: '已讀',
	reading: '閱讀中',
	want: '想讀'
};
