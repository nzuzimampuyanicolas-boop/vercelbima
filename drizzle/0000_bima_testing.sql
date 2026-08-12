CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`manage_token` text NOT NULL,
	`organizer_name` text NOT NULL,
	`title` text NOT NULL,
	`city` text NOT NULL,
	`max_places` integer NOT NULL,
	`budget_eur` integer,
	`response_deadline` text,
	`confirmed_date_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `events_slug_unique` ON `events` (`slug`);
--> statement-breakpoint
CREATE UNIQUE INDEX `events_manage_token_unique` ON `events` (`manage_token`);
--> statement-breakpoint
CREATE TABLE `places` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`position` integer NOT NULL,
	`start_time` text,
	`maps_url` text NOT NULL,
	`name` text NOT NULL,
	`rating` text,
	`rating_label` text,
	`address` text,
	`category` text,
	`hours` text,
	`image` text,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `places_event_position_unique` ON `places` (`event_id`,`position`);
--> statement-breakpoint
CREATE TABLE `date_options` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`position` integer NOT NULL,
	`starts_at` text NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `date_options_event_position_unique` ON `date_options` (`event_id`,`position`);
--> statement-breakpoint
CREATE TABLE `participants` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`token` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `participants_event_token_unique` ON `participants` (`event_id`,`token`);
--> statement-breakpoint
CREATE TABLE `votes` (
	`participant_id` text NOT NULL,
	`date_option_id` text NOT NULL,
	`available` integer NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY (`participant_id`, `date_option_id`),
	FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`date_option_id`) REFERENCES `date_options`(`id`) ON UPDATE no action ON DELETE cascade
);
