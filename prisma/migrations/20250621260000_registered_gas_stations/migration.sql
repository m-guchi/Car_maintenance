-- CreateTable
CREATE TABLE `registered_gas_stations` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `osm_id` VARCHAR(191) NULL,
    `registered_name` VARCHAR(191) NOT NULL,
    `brand` VARCHAR(191) NULL,
    `hidden_from_picker` BOOLEAN NOT NULL DEFAULT false,
    `display_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `registered_gas_stations_user_id_osm_id_key`(`user_id`, `osm_id`),
    UNIQUE INDEX `registered_gas_stations_user_id_registered_name_key`(`user_id`, `registered_name`),
    INDEX `registered_gas_stations_user_id_display_order_idx`(`user_id`, `display_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `registered_gas_stations` ADD CONSTRAINT `registered_gas_stations_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
