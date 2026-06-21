-- OSM ID can exceed signed INT range (e.g. large way IDs).
ALTER TABLE `fuel_logs` MODIFY COLUMN `gas_station_osm_id` VARCHAR(32) NULL;
