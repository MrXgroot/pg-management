// server/src/core/repos/paymentAllocationRepo.js
import { getDatabase } from "../../../db/connection.js";

function mapAllocation(row) {
  if (!row) return null;
  return {
    id: row.id,
    paymentId: row.payment_id,
    obligationId: row.obligation_id,
    amountPaise: row.amount_paise,
    createdAt: row.created_at,
  };
}

export function findByPaymentId(paymentId, db = getDatabase()) {
  const rows = db
    .prepare("SELECT * FROM payment_allocations WHERE payment_id = ?")
    .all(paymentId);
  return rows.map(mapAllocation);
}

export function findByObligationId(obligationId, db = getDatabase()) {
  const rows = db
    .prepare("SELECT * FROM payment_allocations WHERE obligation_id = ?")
    .all(obligationId);
  return rows.map(mapAllocation);
}

export function sumByPaymentId(paymentId, db = getDatabase()) {
  const row = db
    .prepare(
      "SELECT COALESCE(SUM(amount_paise), 0) AS total FROM payment_allocations WHERE payment_id = ?",
    )
    .get(paymentId);
  return row ? Number(row.total) : 0;
}

export function sumByObligationIds(obligationIds = [], db = getDatabase()) {
  if (obligationIds.length === 0) return 0;
  const placeholders = obligationIds.map(() => "?").join(",");
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(amount_paise), 0) AS total FROM payment_allocations WHERE obligation_id IN (${placeholders})`,
    )
    .get(...obligationIds);
  return row ? Number(row.total) : 0;
}

export function insertMany(allocations, db = getDatabase()) {
  const stmt = db.prepare(`
    INSERT INTO payment_allocations (id, payment_id, obligation_id, amount_paise)
    VALUES (?, ?, ?, ?)
  `);

  for (const alloc of allocations) {
    stmt.run(alloc.id, alloc.paymentId, alloc.obligationId, alloc.amountPaise);
  }
}
