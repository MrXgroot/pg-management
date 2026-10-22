import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createTestDb } from "../helpers/testDb.js";
import { settleDepositWorkflow } from "../../src/core/workflows/settleDepositWorkflow.js";
import * as depositDeductionRepo from "../../src/core/repos/depositDeductionRepo.js";

describe("settleDepositWorkflow", () => {
  let db;
  const propertyId = "prop-1";
  const tenantId = "tenant-1";
  const depositId = "dep-1";

  beforeEach(() => {
    db = createTestDb();
    db.prepare(
      `INSERT INTO properties (id, name, address) VALUES (?, ?, ?)`,
    ).run(propertyId, "Alpha PG", "Main St");
    db.prepare(
      `
      INSERT INTO tenants (id, property_id, name, phone, status, joining_date)
      VALUES (?, ?, 'Alice', '9876543210', 'CHECKED_OUT', '2026-01-01')
    `,
    ).run(tenantId, propertyId);
    db.prepare(
      `
      INSERT INTO deposits (id, tenant_id, amount_paise, received_on, status)
      VALUES (?, ?, 2000000, '2026-01-01', 'HELD')
    `,
    ).run(depositId, tenantId);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    db?.close();
  });

  it("records deductions, computes refund, and marks deposit SETTLED", () => {
    const result = settleDepositWorkflow(
      {
        depositId,
        deductions: [
          { amountPaise: 300000, reason: "Deep cleaning" },
          { amountPaise: 200000, reason: "Broken mirror" },
        ],
      },
      db,
    );

    expect(result.deposit.status).toBe("SETTLED");
    expect(result.settlement.deductionsTotalPaise).toBe(500000);
    expect(result.settlement.refundPaise).toBe(1500000);
    expect(result.settlement.remainingLiabilityPaise).toBe(0);

    const deductionRows = db
      .prepare(`SELECT * FROM deposit_deductions WHERE settlement_id = ?`)
      .all(result.settlement.id);
    expect(deductionRows).toHaveLength(2);
    expect(deductionRows.reduce((sum, row) => sum + row.amount_paise, 0)).toBe(result.settlement.deductionsTotalPaise);
    const persistedSettlement = db.prepare("SELECT * FROM deposit_settlements WHERE deposit_id = ?").get(depositId);
    expect(persistedSettlement).toMatchObject({
      deductions_total_paise: 500000,
      refund_paise: 1500000,
      remaining_liability_paise: 0,
    });
  });

  it("sets refund to 0 and computes remaining liability when deductions exceed deposit amount", () => {
    const result = settleDepositWorkflow(
      {
        depositId,
        deductions: [
          { amountPaise: 2500000, reason: "Extensive paint & repair damage" },
        ],
      },
      db,
    );

    expect(result.settlement.deductionsTotalPaise).toBe(2500000);
    expect(result.settlement.refundPaise).toBe(0);
    expect(result.settlement.remainingLiabilityPaise).toBe(500000);
  });

  it("throws DEPOSIT_ALREADY_SETTLED if invoked on a deposit that was already settled", () => {
    settleDepositWorkflow({ depositId, deductions: [] }, db);

    expect(() => {
      settleDepositWorkflow({ depositId, deductions: [] }, db);
    }).toThrow("DEPOSIT_ALREADY_SETTLED");
  });

  it("settles with no deductions and refunds the full deposit", () => {
    const result = settleDepositWorkflow({ depositId }, db);

    expect(result.settlement.deductionsTotalPaise).toBe(0);
    expect(result.settlement.refundPaise).toBe(2000000);
    expect(result.settlement.remainingLiabilityPaise).toBe(0);
    expect(db.prepare("SELECT COUNT(*) AS count FROM deposit_deductions").get().count).toBe(0);
    expect(db.prepare("SELECT status FROM deposits WHERE id = ?").get(depositId).status).toBe("SETTLED");
  });

  it("settles when deductions exactly equal the deposit amount", () => {
    const result = settleDepositWorkflow({
      depositId,
      deductions: [{ amountPaise: 2000000, reason: "Full deposit deduction" }],
    }, db);

    expect(result.settlement.deductionsTotalPaise).toBe(2000000);
    expect(result.settlement.refundPaise).toBe(0);
    expect(result.settlement.remainingLiabilityPaise).toBe(0);
  });

  it.each([
    ["zero", 0],
    ["negative", -1],
    ["fractional", 1.5],
  ])("rejects a %s deduction without settling the deposit", (_label, amountPaise) => {
    expect(() => settleDepositWorkflow({
      depositId,
      deductions: [{ amountPaise, reason: "Invalid amount" }],
    }, db)).toThrow(/positive integer amountPaise/);

    expect(db.prepare("SELECT status FROM deposits WHERE id = ?").get(depositId).status).toBe("HELD");
    expect(db.prepare("SELECT COUNT(*) AS count FROM deposit_settlements").get().count).toBe(0);
    expect(db.prepare("SELECT COUNT(*) AS count FROM deposit_deductions").get().count).toBe(0);
  });

  it("rolls back the settlement when writing deductions fails", () => {
    vi.spyOn(depositDeductionRepo, "insertMany").mockImplementationOnce(() => {
      throw new Error("SIMULATED_DEDUCTION_WRITE_FAILURE");
    });

    expect(() => settleDepositWorkflow({
      depositId,
      deductions: [{ amountPaise: 100000, reason: "Cleaning" }],
    }, db)).toThrow("SIMULATED_DEDUCTION_WRITE_FAILURE");

    expect(db.prepare("SELECT status FROM deposits WHERE id = ?").get(depositId).status).toBe("HELD");
    expect(db.prepare("SELECT COUNT(*) AS count FROM deposit_settlements").get().count).toBe(0);
    expect(db.prepare("SELECT COUNT(*) AS count FROM deposit_deductions").get().count).toBe(0);
  });
});
