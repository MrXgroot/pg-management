// server/src/core/repos/floorRepo.js
import { getDatabase } from "../../../db/connection.js";

function mapFloor(row) {
  if (!row) return null;
  return {
    id: row.id,
    propertyId: row.property_id,
    displayOrder: row.display_order,
    name: row.name,
  };
}

export function findById(id, db = getDatabase()) {
  const row = db.prepare("SELECT * FROM floors WHERE id = ?").get(id);
  return mapFloor(row);
}

export function findByPropertyId(propertyId, db = getDatabase()) {
  const rows = db
    .prepare(
      "SELECT * FROM floors WHERE property_id = ? ORDER BY display_order ASC",
    )
    .all(propertyId);
  return rows.map(mapFloor);
}

export function insert(floor, db = getDatabase()) {
  db.prepare(
    `
    INSERT INTO floors (id, property_id, display_order, name)
    VALUES (?, ?, ?, ?)
  `,
  ).run(floor.id, floor.propertyId, floor.displayOrder, floor.name);
  return findById(floor.id, db);
}

export function update(id, changes, db = getDatabase()) {
  const fields = [];
  const values = [];

  if (changes.name !== undefined) {
    fields.push("name = ?");
    values.push(changes.name);
  }
  if (changes.displayOrder !== undefined) {
    fields.push("display_order = ?");
    values.push(changes.displayOrder);
  }

  if (fields.length === 0) return findById(id, db);

  values.push(id);
  db.prepare(`UPDATE floors SET ${fields.join(", ")} WHERE id = ?`).run(
    ...values,
  );
  return findById(id, db);
}

export function remove(id, db = getDatabase()) {
  const childRooms = db
    .prepare("SELECT COUNT(*) as count FROM rooms WHERE floor_id = ?")
    .get(id);
  if (childRooms.count > 0) {
    throw new Error(`Cannot delete floor ${id}: floor contains child rooms.`);
  }
  db.prepare("DELETE FROM floors WHERE id = ?").run(id);
}
