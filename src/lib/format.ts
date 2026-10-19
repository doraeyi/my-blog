export function wordCountLabel(chars: number): string {
	return chars >= 10000 ? `${(chars / 10000).toFixed(1)} 萬字` : `${chars} 字`;
}

/** Rough reading time: CJK read ~400 chars/min, Latin ~200 words/min. Never below 1. */
export function readingMinutes(text: string): number {
	const cjk = text.match(/[㐀-鿿豈-﫿]/g)?.length ?? 0;
	const words = text.replace(/[㐀-鿿豈-﫿]/g, ' ').match(/[A-Za-z0-9]+/g)?.length ?? 0;
	return Math.max(1, Math.round(cjk / 400 + words / 200));
}

export function formatDate(date: Date): string {
	return date.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

/** "剛剛" / "5 分鐘前" / "3 天前" / "2 個月前" / "1 年前" — for compact "latest" lists. */
export function timeAgo(date: Date, now: Date = new Date()): string {
	const s = Math.max(0, (now.getTime() - date.getTime()) / 1000);
	if (s < 60) return '剛剛';
	if (s < 3600) return `${Math.floor(s / 60)} 分鐘前`;
	if (s < 86400) return `${Math.floor(s / 3600)} 小時前`;
	const d = Math.floor(s / 86400);
	if (d < 7) return `${d} 天前`;
	if (d < 30) return `${Math.floor(d / 7)} 週前`;
	if (d < 365) return `${Math.floor(d / 30)} 個月前`;
	return `${Math.floor(d / 365)} 年前`;
}
