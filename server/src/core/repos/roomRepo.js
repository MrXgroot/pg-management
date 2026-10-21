// server/src/core/repos/roomRepo.js
import { getDatabase } from "../../../db/connection.js";

function mapRoom(row) {
  if (!row) return null;
  return {
    id: row.id,
    floorId: row.floor_id,
    roomNumber: row.room_number,
  };
}

export function findById(id, db = getDatabase()) {
  const row = db.prepare("SELECT * FROM rooms WHERE id = ?").get(id);
  return mapRoom(row);
}

export function findByFloorId(floorId, db = getDatabase()) {
  const rows = db
    .prepare("SELECT * FROM rooms WHERE floor_id = ? ORDER BY room_number ASC")
    .all(floorId);
  return rows.map(mapRoom);
}

export function insert(room, db = getDatabase()) {
  db.prepare(
    `
    INSERT INTO rooms (id, floor_id, room_number)
    VALUES (?, ?, ?)
  `,
  ).run(room.id, room.floorId, room.roomNumber);
  return findById(room.id, db);
}

export function update(id, changes, db = getDatabase()) {
  if (changes.roomNumber === undefined) return findById(id, db);

  db.prepare("UPDATE rooms SET room_number = ? WHERE id = ?").run(
    changes.roomNumber,
    id,
  );
  return findById(id, db);
}

export function remove(id, db = getDatabase()) {
  const childBeds = db
    .prepare("SELECT COUNT(*) as count FROM beds WHERE room_id = ?")
    .get(id);
  if (childBeds.count > 0) {
    throw new Error(`Cannot delete room ${id}: room contains child beds.`);
  }
  db.prepare("DELETE FROM rooms WHERE id = ?").run(id);
}
