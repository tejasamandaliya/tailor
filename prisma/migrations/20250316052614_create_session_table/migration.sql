-- CreateTable
CREATE TABLE `Session` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shopifySessionId` VARCHAR(191) NOT NULL,
    `shop` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `isOnline` BOOLEAN NOT NULL,
    `scope` VARCHAR(191) NULL,
    `expires` DATETIME(3) NULL,
    `accessToken` VARCHAR(191) NOT NULL,
    `userId` BIGINT NULL,
    `email` VARCHAR(191) NULL,
    `locale` VARCHAR(191) NULL,
    `collaborator` BOOLEAN NULL DEFAULT false,
    `emailVerified` BOOLEAN NULL DEFAULT false,
    `name` VARCHAR(191) NULL,
    `planDisplayName` VARCHAR(191) NULL,
    `planShopifyPlus` BOOLEAN NULL,
    `contactEmail` VARCHAR(191) NULL,
    `shopId` VARCHAR(191) NULL,
    `shopCreatedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `timezoneAbbreviation` VARCHAR(191) NULL,

    UNIQUE INDEX `Session_shopifySessionId_key`(`shopifySessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
