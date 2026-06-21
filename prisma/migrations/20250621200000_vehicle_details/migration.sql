-- AlterTable
ALTER TABLE `vehicles`
    ADD COLUMN `model_name` VARCHAR(191) NULL,
    ADD COLUMN `model_code` VARCHAR(191) NULL,
    ADD COLUMN `fuel_type` ENUM('REGULAR', 'PREMIUM', 'DIESEL', 'KEROSENE', 'ELECTRIC', 'HYDROGEN', 'OTHER') NULL,
    ADD COLUMN `inspection_expiry` DATE NULL,
    ADD COLUMN `license_plate` VARCHAR(191) NULL,
    ADD COLUMN `first_registration_date` DATE NULL,
    ADD COLUMN `initial_odometer` INTEGER NULL,
    ADD COLUMN `displacement` INTEGER NULL,
    ADD COLUMN `drive_type` ENUM('FF', 'FR', 'RR', 'MR', 'AWD', 'FOUR_WD') NULL;
