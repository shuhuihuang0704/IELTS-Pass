CREATE TABLE `auth_recovery_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`code_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`used_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_auth_recovery_codes_code_hash` ON `auth_recovery_codes` (`code_hash`);--> statement-breakpoint
CREATE INDEX `idx_auth_recovery_codes_user_id` ON `auth_recovery_codes` (`user_id`);