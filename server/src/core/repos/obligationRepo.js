// server/src/core/repos/obligationRepo.js
import { getDatabase } from "../../../db/connection.js";

function mapObligation(row) {
  if (!row) return null;
  return {
    id: row.id,
    tenantId: row.tenant_id,
    periodStart: row.period_start,
    periodEndExclusive: row.period_end_exclusive,
    dueDate: row.due_date,
    amountPaise: row.amount_paise,
    rentalTermId: row.rental_term_id,
    createdAt: row.created_at,
    allocatedPaise:
      row.allocated_paise !== undefined
        ? Number(row.allocated_paise)
        : undefined,
  };
}

export function findById(id, db = getDatabase()) {
  const row = db.prepare("SELECT * FROM obligations WHERE id = ?").get(id);
  return mapObligation(row);
}

export function findByTenantId(tenantId, db = getDatabase()) {
  const rows = db
    .prepare(
      "SELECT * FROM obligations WHERE tenant_id = ? ORDER BY period_start ASC",
    )
    .all(tenantId);
  return rows.map(mapObligation);
}

/**
 * Loads obligations with their current sum of allocations in FIFO order.
 * Returns obligations where allocated_paise < amount_paise.
 */
export function findOutstandingByTenantId(tenantId, db = getDatabase()) {
  const query = `
    SELECT o.*, COALESCE(SUM(pa.amount_paise), 0) AS allocated_paise
    FROM obligations o
    LEFT JOIN payment_allocations pa ON pa.obligation_id = o.id
    WHERE o.tenant_id = ?
    GROUP BY o.id
    HAVING allocated_paise < o.amount_paise
    ORDER BY o.period_start ASC, o.due_date ASC, o.id ASC
  `;
  const rows = db.prepare(query).all(tenantId);
  return rows.map(mapObligation);
}

export function findLatestBoundaryByTenantId(tenantId, db = getDatabase()) {
  const row = db
    .prepare(
      `
    SELECT * FROM obligations
    WHERE tenant_id = ?
    ORDER BY period_end_exclusive DESC
    LIMIT 1
  `,
    )
    .get(tenantId);
  return mapObligation(row);
}

export function insert(obligation, db = getDatabase()) {
  db.prepare(
    `
    INSERT INTO obligations (id, tenant_id, period_start, period_end_exclusive, due_date, amount_paise, rental_term_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    obligation.id,
    obligation.tenantId,
    obligation.periodStart,
    obligation.periodEndExclusive,
    obligation.dueDate,
    obligation.amountPaise,
    obligation.rentalTermId || null,
  );
  return findById(obligation.id, db);
}

export function insertIfPeriodMissing(obligation, db = getDatabase()) {
  const existing = db
    .prepare(
      `
    SELECT * FROM obligations
    WHERE tenant_id = ? AND period_start = ? AND period_end_exclusive = ?
  `,
    )
    .get(
      obligation.tenantId,
      obligation.periodStart,
      obligation.periodEndExclusive,
    );

  if (existing) {
    return mapObligation(existing);
  }
  return insert(obligation, db);
}

export function updateDueDate(id, dueDate, db = getDatabase()) {
  db.prepare("UPDATE obligations SET due_date = ? WHERE id = ?").run(
    dueDate,
    id,
  );
  return findById(id, db);
}
