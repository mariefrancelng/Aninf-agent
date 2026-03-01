CREATE TABLE `alert_keywords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`keyword` varchar(255) NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alert_keywords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`lastEmailSentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `alert_keywords` ADD CONSTRAINT `alert_keywords_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_subscriptions` ADD CONSTRAINT `email_subscriptions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;