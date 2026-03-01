CREATE TABLE `weekly_summaries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`weekStartDate` timestamp NOT NULL,
	`weekEndDate` timestamp NOT NULL,
	`summary` text NOT NULL,
	`articlesCount` int NOT NULL DEFAULT 0,
	`articlesIds` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weekly_summaries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `articles` ADD `userId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `articles` ADD `urlHash` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `weekly_summaries` ADD CONSTRAINT `weekly_summaries_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `articles` ADD CONSTRAINT `articles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;