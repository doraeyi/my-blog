---
title: 哈囉，世界
date: '2026-07-01'
tags: [meta, intro]
excerpt: 這個部落格是怎麼架起來的：SvelteKit + drizzle + better-auth，內容用 Markdown 檔管理。
published: true
---

# 哈囉，世界

歡迎來到這個部落格。這裡的文章都是純 Markdown 檔案，透過 [mdsvex](https://mdsvex.com) 編譯成 Svelte 元件渲染；留言和按讚才會存進 SQLite 資料庫。

## 為什麼文章不存資料庫？

因為文章內容本質上是靜態的，用檔案管理可以直接搭配 git 做版本控制，編輯完也不用額外跑一次「匯入資料庫」的流程。
