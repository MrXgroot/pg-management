import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createTestDb } from "../helpers/testDb.js";
import { shiftBedWorkflow } from "../../src/core/workflows/shiftBedWorkflow.js";
import * as assignmentRepo from "../../src/core/repos/assignmentRepo.js";

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

  afterEach(() => {
    vi.restoreAllMocks();
    db?.close();
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

  it("rejects shifting to the same bed without changing assignment history", () => {
    expect(() => shiftBedWorkflow({
      tenantId,
      targetBedId: currentBedId,
      shiftDate: "2026-02-01",
    }, db)).toThrow("CANNOT_SHIFT_TO_SAME_BED");

    const assignments = db.prepare("SELECT * FROM assignments WHERE tenant_id = ?").all(tenantId);
    expect(assignments).toHaveLength(1);
    expect(assignments[0].end_date_exclusive).toBeNull();
  });

  it("rejects shifting a checked-out tenant", () => {
    db.prepare("UPDATE tenants SET status = 'CHECKED_OUT', checkout_date = '2026-01-15' WHERE id = ?").run(tenantId);

    expect(() => shiftBedWorkflow({
      tenantId,
      targetBedId,
      shiftDate: "2026-02-01",
    }, db)).toThrow("TENANT_NOT_ACTIVE");
  });

  it("characterizes a same-start-date shift as a zero-length historical interval", () => {
    const result = shiftBedWorkflow({
      tenantId,
      targetBedId,
      shiftDate: "2026-01-01",
    }, db);

    expect(result.closedAssignment.startDate).toBe("2026-01-01");
    expect(result.closedAssignment.endDateExclusive).toBe("2026-01-01");
    expect(result.newAssignment.startDate).toBe("2026-01-01");
    // Product meaning for a same-day transfer is unresolved; this records current behavior only.
  });

  it("rolls back closing the current assignment when inserting the new assignment fails", () => {
    vi.spyOn(assignmentRepo, "insert").mockImplementationOnce(() => {
      throw new Error("SIMULATED_ASSIGNMENT_WRITE_FAILURE");
    });

    expect(() => shiftBedWorkflow({
      tenantId,
      targetBedId,
      shiftDate: "2026-02-01",
    }, db)).toThrow("SIMULATED_ASSIGNMENT_WRITE_FAILURE");

    const assignments = db.prepare("SELECT * FROM assignments WHERE tenant_id = ? ORDER BY start_date").all(tenantId);
    expect(assignments).toHaveLength(1);
    expect(assignments[0].bed_id).toBe(currentBedId);
    expect(assignments[0].end_date_exclusive).toBeNull();
  });
});
