CREATE TABLE `webmention` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`target` text NOT NULL,
	`kind` text DEFAULT 'mention' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`author_name` text,
	`author_url` text,
	`author_photo` text,
	`title` text,
	`excerpt` text,
	`friend_id` text,
	`verified_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`friend_id`) REFERENCES `friend`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `webmention_source_target` ON `webmention` (`source`,`target`);