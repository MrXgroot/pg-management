import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "../helpers/testDb.js";
import { moveOutWorkflow } from "../../src/core/workflows/moveOutWorkflow.js";

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
});
