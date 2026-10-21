import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createTestDb() {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");

  const schemaSql = fs.readFileSync(
    path.resolve(__dirname, "../../db/schema.sql"),
    "utf-8",
  );
  db.exec(schemaSql);

  return db;
}
