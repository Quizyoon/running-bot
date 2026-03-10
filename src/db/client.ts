import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initDatabase(): Promise<void> {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");
  await pool.query(schema);
  console.log("Database initialized");
}
