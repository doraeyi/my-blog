---
title: 用 SvelteKit 打造個人部落格
date: '2026-07-10'
tags: [sveltekit, architecture]
excerpt: 前端、後端都用 SvelteKit 一個 process 搞定，之後有需要再考慮加 FastAPI 當輔助服務。
published: true
---

# 用 SvelteKit 打造個人部落格

這篇文章記錄一些架構決定：

- 認證交給 `better-auth`
- 資料庫用 SQLite + `drizzle-orm`
- 文章內容是 Markdown 檔，留言/按讚才進資料庫
- 之後若要接 Python 生態的功能，會以獨立服務的形式加入，而不是重寫整個後端
