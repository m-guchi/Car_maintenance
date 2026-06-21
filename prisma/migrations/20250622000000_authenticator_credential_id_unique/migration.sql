-- Auth.js Prisma adapter looks up authenticators by credentialID alone (findUnique).
-- Requires a unique index on credential_id in addition to the composite primary key.
CREATE UNIQUE INDEX `authenticators_credential_id_key` ON `authenticators`(`credential_id`);
