CREATE TABLE `project` (
	`id` text PRIMARY KEY NOT NULL,
	`github_owner` text NOT NULL,
	`github_repo` text NOT NULL,
	`description` text,
	`homepage_url` text,
	`readme_html` text,
	`star_count` integer DEFAULT 0 NOT NULL,
	`last_synced_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_owner_repo_idx` ON `project` (`github_owner`,`github_repo`);--> statement-breakpoint
CREATE TABLE `project_collaborator` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`github_username` text NOT NULL,
	`avatar_url` text,
	`profile_url` text,
	`role` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_collaborator_idx` ON `project_collaborator` (`project_id`,`github_username`);--> statement-breakpoint
CREATE TABLE `project_commit_daily` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`date` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_commit_daily_idx` ON `project_commit_daily` (`project_id`,`date`);