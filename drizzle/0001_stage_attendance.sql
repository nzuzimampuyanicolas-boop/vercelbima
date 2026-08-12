CREATE TABLE `stage_votes` (
	`participant_id` text NOT NULL,
	`place_id` text NOT NULL,
	`attending` integer NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY (`participant_id`, `place_id`),
	FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_stage_votes_place_id` ON `stage_votes` (`place_id`);
