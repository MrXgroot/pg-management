// server/src/core/repos/rentalTermRepo.js
import { getDatabase } from "../../../db/connection.js";

function mapRentalTerm(row) {
  if (!row) return null;
  return {
    id: row.id,
    tenantId: row.tenant_id,
    rentPaise: row.rent_paise,
    effectiveFrom: row.effective_from,
    effectiveToExclusive: row.effective_to_exclusive,
  };
}

export function findById(id, db = getDatabase()) {
  const row = db.prepare("SELECT * FROM rental_terms WHERE id = ?").get(id);
  return mapRentalTerm(row);
}

export function findByTenantId(tenantId, db = getDatabase()) {
  const rows = db
    .prepare(
      "SELECT * FROM rental_terms WHERE tenant_id = ? ORDER BY effective_from ASC",
    )
    .all(tenantId);
  return rows.map(mapRentalTerm);
}

export function findActiveByTenantId(tenantId, date, db = getDatabase()) {
  const query = `
    SELECT * FROM rental_terms
    WHERE tenant_id = ?
      AND effective_from <= ?
      AND (effective_to_exclusive IS NULL OR ? < effective_to_exclusive)
    ORDER BY effective_from DESC
    LIMIT 1
  `;
  const row = db.prepare(query).get(tenantId, date, date);
  return mapRentalTerm(row);
}

export function insert(term, db = getDatabase()) {
  db.prepare(
    `
    INSERT INTO rental_terms (id, tenant_id, rent_paise, effective_from, effective_to_exclusive)
    VALUES (?, ?, ?, ?, ?)
  `,
  ).run(
    term.id,
    term.tenantId,
    term.rentPaise,
    term.effectiveFrom,
    term.effectiveToExclusive || null,
  );
  return findById(term.id, db);
}

export function closeAt(id, effectiveToExclusive, db = getDatabase()) {
  db.prepare(
    `
    UPDATE rental_terms
    SET effective_to_exclusive = ?
    WHERE id = ?
  `,
  ).run(effectiveToExclusive, id);
  return findById(id, db);
}
