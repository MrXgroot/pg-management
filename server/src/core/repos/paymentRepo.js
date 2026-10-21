// server/src/core/repos/paymentRepo.js
import { getDatabase } from "../../../db/connection.js";

function mapPayment(row) {
  if (!row) return null;
  return {
    id: row.id,
    tenantId: row.tenant_id,
    amountPaise: row.amount_paise,
    paidOn: row.paid_on,
    paymentMethod: row.payment_method,
    referenceNote: row.reference_note,
    idempotencyKey: row.idempotency_key,
    createdAt: row.created_at,
  };
}

export function findById(id, db = getDatabase()) {
  const row = db.prepare("SELECT * FROM payments WHERE id = ?").get(id);
  return mapPayment(row);
}

export function findByTenantId(tenantId, db = getDatabase()) {
  const rows = db
    .prepare("SELECT * FROM payments WHERE tenant_id = ? ORDER BY paid_on ASC")
    .all(tenantId);
  return rows.map(mapPayment);
}

export function findByIdempotencyKey(key, db = getDatabase()) {
  if (!key) return null;
  const row = db
    .prepare("SELECT * FROM payments WHERE idempotency_key = ?")
    .get(key);
  return mapPayment(row);
}

export function insert(payment, db = getDatabase()) {
  db.prepare(
    `
    INSERT INTO payments (id, tenant_id, amount_paise, paid_on, payment_method, reference_note, idempotency_key)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    payment.id,
    payment.tenantId,
    payment.amountPaise,
    payment.paidOn,
    payment.paymentMethod,
    payment.referenceNote || null,
    payment.idempotencyKey || null,
  );
  return findById(payment.id, db);
}
