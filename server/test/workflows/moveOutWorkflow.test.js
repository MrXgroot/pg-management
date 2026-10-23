import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createTestDb } from "../helpers/testDb.js";
import { moveOutWorkflow } from "../../src/core/workflows/moveOutWorkflow.js";
import * as tenantRepo from "../../src/core/repos/tenantRepo.js";

describe("moveOutWorkflow", () => {
  let db;
  const propertyId = "prop-1";
  const tenantId = "tenant-1";
  const bedId = "bed-1";

  beforeEach(() => {
    db = createTestDb();
    db.prepare(
      `INSERT INTO properties (id, name, address) VALUES (?, ?, ?)`,
    ).run(propertyId, "Alpha PG", "Main St");
    db.prepare(
      `INSERT INTO floors (id, property_id, display_order, name) VALUES ('f1', ?, 1, '1F')`,
    ).run(propertyId);
    db.prepare(
      `INSERT INTO rooms (id, floor_id, room_number) VALUES ('r1', 'f1', '101')`,
    ).run();
    db.prepare(
      `INSERT INTO beds (id, room_id, bed_label, is_active) VALUES (?, 'r1', 'A', 1)`,
    ).run(bedId);

    db.prepare(
      `
      INSERT INTO tenants (id, property_id, name, phone, status, joining_date)
      VALUES (?, ?, 'Alice', '9876543210', 'ACTIVE', '2026-01-01')
    `,
    ).run(tenantId, propertyId);

    db.prepare(
      `
      INSERT INTO assignments (id, tenant_id, bed_id, start_date, end_date_exclusive)
      VALUES ('assign-1', ?, ?, '2026-01-01', NULL)
    `,
    ).run(tenantId, bedId);

    db.prepare(
      `
      INSERT INTO rental_terms (id, tenant_id, rent_paise, effective_from, effective_to_exclusive)
      VALUES ('term-1', ?, 1000000, '2026-01-01', NULL)
    `,
    ).run(tenantId);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    db?.close();
  });

  it("closes assignment at checkoutDate, marks tenant CHECKED_OUT, and frees the bed", () => {
    const result = moveOutWorkflow(
      {
        tenantId,
        checkoutDate: "2026-03-31",
      },
      db,
    );

    expect(result.tenant.status).toBe("CHECKED_OUT");
    expect(result.tenant.checkoutDate).toBe("2026-03-31");
    expect(result.closedAssignment.endDateExclusive).toBe("2026-03-31");

    const activeAssignments = db
      .prepare(
        `SELECT * FROM assignments WHERE bed_id = ? AND end_date_exclusive IS NULL`,
      )
      .all(bedId);
    expect(activeAssignments).toHaveLength(0);

    const term = db
      .prepare(`SELECT * FROM rental_terms WHERE id = 'term-1'`)
      .get();
    expect(term.effective_to_exclusive).toBe("2026-03-31");
  });

  it("throws TENANT_ALREADY_CHECKED_OUT if tenant is already checked out", () => {
    db.prepare(
      `UPDATE tenants SET status = 'CHECKED_OUT', checkout_date = '2026-03-31' WHERE id = ?`,
    ).run(tenantId);

    expect(() => {
      moveOutWorkflow(
        {
          tenantId,
          checkoutDate: "2026-04-01",
        },
        db,
      );
    }).toThrow("TENANT_ALREADY_CHECKED_OUT");
  });

  it("rejects same-day checkout without changing tenant, assignment, or rental term", () => {
    const assignmentBefore = db
      .prepare("SELECT * FROM assignments WHERE id = 'assign-1'")
      .get();
    const tenantBefore = db
      .prepare("SELECT * FROM tenants WHERE id = ?")
      .get(tenantId);
    const termBefore = db
      .prepare("SELECT * FROM rental_terms WHERE id = 'term-1'")
      .get();

    expect(() =>
      moveOutWorkflow({ tenantId, checkoutDate: "2026-01-01" }, db),
    ).toThrow("CHECKOUT_DATE_MUST_BE_AFTER_START_DATE");

    expect(db.prepare("SELECT * FROM assignments WHERE id = 'assign-1'").get())
      .toEqual(assignmentBefore);
    expect(db.prepare("SELECT * FROM tenants WHERE id = ?").get(tenantId))
      .toEqual(tenantBefore);
    expect(db.prepare("SELECT * FROM rental_terms WHERE id = 'term-1'").get())
      .toEqual(termBefore);
  });

  it("rolls back assignment and term closure when tenant status persistence fails", () => {
    vi.spyOn(tenantRepo, "updateStatus").mockImplementationOnce(() => {
      throw new Error("SIMULATED_TENANT_WRITE_FAILURE");
    });

    expect(() => moveOutWorkflow({ tenantId, checkoutDate: "2026-03-31" }, db)).toThrow("SIMULATED_TENANT_WRITE_FAILURE");

    const assignment = db.prepare("SELECT * FROM assignments WHERE id = 'assign-1'").get();
    const term = db.prepare("SELECT * FROM rental_terms WHERE id = 'term-1'").get();
    const tenant = db.prepare("SELECT * FROM tenants WHERE id = ?").get(tenantId);
    expect(assignment.end_date_exclusive).toBeNull();
    expect(term.effective_to_exclusive).toBeNull();
    expect(tenant.status).toBe("ACTIVE");
    expect(tenant.checkout_date).toBeNull();
  });
});
