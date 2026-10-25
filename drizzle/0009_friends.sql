CREATE TABLE `friend` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`avatar` text,
	`description` text NOT NULL,
	`email` text,
	`feed_url` text,
	`backlink_url` text,
	`join_circle` integer DEFAULT true NOT NULL,
	`group_name` text DEFAULT '朋友' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`review_note` text,
	`admin_note` text,
	`token` text NOT NULL,
	`checked_at` integer,
	`http_status` integer,
	`latency_ms` integer,
	`last_ok_at` integer,
	`backlink_ok` integer,
	`feed_fetched_at` integer,
	`feed_error` text,
	`approved_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `friend_url_unique` ON `friend` (`url`);--> statement-breakpoint
CREATE TABLE `friend_post` (
	`id` text PRIMARY KEY NOT NULL,
	`friend_id` text NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`summary` text,
	`published_at` integer NOT NULL,
	FOREIGN KEY (`friend_id`) REFERENCES `friend`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `friend_post_friend_url` ON `friend_post` (`friend_id`,`url`);