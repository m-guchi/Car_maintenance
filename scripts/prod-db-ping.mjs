import "dotenv/config";
import mariadb from "mariadb";

const host = process.env.DB_HOST?.trim() || "127.0.0.1";
const port = Number(process.env.DB_PORT?.trim() || "3306");
const user = process.env.DB_USER?.trim();
const password = process.env.DB_PASSWORD;
const database = process.env.DB_NAME?.trim();

if (!user || password == null || password === "" || !database) {
  console.error("NG: .env に DB_USER / DB_PASSWORD / DB_NAME がありません。");
  process.exit(1);
}

const pool = mariadb.createPool({
  host,
  port,
  user,
  password,
  database,
  connectionLimit: 1,
  connectTimeout: 5000,
});

try {
  const conn = await pool.getConnection();
  await conn.query("SELECT 1");
  conn.release();
  await pool.end();
  console.log(`OK: MySQL ${host}:${port}/${database}`);
} catch (error) {
  console.error("NG: MySQL に接続できません。");
  if (error instanceof Error) {
    console.error(error.message);
  }
  process.exit(1);
}
