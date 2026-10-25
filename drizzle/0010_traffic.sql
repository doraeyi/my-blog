CREATE TABLE `referrer_daily` (
	`day` text NOT NULL,
	`source` text NOT NULL,
	`views` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `referrer_daily_day_source` ON `referrer_daily` (`day`,`source`);--> statement-breakpoint
CREATE TABLE `traffic_daily` (
	`day` text NOT NULL,
	`path` text NOT NULL,
	`views` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `traffic_daily_day_path` ON `traffic_daily` (`day`,`path`);--> statement-breakpoint
CREATE TABLE `visits_daily` (
	`day` text PRIMARY KEY NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	`visitors` integer DEFAULT 0 NOT NULL
);
