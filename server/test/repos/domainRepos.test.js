// server/test/repos/domainRepos.test.js
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getDatabase, initSchema } from "../../db/connection.js";
import * as tenantRepo from "../../src/core/repos/tenantRepo.js";
import * as assignmentRepo from "../../src/core/repos/assignmentRepo.js";
import * as rentalTermRepo from "../../src/core/repos/rentalTermRepo.js";
import * as obligationRepo from "../../src/core/repos/obligationRepo.js";
import * as paymentRepo from "../../src/core/repos/paymentRepo.js";
import * as paymentAllocationRepo from "../../src/core/repos/paymentAllocationRepo.js";
import * as depositRepo from "../../src/core/repos/depositRepo.js";
import * as depositSettlementRepo from "../../src/core/repos/depositSettlementRepo.js";
import * as depositDeductionRepo from "../../src/core/repos/depositDeductionRepo.js";

describe("Tenant & Financial Repositories Contract Verification", () => {
  let db;

  beforeEach(() => {
    db = getDatabase(":memory:");
    initSchema(db);

    // Baseline property, floor, room, bed setup
    db.prepare(
      "INSERT INTO properties (id, name, address) VALUES ('p1', 'Test PG', 'Test Addr')",
    ).run();
    db.prepare(
      "INSERT INTO floors (id, property_id, display_order, name) VALUES ('f1', 'p1', 1, 'F1')",
    ).run();
    db.prepare(
      "INSERT INTO rooms (id, floor_id, room_number) VALUES ('r1', 'f1', '101')",
    ).run();
    db.prepare(
      "INSERT INTO beds (id, room_id, bed_label, is_active) VALUES ('b1', 'r1', 'Bed 1', 1)",
    ).run();
  });

  afterEach(() => {
    if (db) db.close();
  });

  it("handles tenant lifecycle and assignment overlap checks", () => {
    const tenant = tenantRepo.insert(
      {
        id: "t1",
        propertyId: "p1",
        name: "Rohan Verma",
        phone: "9888877777",
        status: "ACTIVE",
        joiningDate: "2026-09-01",
      },
      db,
    );
    expect(tenant.name).toBe("Rohan Verma");

    // Create active assignment
    assignmentRepo.insert(
      {
        id: "a1",
        tenantId: "t1",
        bedId: "b1",
        startDate: "2026-09-01",
      },
      db,
    );

    const active = assignmentRepo.findActiveByBedId("b1", db);
    expect(active.id).toBe("a1");

    // Overlap check: new request for same bed during active window
    const overlaps = assignmentRepo.findOverlapsForBed(
      {
        bedId: "b1",
        startDate: "2026-09-15",
        endDateExclusive: "2026-10-15",
      },
      db,
    );
    expect(overlaps).toHaveLength(1);

    // Close assignment on 2026-10-01
    const closed = assignmentRepo.close("a1", "2026-10-01", db);
    expect(closed.endDateExclusive).toBe("2026-10-01");

    // Query for period starting 2026-10-01 should now have 0 overlaps (half-open semantics)
    const postOverlaps = assignmentRepo.findOverlapsForBed(
      {
        bedId: "b1",
        startDate: "2026-10-01",
        endDateExclusive: "2026-11-01",
      },
      db,
    );
    expect(postOverlaps).toHaveLength(0);
  });

  it("manages obligations, payments, and allocations accurately", () => {
    tenantRepo.insert(
      {
        id: "t1",
        propertyId: "p1",
        name: "Rohan",
        phone: "9888877777",
        status: "ACTIVE",
        joiningDate: "2026-09-01",
      },
      db,
    );

    // Insert 2 sequential obligations
    obligationRepo.insert(
      {
        id: "ob1",
        tenantId: "t1",
        periodStart: "2026-09-01",
        periodEndExclusive: "2026-10-01",
        dueDate: "2026-09-05",
        amountPaise: 500000,
      },
      db,
    );

    obligationRepo.insert(
      {
        id: "ob2",
        tenantId: "t1",
        periodStart: "2026-10-01",
        periodEndExclusive: "2026-11-01",
        dueDate: "2026-10-05",
        amountPaise: 500000,
      },
      db,
    );

    // Initial outstanding obligations
    let outstanding = obligationRepo.findOutstandingByTenantId("t1", db);
    expect(outstanding).toHaveLength(2);

    // Insert payment for 600,000 paise (settles ob1 completely, 100,000 to ob2)
    paymentRepo.insert(
      {
        id: "pay1",
        tenantId: "t1",
        amountPaise: 600000,
        paidOn: "2026-09-03",
        paymentMethod: "UPI",
        idempotencyKey: "idem_test_1",
      },
      db,
    );

    paymentAllocationRepo.insertMany(
      [
        {
          id: "al1",
          paymentId: "pay1",
          obligationId: "ob1",
          amountPaise: 500000,
        },
        {
          id: "al2",
          paymentId: "pay1",
          obligationId: "ob2",
          amountPaise: 100000,
        },
      ],
      db,
    );

    // Now ob1 is settled; only ob2 should be in outstanding list
    outstanding = obligationRepo.findOutstandingByTenantId("t1", db);
    expect(outstanding).toHaveLength(1);
    expect(outstanding[0].id).toBe("ob2");
    expect(outstanding[0].allocatedPaise).toBe(100000);

    // Check sum of allocations for payment
    const totalAllocated = paymentAllocationRepo.sumByPaymentId("pay1", db);
    expect(totalAllocated).toBe(600000);
  });

  it("records security deposits, settlements, and deductions atomically", () => {
    tenantRepo.insert(
      {
        id: "t1",
        propertyId: "p1",
        name: "Rohan",
        phone: "9888877777",
        status: "ACTIVE",
        joiningDate: "2026-09-01",
      },
      db,
    );

    const deposit = depositRepo.insert(
      {
        id: "dep1",
        tenantId: "t1",
        amountPaise: 1000000,
        receivedOn: "2026-09-01",
      },
      db,
    );
    expect(deposit.status).toBe("HELD");

    // Settle deposit
    depositSettlementRepo.insert(
      {
        id: "set1",
        depositId: "dep1",
        tenantId: "t1",
        deductionsTotalPaise: 200000,
        refundPaise: 800000,
        remainingLiabilityPaise: 0,
      },
      db,
    );

    depositDeductionRepo.insertMany(
      [
        {
          id: "ded1",
          settlementId: "set1",
          amountPaise: 200000,
          reason: "Deep cleaning",
        },
      ],
      db,
    );

    const settledDeposit = depositRepo.markSettled("dep1", db);
    expect(settledDeposit.status).toBe("SETTLED");

    const deductions = depositDeductionRepo.findBySettlementId("set1", db);
    expect(deductions).toHaveLength(1);
    expect(deductions[0].reason).toBe("Deep cleaning");
  });
});
