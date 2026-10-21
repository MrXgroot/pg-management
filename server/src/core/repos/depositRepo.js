// server/src/core/repos/depositRepo.js
import { getDatabase } from "../../../db/connection.js";

function mapDeposit(row) {
  if (!row) return null;
  return {
    id: row.id,
    tenantId: row.tenant_id,
    amountPaise: row.amount_paise,
    receivedOn: row.received_on,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function findById(id, db = getDatabase()) {
  const row = db.prepare("SELECT * FROM deposits WHERE id = ?").get(id);
  return mapDeposit(row);
}

export function findByTenantId(tenantId, db = getDatabase()) {
  const rows = db
    .prepare(
      "SELECT * FROM deposits WHERE tenant_id = ? ORDER BY received_on ASC",
    )
    .all(tenantId);
  return rows.map(mapDeposit);
}

export function insert(deposit, db = getDatabase()) {
  db.prepare(
    `
    INSERT INTO deposits (id, tenant_id, amount_paise, received_on, status)
    VALUES (?, ?, ?, ?, ?)
  `,
  ).run(
    deposit.id,
    deposit.tenantId,
    deposit.amountPaise,
    deposit.receivedOn,
    deposit.status || "HELD",
  );
  return findById(deposit.id, db);
}

export function markSettled(id, db = getDatabase()) {
  db.prepare("UPDATE deposits SET status = 'SETTLED' WHERE id = ?").run(id);
  return findById(id, db);
}
