import crypto from "node:crypto";
import { getDatabase } from "../../../../server/db/connection.js";
import * as depositRepo from "../repos/depositRepo.js";
import * as depositSettlementRepo from "../repos/depositSettlementRepo.js";
import * as depositDeductionRepo from "../repos/depositDeductionRepo.js";
import { calculateDepositSettlement } from "../policies/depositPolicy.js";

export function settleDepositWorkflow(
  { depositId, deductions = [] },
  db = getDatabase(),
) {
  const run = db.transaction(() => {
    const deposit = depositRepo.findById(depositId, db);
    if (!deposit) {
      throw new Error("DEPOSIT_NOT_FOUND");
    }
    if (deposit.status === "SETTLED") {
      throw new Error("DEPOSIT_ALREADY_SETTLED");
    }

    const { deductionsTotalPaise, refundPaise, remainingLiabilityPaise } =
      calculateDepositSettlement(deposit.amountPaise, deductions);

    const settlementId = crypto.randomUUID();
    const settlement = depositSettlementRepo.insert(
      {
        id: settlementId,
        depositId: deposit.id,
        tenantId: deposit.tenantId,
        deductionsTotalPaise,
        refundPaise,
        remainingLiabilityPaise,
      },
      db,
    );

    if (deductions.length > 0) {
      const deductionRows = deductions.map((d) => ({
        id: crypto.randomUUID(),
        settlementId: settlement.id,
        amountPaise: d.amountPaise,
        reason: d.reason.trim(),
      }));
      depositDeductionRepo.insertMany(deductionRows, db);
    }

    const updatedDeposit = depositRepo.markSettled(deposit.id, db);

    return {
      deposit: updatedDeposit,
      settlement,
      deductions,
    };
  });

  return run();
}
