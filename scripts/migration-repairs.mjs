/** @typedef {{ migration: string, table: string, columns: Array<{ name: string, ddl: string }> }} MigrationRepair */

/** @type {MigrationRepair[]} */
export const MIGRATION_REPAIRS = [
  {
    migration: "20250623000000_registered_gas_station_coords",
    table: "registered_gas_stations",
    columns: [
      { name: "latitude", ddl: "ADD COLUMN `latitude` DOUBLE NULL" },
      { name: "longitude", ddl: "ADD COLUMN `longitude` DOUBLE NULL" },
    ],
  },
  {
    migration: "20250623100000_maintenance_category_intervals",
    table: "maintenance_categories",
    columns: [
      { name: "interval_km", ddl: "ADD COLUMN `interval_km` INTEGER NULL" },
      { name: "interval_days", ddl: "ADD COLUMN `interval_days` INTEGER NULL" },
    ],
  },
];
