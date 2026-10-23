/**
 * Hand-maintained collections behind /setup and /bookshelf. Both pages render a
 * tidy empty state until these have entries — fill them in whenever.
 */

export type PhoneFinish = 'natural' | 'blue' | 'white' | 'black';

export type KeycapSet = 'stock' | 'purple-cheer';

/** Items with a `model` get a spinnable 3D render instead of a plain card. */
export type GearModel =
	| { kind: 'iphone-15-pro'; finish: PhoneFinish }
	| { kind: 'gpro-x-tkl'; keycaps: KeycapSet }
	| { kind: 'g502-lightspeed' };

export interface GearItem {
	name: string;
	spec?: string;
	note?: string;
	/** Has a cut-out product photo in static/gear/ (named after the item). Items with a `model` always do. */
	photo?: boolean;
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
		tagline: '每天帶在身上的',
		items: [
			{
				name: 'iPhone 15 Pro',
				spec: '藍色鈦金屬',
				model: { kind: 'iphone-15-pro', finish: 'blue' }
			},
			{ name: 'AirPods Pro 2', spec: '主動降噪', photo: true },
			{ name: 'Apple Watch SE', spec: '午夜色', photo: true }
		]
	},
	{
		name: '桌面',
		tagline: '每天敲、每天點的那幾樣',
		items: [
			{
				name: 'Logitech G PRO X TKL LIGHTSPEED',
				spec: '黑 · 茶軸 · 有線 / LIGHTSPEED / 藍牙',
				note: '有換上李珠珢的紫色應援鍵帽。',
				model: { kind: 'gpro-x-tkl', keycaps: 'stock' }
			},
			{
				name: 'Logitech G502 LIGHTSPEED',
				spec: '黑 · HERO 25K · LIGHTSPEED 無線',
				model: { kind: 'g502-lightspeed' }
			}
		]
	},
	{
		name: '主機',
		tagline: '桌機裡面的那幾顆',
		items: [
			{ name: 'AMD Ryzen 7 5800X', spec: '8 核心 16 執行緒 · AM4', photo: true },
			{
				name: 'NVIDIA GeForce RTX 3070 Ti',
				spec: 'Founders Edition · 8GB GDDR6X',
				photo: true
			},
			{ name: 'Predator GM7 1TB', spec: 'PCIe 4.0 NVMe M.2', photo: true }
		]
	},
	{
		name: '筆電',
		tagline: '帶出門的那台',
		items: [{ name: 'ASUS TUF Gaming Dash F15', spec: '2022 年款 · 灰', photo: true }]
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
