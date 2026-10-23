import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createTestDb } from "../helpers/testDb.js";
import { collectPaymentWorkflow } from "../../src/core/workflows/collectPaymentWorkflow.js";
import * as paymentAllocationRepo from "../../src/core/repos/paymentAllocationRepo.js";

describe("collectPaymentWorkflow", () => {
  let db;
  const propertyId = "prop-1";
  const tenantId = "tenant-1";
  const termId = "term-1";

  beforeEach(() => {
    db = createTestDb();

    db.prepare(
      `INSERT INTO properties (id, name, address) VALUES (?, ?, ?)`,
    ).run(propertyId, "Alpha PG", "Main St");

    db.prepare(
      `
      INSERT INTO tenants (id, property_id, name, phone, status, joining_date)
      VALUES (?, ?, 'Alice', '9876543210', 'ACTIVE', '2026-01-01')
    `,
    ).run(tenantId, propertyId);

    db.prepare(
      `
      INSERT INTO rental_terms (id, tenant_id, rent_paise, effective_from, effective_to_exclusive)
      VALUES (?, ?, 1000000, '2026-01-01', NULL)
    `,
    ).run(termId, tenantId);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    db?.close();
  });

  it("settles a single obligation completely when exact payment is received", () => {
    db.prepare(
      `
      INSERT INTO obligations (
        id, tenant_id, period_start, period_end_exclusive,
        due_date, amount_paise, rental_term_id
      )
      VALUES ('ob-1', ?, '2026-01-01', '2026-02-01', '2026-01-05', 1000000, ?)
    `,
    ).run(tenantId, termId);

    const result = collectPaymentWorkflow(
      {
        tenantId,
        amountPaise: 1000000,
        paidOn: "2026-01-05",
        paymentMethod: "UPI",
      },
      db,
    );

    expect(result.payment.amountPaise).toBe(1000000);
    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].obligationId).toBe("ob-1");
    expect(result.allocations[0].amountPaise).toBe(1000000);
    expect(result.unallocatedPaise).toBe(0);
    expect(result.isDuplicate).toBe(false);

    const persistedPayment = db
      .prepare("SELECT * FROM payments WHERE id = ?")
      .get(result.payment.id);

    const persistedAllocation = db
      .prepare("SELECT * FROM payment_allocations WHERE payment_id = ?")
      .get(result.payment.id);

    const obligationBalance = db
      .prepare(
        `
      SELECT o.amount_paise - COALESCE(SUM(pa.amount_paise), 0) AS remaining_paise
      FROM obligations o
      LEFT JOIN payment_allocations pa ON pa.obligation_id = o.id
      WHERE o.id = 'ob-1'
      GROUP BY o.id
    `,
      )
      .get();

    expect(persistedPayment.amount_paise).toBe(1000000);
    expect(persistedAllocation.obligation_id).toBe("ob-1");
    expect(persistedAllocation.amount_paise).toBe(
      persistedPayment.amount_paise,
    );
    expect(obligationBalance.remaining_paise).toBe(0);
  });

  it("leaves obligation partially paid when a partial payment is collected", () => {
    db.prepare(
      `
      INSERT INTO obligations (
        id, tenant_id, period_start, period_end_exclusive,
        due_date, amount_paise, rental_term_id
      )
      VALUES ('ob-1', ?, '2026-01-01', '2026-02-01', '2026-01-05', 1000000, ?)
    `,
    ).run(tenantId, termId);

    const result = collectPaymentWorkflow(
      {
        tenantId,
        amountPaise: 400000,
        paidOn: "2026-01-05",
        paymentMethod: "CASH",
      },
      db,
    );

    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].amountPaise).toBe(400000);
    expect(result.unallocatedPaise).toBe(0);

    const allocatedSum = db
      .prepare(
        `SELECT SUM(amount_paise) AS sum
         FROM payment_allocations
         WHERE obligation_id = 'ob-1'`,
      )
      .get().sum;

    expect(allocatedSum).toBe(400000);
  });

  it("completely settles obligation and leaves excess payment as unallocated advance credit", () => {
    db.prepare(
      `
      INSERT INTO obligations (
        id, tenant_id, period_start, period_end_exclusive,
        due_date, amount_paise, rental_term_id
      )
      VALUES ('ob-1', ?, '2026-01-01', '2026-02-01', '2026-01-05', 1000000, ?)
    `,
    ).run(tenantId, termId);

    const result = collectPaymentWorkflow(
      {
        tenantId,
        amountPaise: 1500000,
        paidOn: "2026-01-05",
        paymentMethod: "UPI",
      },
      db,
    );

    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].amountPaise).toBe(1000000);
    expect(result.unallocatedPaise).toBe(500000);
  });

  it("allocates payment across multiple obligations in strict FIFO order (periodStart ASC)", () => {
    db.prepare(
      `
      INSERT INTO obligations (
        id, tenant_id, period_start, period_end_exclusive,
        due_date, amount_paise, rental_term_id
      )
      VALUES
        ('ob-1', ?, '2026-01-01', '2026-02-01', '2026-01-05', 1000000, ?),
        ('ob-2', ?, '2026-02-01', '2026-03-01', '2026-02-05', 1000000, ?)
    `,
    ).run(tenantId, termId, tenantId, termId);

    const result = collectPaymentWorkflow(
      {
        tenantId,
        amountPaise: 1600000,
        paidOn: "2026-02-10",
        paymentMethod: "BANK_TRANSFER",
      },
      db,
    );

    expect(result.allocations).toHaveLength(2);
    expect(result.allocations[0].obligationId).toBe("ob-1");
    expect(result.allocations[0].amountPaise).toBe(1000000);
    expect(result.allocations[1].obligationId).toBe("ob-2");
    expect(result.allocations[1].amountPaise).toBe(600000);
    expect(result.unallocatedPaise).toBe(0);

    const obligationAllocationTotals = db
      .prepare(
        `
      SELECT o.id, o.amount_paise, COALESCE(SUM(pa.amount_paise), 0) AS allocated_paise
      FROM obligations o
      LEFT JOIN payment_allocations pa ON pa.obligation_id = o.id
      WHERE o.tenant_id = ?
      GROUP BY o.id
    `,
      )
      .all(tenantId);

    expect(
      obligationAllocationTotals.every(
        (row) => row.allocated_paise <= row.amount_paise,
      ),
    ).toBe(true);
  });

  it("returns the existing payment with isDuplicate: true without duplicate writes when idempotencyKey is repeated", () => {
    db.prepare(
      `
      INSERT INTO obligations (
        id, tenant_id, period_start, period_end_exclusive,
        due_date, amount_paise, rental_term_id
      )
      VALUES ('ob-1', ?, '2026-01-01', '2026-02-01', '2026-01-05', 1000000, ?)
    `,
    ).run(tenantId, termId);

    const firstRun = collectPaymentWorkflow(
      {
        tenantId,
        amountPaise: 1000000,
        paidOn: "2026-01-05",
        paymentMethod: "UPI",
        idempotencyKey: "tx-unique-123",
      },
      db,
    );

    expect(firstRun.isDuplicate).toBe(false);

    const secondRun = collectPaymentWorkflow(
      {
        tenantId,
        amountPaise: 1000000,
        paidOn: "2026-01-05",
        paymentMethod: "UPI",
        idempotencyKey: "tx-unique-123",
      },
      db,
    );

    expect(secondRun.isDuplicate).toBe(true);
    expect(secondRun.payment.id).toBe(firstRun.payment.id);

    const paymentRows = db
      .prepare(
        "SELECT COUNT(*) AS count FROM payments WHERE idempotency_key = 'tx-unique-123'",
      )
      .get().count;

    expect(paymentRows).toBe(1);
  });

  it("updates dueDate on the next upcoming obligation only when nextDueDateOverride is provided", () => {
    db.prepare(
      `
      INSERT INTO obligations (
        id, tenant_id, period_start, period_end_exclusive,
        due_date, amount_paise, rental_term_id
      )
      VALUES ('ob-1', ?, '2026-01-01', '2026-02-01', '2026-01-05', 1000000, ?)
    `,
    ).run(tenantId, termId);

    collectPaymentWorkflow(
      {
        tenantId,
        amountPaise: 500000,
        paidOn: "2026-01-05",
        paymentMethod: "UPI",
        nextDueDateOverride: "2026-01-15",
      },
      db,
    );

    const updatedObligation = db
      .prepare("SELECT * FROM obligations WHERE id = 'ob-1'")
      .get();

    expect(updatedObligation.due_date).toBe("2026-01-15");
    expect(updatedObligation.period_start).toBe("2026-01-01");
    expect(updatedObligation.period_end_exclusive).toBe("2026-02-01");
  });

  it.each([
    ["zero amount", 0, "2026-01-05", "INVALID_PAYMENT_AMOUNT"],
    ["negative amount", -1, "2026-01-05", "INVALID_PAYMENT_AMOUNT"],
    ["fractional paise", 1.5, "2026-01-05", "INVALID_PAYMENT_AMOUNT"],
    ["invalid calendar date", 100, "2026-02-30", /Invalid calendar date/],
  ])(
    "rejects %s without persisting a payment",
    (_label, amountPaise, paidOn, error) => {
      expect(() =>
        collectPaymentWorkflow(
          {
            tenantId,
            amountPaise,
            paidOn,
            paymentMethod: "UPI",
          },
          db,
        ),
      ).toThrow(error);

      expect(
        db.prepare("SELECT COUNT(*) AS count FROM payments").get().count,
      ).toBe(0);
      expect(
        db.prepare("SELECT COUNT(*) AS count FROM payment_allocations").get()
          .count,
      ).toBe(0);
    },
  );

  it.each([
    ["different tenant", { tenantId: "different-tenant" }],
    ["different amount", { amountPaise: 900000 }],
    ["different date", { paidOn: "2026-01-06" }],
    ["different method", { paymentMethod: "CASH" }],
  ])("rejects idempotency key reuse with a %s", (_label, changes) => {
    db.prepare(
      `
      INSERT INTO obligations (
        id, tenant_id, period_start, period_end_exclusive,
        due_date, amount_paise, rental_term_id
      )
      VALUES ('ob-idem', ?, '2026-01-01', '2026-02-01', '2026-01-05', 1000000, ?)
    `,
    ).run(tenantId, termId);

    const initial = {
      tenantId,
      amountPaise: 1000000,
      paidOn: "2026-01-05",
      paymentMethod: "UPI",
      idempotencyKey: "same-key",
    };

    const first = collectPaymentWorkflow(initial, db);

    expect(() =>
      collectPaymentWorkflow({ ...initial, ...changes }, db),
    ).toThrow("IDEMPOTENCY_KEY_CONFLICT");

    expect(first.isDuplicate).toBe(false);

    expect(
      db
        .prepare(
          "SELECT COUNT(*) AS count FROM payments WHERE idempotency_key = 'same-key'",
        )
        .get().count,
    ).toBe(1);

    expect(
      db.prepare("SELECT COUNT(*) AS count FROM payment_allocations").get()
        .count,
    ).toBe(1);
  });

  it("rolls back the inserted payment when allocation persistence fails", () => {
    db.prepare(
      `
      INSERT INTO obligations (
        id, tenant_id, period_start, period_end_exclusive,
        due_date, amount_paise, rental_term_id
      )
      VALUES ('ob-fail', ?, '2026-01-01', '2026-02-01', '2026-01-05', 1000000, ?)
    `,
    ).run(tenantId, termId);

    vi.spyOn(paymentAllocationRepo, "insertMany").mockImplementationOnce(() => {
      throw new Error("SIMULATED_ALLOCATION_WRITE_FAILURE");
    });

    expect(() =>
      collectPaymentWorkflow(
        {
          tenantId,
          amountPaise: 700000,
          paidOn: "2026-01-05",
          paymentMethod: "UPI",
        },
        db,
      ),
    ).toThrow("SIMULATED_ALLOCATION_WRITE_FAILURE");

    expect(
      db.prepare("SELECT COUNT(*) AS count FROM payments").get().count,
    ).toBe(0);
    expect(
      db.prepare("SELECT COUNT(*) AS count FROM payment_allocations").get()
        .count,
    ).toBe(0);
    expect(
      db
        .prepare(
          "SELECT COALESCE(SUM(amount_paise), 0) AS allocated FROM payment_allocations WHERE obligation_id = 'ob-fail'",
        )
        .get().allocated,
    ).toBe(0);
  });
});
