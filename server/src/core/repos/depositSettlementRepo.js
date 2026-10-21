// server/src/core/repos/depositSettlementRepo.js
import { getDatabase } from "../../../db/connection.js";

function mapSettlement(row) {
  if (!row) return null;
  return {
    id: row.id,
    depositId: row.deposit_id,
    tenantId: row.tenant_id,
    deductionsTotalPaise: row.deductions_total_paise,
    refundPaise: row.refund_paise,
    remainingLiabilityPaise: row.remaining_liability_paise,
    settledAt: row.settled_at,
  };
}

export function findByDepositId(depositId, db = getDatabase()) {
  const row = db
    .prepare("SELECT * FROM deposit_settlements WHERE deposit_id = ?")
    .get(depositId);
  return mapSettlement(row);
}

export function insert(settlement, db = getDatabase()) {
  db.prepare(
    `
    INSERT INTO deposit_settlements (id, deposit_id, tenant_id, deductions_total_paise, refund_paise, remaining_liability_paise)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
  ).run(
    settlement.id,
    settlement.depositId,
    settlement.tenantId,
    settlement.deductionsTotalPaise,
    settlement.refundPaise,
    settlement.remainingLiabilityPaise,
  );
  return findByDepositId(settlement.depositId, db);
}
