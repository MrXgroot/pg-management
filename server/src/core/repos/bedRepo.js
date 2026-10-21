// server/src/core/repos/bedRepo.js
import { getDatabase } from "../../../db/connection.js";

function mapBed(row) {
  if (!row) return null;
  return {
    id: row.id,
    roomId: row.room_id,
    bedLabel: row.bed_label,
    isActive: Boolean(row.is_active),
  };
}

export function findById(id, db = getDatabase()) {
  const row = db.prepare("SELECT * FROM beds WHERE id = ?").get(id);
  return mapBed(row);
}

export function findByRoomId(roomId, db = getDatabase()) {
  const rows = db
    .prepare("SELECT * FROM beds WHERE room_id = ? ORDER BY bed_label ASC")
    .all(roomId);
  return rows.map(mapBed);
}

export function insert(bed, db = getDatabase()) {
  db.prepare(
    `
    INSERT INTO beds (id, room_id, bed_label, is_active)
    VALUES (?, ?, ?, ?)
  `,
  ).run(bed.id, bed.roomId, bed.bedLabel, (bed.isActive ?? 1) ? 1 : 0);
  return findById(bed.id, db);
}

export function update(id, changes, db = getDatabase()) {
  const fields = [];
  const values = [];

  if (changes.bedLabel !== undefined) {
    fields.push("bed_label = ?");
    values.push(changes.bedLabel);
  }
  if (changes.isActive !== undefined) {
    fields.push("is_active = ?");
    values.push(changes.isActive ? 1 : 0);
  }

  if (fields.length === 0) return findById(id, db);

  values.push(id);
  db.prepare(`UPDATE beds SET ${fields.join(", ")} WHERE id = ?`).run(
    ...values,
  );
  return findById(id, db);
}

export function setActive(id, isActive, db = getDatabase()) {
  db.prepare("UPDATE beds SET is_active = ? WHERE id = ?").run(
    isActive ? 1 : 0,
    id,
  );
  return findById(id, db);
}

export function remove(id, db = getDatabase()) {
  const assignmentCount = db
    .prepare("SELECT COUNT(*) as count FROM assignments WHERE bed_id = ?")
    .get(id);
  if (assignmentCount.count > 0) {
    throw new Error(
      `Cannot delete bed ${id}: historical assignments exist. Deactivate it instead.`,
    );
  }
  db.prepare("DELETE FROM beds WHERE id = ?").run(id);
}
