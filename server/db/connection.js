import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB_PATH = join(__dirname, "stay_ledger.db");

let persistentDbInstance = null;

export function initSchema(db) {
  const schemaSql = readFileSync(join(__dirname, "schema.sql"), "utf-8");
  db.exec(schemaSql);
}

export function getDatabase(dbPath = DEFAULT_DB_PATH) {
  // Return cached instance if already open
  if (dbPath !== ":memory:" && persistentDbInstance) {
    return persistentDbInstance;
  }

  const db = new Database(dbPath);

  // Enforce engine invariants
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 5000");

  // Auto-initialize schema so tables always exist on disk
  initSchema(db);

  if (dbPath !== ":memory:") {
    persistentDbInstance = db;
  }

  return db;
}
