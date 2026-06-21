-- Allow decimal distance since last fill.
ALTER TABLE `fuel_logs` MODIFY COLUMN `distance_km` DECIMAL(10, 2) NOT NULL;
