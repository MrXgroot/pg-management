// server/src/core/repos/depositDeductionRepo.js
import { getDatabase } from "../../../db/connection.js";

function mapDeduction(row) {
  if (!row) return null;
  return {
    id: row.id,
    settlementId: row.settlement_id,
    amountPaise: row.amount_paise,
    reason: row.reason,
  };
}

export function findBySettlementId(settlementId, db = getDatabase()) {
  const rows = db
    .prepare("SELECT * FROM deposit_deductions WHERE settlement_id = ?")
    .all(settlementId);
  return rows.map(mapDeduction);
}

export function insertMany(deductions, db = getDatabase()) {
  const stmt = db.prepare(`
    INSERT INTO deposit_deductions (id, settlement_id, amount_paise, reason)
    VALUES (?, ?, ?, ?)
  `);

  for (const item of deductions) {
    stmt.run(item.id, item.settlementId, item.amountPaise, item.reason);
  }
}
