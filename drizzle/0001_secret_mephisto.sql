CREATE TABLE `articles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`surveillanceId` int NOT NULL,
	`title` text NOT NULL,
	`url` varchar(2048) NOT NULL,
	`source` varchar(255) NOT NULL,
	`excerpt` text,
	`publishedAt` timestamp,
	`discoveredAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `articles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `surveillance_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`executionHour` int NOT NULL,
	`executionMinute` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`lastExecutedAt` timestamp,
	`nextExecutedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `surveillance_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `surveillances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`executedAt` timestamp NOT NULL,
	`status` enum('success','failed','partial') NOT NULL DEFAULT 'success',
	`summary` text NOT NULL,
	`articlesCount` int NOT NULL DEFAULT 0,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `surveillances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `articles` ADD CONSTRAINT `articles_surveillanceId_surveillances_id_fk` FOREIGN KEY (`surveillanceId`) REFERENCES `surveillances`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `surveillance_config` ADD CONSTRAINT `surveillance_config_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `surveillances` ADD CONSTRAINT `surveillances_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;