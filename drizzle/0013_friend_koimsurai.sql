-- Custom SQL migration file, put your code below! --
-- Liam added Koimsurai (宙と木) to the link exchange. Skipped if the site is already listed.
INSERT OR IGNORE INTO `friend` (`id`, `name`, `url`, `avatar`, `description`, `feed_url`, `join_circle`, `group_name`, `sort_order`, `status`, `token`, `approved_at`, `created_at`)
VALUES (
	lower(hex(randomblob(16))),
	'Koimsurai',
	'https://koimsurai.com',
	'https://koimsurai.com/apple-touch-icon.png',
	'宙と木，一個寫代碼的人，偶爾造點東西。',
	'https://koimsurai.com/rss',
	1,
	'朋友',
	0,
	'approved',
	lower(hex(randomblob(16))),
	CAST(strftime('%s', 'now') AS INTEGER),
	CAST(strftime('%s', 'now') AS INTEGER)
);
