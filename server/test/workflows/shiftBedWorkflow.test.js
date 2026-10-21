import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "../helpers/testDb.js";
import { shiftBedWorkflow } from "../../src/core/workflows/shiftBedWorkflow.js";

describe("shiftBedWorkflow", () => {
  let db;
  const propertyId = "prop-1";
  const tenantId = "tenant-1";
  const currentBedId = "bed-1";
  const targetBedId = "bed-2";

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
    ).run(currentBedId);
    db.prepare(
      `INSERT INTO beds (id, room_id, bed_label, is_active) VALUES (?, 'r1', 'B', 1)`,
    ).run(targetBedId);

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
    ).run(tenantId, currentBedId);
  });

  it("closes current assignment and opens target bed assignment at shiftDate", () => {
    const result = shiftBedWorkflow(
      {
        tenantId,
        targetBedId,
        shiftDate: "2026-02-01",
      },
      db,
    );

    expect(result.closedAssignment.endDateExclusive).toBe("2026-02-01");
    expect(result.newAssignment.bedId).toBe(targetBedId);
    expect(result.newAssignment.startDate).toBe("2026-02-01");
    expect(result.newAssignment.endDateExclusive).toBeNull();

    const previous = db
      .prepare(`SELECT * FROM assignments WHERE id = 'assign-1'`)
      .get();
    expect(previous.end_date_exclusive).toBe("2026-02-01");

    const activeAssignments = db
      .prepare(
        `SELECT * FROM assignments WHERE tenant_id = ? AND end_date_exclusive IS NULL`,
      )
      .all(tenantId);
    expect(activeAssignments).toHaveLength(1);
    expect(activeAssignments[0].bed_id).toBe(targetBedId);
  });

  it("throws TARGET_BED_OCCUPIED if target bed has an active occupant", () => {
    db.prepare(
      `
      INSERT INTO tenants (id, property_id, name, phone, status, joining_date)
      VALUES ('tenant-2', ?, 'Bob', '9876543211', 'ACTIVE', '2026-01-01')
    `,
    ).run(propertyId);

    db.prepare(
      `
      INSERT INTO assignments (id, tenant_id, bed_id, start_date, end_date_exclusive)
      VALUES ('assign-2', 'tenant-2', ?, '2026-01-01', NULL)
    `,
    ).run(targetBedId);

    expect(() => {
      shiftBedWorkflow(
        {
          tenantId,
          targetBedId,
          shiftDate: "2026-02-01",
        },
        db,
      );
    }).toThrow("TARGET_BED_OCCUPIED");
  });
});
