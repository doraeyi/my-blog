// ==UserScript==
// @name         Liam 偵探手記 · 正在觀看回報
// @namespace    https://blog.doraeyi.com
// @version      1.0.0
// @description  在播放頁時，每 45 秒把「劇名 + 集數」回報給部落格的「正在觀看」。只在分頁位於前景時回報。
// @match        https://gimyai.tw/play/*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      blog.doraeyi.com
// @connect      localhost
// @run-at       document-idle
// ==/UserScript==

(function () {
	'use strict';

	// ── 設定 ─────────────────────────────────────────────
	// 部落格網址（本機測試時改成 http://localhost:5173）
	const BLOG = 'https://blog.doraeyi.com';
	// 跟伺服器 .env 的 NOW_WATCHING_TOKEN 一模一樣
	const TOKEN = '把你的 NOW_WATCHING_TOKEN 貼在這裡';
	const EVERY_MS = 45 * 1000;
	// ────────────────────────────────────────────────────

	/** Title and episode from the page's own player config, with fallbacks. */
	function readEpisode() {
		const p = unsafeWindow.player_aaaa;
		const title =
			p?.vod_data?.vod_name ||
			document
				.querySelector('h1')
				?.textContent?.replace(/第\s*\d+\s*集.*/, '')
				.trim() ||
			document.title.split(' 第')[0].trim();
		// URL is /play/{id}-{line}-{episode}.html
		const fromUrl = Number(location.pathname.match(/-(\d+)\.html$/)?.[1]);
		const episode = Number.isInteger(p?.nid) ? p.nid : Number.isInteger(fromUrl) ? fromUrl : null;
		return title ? { title, episode } : null;
	}

	function ping() {
		if (document.visibilityState !== 'visible') return;
		const ep = readEpisode();
		if (!ep) return;
		GM_xmlhttpRequest({
			method: 'POST',
			url: `${BLOG}/api/now-watching`,
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
			data: JSON.stringify(ep),
			onload: (res) => {
				if (res.status >= 400) console.warn('[正在觀看] 回報失敗', res.status, res.responseText);
				else console.info('[正在觀看] 已回報', ep);
			},
			onerror: (e) => console.warn('[正在觀看] 連不到部落格', e)
		});
	}

	ping();
	setInterval(ping, EVERY_MS);
	// Report immediately when coming back to the tab.
	document.addEventListener('visibilitychange', ping);
})();
