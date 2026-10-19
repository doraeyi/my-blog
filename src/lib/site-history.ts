/**
 * Milestones shown on /history — only the turns worth remembering, not every
 * commit. Add a line here whenever the site changes shape.
 */
export const milestones: { date: string; title: string; detail?: string }[] = [
	{ date: '2026-08-07', title: '站點誕生', detail: '第一個 commit：首頁、文章與作品集' },
	{ date: '2026-08-26', title: '自架上線', detail: 'Docker 部署流程、Mermaid 圖表渲染' },
	{ date: '2026-08-27', title: '追劇紀錄', detail: '串 TMDB，加上演員頁' },
	{ date: '2026-08-28', title: '正式對外', detail: '接上 Traefik，網站開始對外服務' },
	{ date: '2026-09-28', title: '找得到東西了', detail: '全站搜尋、時間軸、標籤、RSS 與分享卡片' },
	{
		date: '2026-10-19',
		title: '導覽與首頁改版',
		detail: '大型下拉選單、手記重做，新增碎念、留言板、友鏈、書櫃與配備'
	}
];
