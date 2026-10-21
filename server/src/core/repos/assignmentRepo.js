// server/src/core/repos/assignmentRepo.js
import { getDatabase } from "../../../db/connection.js";

function mapAssignment(row) {
  if (!row) return null;
  return {
    id: row.id,
    tenantId: row.tenant_id,
    bedId: row.bed_id,
    startDate: row.start_date,
    endDateExclusive: row.end_date_exclusive,
  };
}

export function findById(id, db = getDatabase()) {
  const row = db.prepare("SELECT * FROM assignments WHERE id = ?").get(id);
  return mapAssignment(row);
}

export function findActiveByBedId(bedId, db = getDatabase()) {
  const row = db
    .prepare(
      "SELECT * FROM assignments WHERE bed_id = ? AND end_date_exclusive IS NULL",
    )
    .get(bedId);
  return mapAssignment(row);
}

export function findActiveByTenantId(tenantId, db = getDatabase()) {
  const row = db
    .prepare(
      "SELECT * FROM assignments WHERE tenant_id = ? AND end_date_exclusive IS NULL",
    )
    .get(tenantId);
  return mapAssignment(row);
}

/**
 * Checks overlap for a bed using half-open interval semantics: [start_date, end_date_exclusive)
 * Overlap condition: (startDate < existing.end OR existing.end IS NULL) AND (existing.start < endDateExclusive OR endDateExclusive IS NULL)
 */
export function findOverlapsForBed(
  { bedId, startDate, endDateExclusive },
  db = getDatabase(),
) {
  const query = `
    SELECT * FROM assignments
    WHERE bed_id = ?
      AND (end_date_exclusive IS NULL OR ? < end_date_exclusive)
      AND (? IS NULL OR start_date < ?)
  `;
  const rows = db
    .prepare(query)
    .all(bedId, startDate, endDateExclusive, endDateExclusive);
  return rows.map(mapAssignment);
}

export function findOverlapsForTenant(
  { tenantId, startDate, endDateExclusive },
  db = getDatabase(),
) {
  const query = `
    SELECT * FROM assignments
    WHERE tenant_id = ?
      AND (end_date_exclusive IS NULL OR ? < end_date_exclusive)
      AND (? IS NULL OR start_date < ?)
  `;
  const rows = db
    .prepare(query)
    .all(tenantId, startDate, endDateExclusive, endDateExclusive);
  return rows.map(mapAssignment);
}

export function insert(assignment, db = getDatabase()) {
  db.prepare(
    `
    INSERT INTO assignments (id, tenant_id, bed_id, start_date, end_date_exclusive)
    VALUES (?, ?, ?, ?, ?)
  `,
  ).run(
    assignment.id,
    assignment.tenantId,
    assignment.bedId,
    assignment.startDate,
    assignment.endDateExclusive || null,
  );
  return findById(assignment.id, db);
}

export function close(id, endDateExclusive, db = getDatabase()) {
  db.prepare(
    `
    UPDATE assignments
    SET end_date_exclusive = ?
    WHERE id = ?
  `,
  ).run(endDateExclusive, id);
  return findById(id, db);
}
