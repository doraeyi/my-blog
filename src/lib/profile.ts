/**
 * Facts about Liam shared by the 人物檔案 (/about) and the English profile (/english).
 * Keep them to things that are true and current — recruiters read both pages.
 * Taken from the résumé (2026-10); contact details stay off the site on purpose.
 */

/** Résumé PDF in static/, or null until a public-safe one (no phone/address) is added. */
export const resumeUrl: string | null = null;

export interface ExperienceEntry {
	/** e.g. "2024.08 — 現在" */
	period: string;
	org: string;
	role: string;
	/** One to three short lines of what was done there. */
	points: string[];
	/** The same entry for the English profile. */
	en: { period: string; org: string; role: string; points: string[] };
}

/** Work history and major projects, newest first. */
export const experience: ExperienceEntry[] = [
	{
		period: '2024.08 — 現在',
		org: 'MSI 微星科技',
		role: '前端工程師',
		points: ['負責網頁前端開發，把設計稿變成真正好用的介面。'],
		en: {
			period: 'Aug 2024 — now',
			org: 'MSI',
			role: 'Frontend Engineer',
			points: [
				'Front-end development: turning designs into interfaces people actually enjoy using.'
			]
		}
	},
	{
		period: '2023.10 — 2025.06',
		org: '致理科技大學 · 畢業專題',
		role: 'MeowTrade 視覺化電商地圖 · 組長 / 前端',
		points: [
			'帶領團隊開發以地圖瀏覽商品的電商平台（ASP.NET），負責前台與前端。',
			'用 SignalR 做出一對一的即時聊天室。',
			'串接藍新金流完成線上付款流程。'
		],
		en: {
			period: 'Oct 2023 — Jun 2025',
			org: 'Chihlee University · Capstone',
			role: 'MeowTrade map-based e-commerce · Team lead / Frontend',
			points: [
				'Led the team building an e-commerce platform browsed through a map (ASP.NET); owned the storefront and front end.',
				'Built one-to-one real-time chat with SignalR.',
				'Integrated NewebPay for online checkout.'
			]
		}
	}
];

/** Education, newest first. */
export const education: ExperienceEntry[] = [
	{
		period: '2021.09 — 2025.06',
		org: '致理科技大學',
		role: '資訊學系（四技）',
		points: [
			'2024 CID 創新設計實務研討會 入圍・2023 第二屆商管盃 佳作',
			'RoboMaster 影像辨識機器人專案',
			'丙級電腦軟體設計技術士・ITE 資訊管理專業人員'
		],
		en: {
			period: 'Sep 2021 — Jun 2025',
			org: 'Chihlee University of Technology',
			role: 'B.S. in Information Technology',
			points: [
				'Finalist, 2024 CID Innovative Design conference · Honorable mention, 2023 Business Cup',
				'RoboMaster robot project with image recognition',
				'Certified: Computer Software Design (Level C) · ITE Information Management'
			]
		}
	}
];
