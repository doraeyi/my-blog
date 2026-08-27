CREATE TABLE `watch_item` (
	`id` text PRIMARY KEY NOT NULL,
	`tmdb_id` integer NOT NULL,
	`media_type` text NOT NULL,
	`title` text NOT NULL,
	`overview` text,
	`poster_path` text,
	`backdrop_path` text,
	`release_date` text,
	`vote_average` real,
	`status` text DEFAULT 'watching' NOT NULL,
	`current_season` integer,
	`current_episode` integer,
	`total_seasons` integer,
	`total_episodes` integer,
	`watched_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `watch_item_tmdb_idx` ON `watch_item` (`tmdb_id`,`media_type`);--> statement-breakpoint
CREATE TABLE `watch_item_cast` (
	`id` text PRIMARY KEY NOT NULL,
	`watch_item_id` text NOT NULL,
	`tmdb_person_id` integer NOT NULL,
	`name` text NOT NULL,
	`character` text,
	`profile_path` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`watch_item_id`) REFERENCES `watch_item`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `watch_item_cast_idx` ON `watch_item_cast` (`watch_item_id`,`tmdb_person_id`);