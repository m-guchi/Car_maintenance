-- Rename distance field and add optional odometer reading.
ALTER TABLE `fuel_logs` CHANGE COLUMN `odometer` `distance_km` INTEGER NOT NULL;

ALTER TABLE `fuel_logs` ADD COLUMN `odometer` INTEGER NULL;
