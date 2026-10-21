// server/src/core/repos/propertyRepo.js
import { getDatabase } from "../../../db/connection.js";

function mapProperty(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    createdAt: row.created_at,
  };
}

export function getAll(db = getDatabase()) {
  const rows = db
    .prepare("SELECT * FROM properties ORDER BY created_at ASC")
    .all();
  return rows.map(mapProperty);
}

export function findById(id, db = getDatabase()) {
  const row = db.prepare("SELECT * FROM properties WHERE id = ?").get(id);
  return mapProperty(row);
}

export function insert(property, db = getDatabase()) {
  const stmt = db.prepare(`
    INSERT INTO properties (id, name, address)
    VALUES (?, ?, ?)
  `);
  stmt.run(property.id, property.name, property.address);
  return findById(property.id, db);
}

export function update(id, changes, db = getDatabase()) {
  const fields = [];
  const values = [];

  if (changes.name !== undefined) {
    fields.push("name = ?");
    values.push(changes.name);
  }
  if (changes.address !== undefined) {
    fields.push("address = ?");
    values.push(changes.address);
  }

  if (fields.length === 0) return findById(id, db);

  values.push(id);
  db.prepare(`UPDATE properties SET ${fields.join(", ")} WHERE id = ?`).run(
    ...values,
  );
  return findById(id, db);
}
