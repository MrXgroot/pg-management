import { describe, it, expect, beforeEach, vi } from "vitest";
import { createTestDb } from "../helpers/testDb.js";
import { moveInWorkflow } from "../../src/core/workflows/moveInWorkflow.js";
import * as obligationRepo from "../../src/core/repos/obligationRepo.js";

describe("moveInWorkflow", () => {
  let db;
  const propertyId = "prop-1";
  const floorId = "floor-1";
  const roomId = "room-1";
  const bedId = "bed-1";

  beforeEach(() => {
    db = createTestDb();
    db.prepare(
      `INSERT INTO properties (id, name, address) VALUES (?, ?, ?)`,
    ).run(propertyId, "Alpha PG", "Main St");
    db.prepare(
      `INSERT INTO floors (id, property_id, display_order, name) VALUES (?, ?, ?, ?)`,
    ).run(floorId, propertyId, 1, "1st Floor");
    db.prepare(
      `INSERT INTO rooms (id, floor_id, room_number) VALUES (?, ?, ?)`,
    ).run(roomId, floorId, "101");
    db.prepare(
      `INSERT INTO beds (id, room_id, bed_label, is_active) VALUES (?, ?, ?, 1)`,
    ).run(bedId, roomId, "A");
  });

  it("successfully moves in a tenant atomically with all core records", () => {
    const result = moveInWorkflow(
      {
        propertyId,
        bedId,
        name: "John Doe",
        phone: "9876543210",
        joiningDate: "2026-03-01",
        rentPaise: 1000000,
        depositPaise: 2000000,
        dueDate: "2026-03-05",
      },
      db,
    );

    expect(result.tenant).toBeDefined();
    expect(result.tenant.name).toBe("John Doe");
    expect(result.tenant.status).toBe("ACTIVE");

    expect(result.assignment).toBeDefined();
    expect(result.assignment.bedId).toBe(bedId);
    expect(result.assignment.startDate).toBe("2026-03-01");
    expect(result.assignment.endDateExclusive).toBeNull();

    expect(result.rentalTerm).toBeDefined();
    expect(result.rentalTerm.rentPaise).toBe(1000000);

    expect(result.deposit).toBeDefined();
    expect(result.deposit.amountPaise).toBe(2000000);
    expect(result.deposit.status).toBe("HELD");

    expect(result.obligation).toBeDefined();
    expect(result.obligation.amountPaise).toBe(1000000);
    expect(result.obligation.dueDate).toBe("2026-03-05");

    const tenantCount = db
      .prepare(`SELECT COUNT(*) AS count FROM tenants WHERE id = ?`)
      .get(result.tenant.id).count;
    const assignmentCount = db
      .prepare(`SELECT COUNT(*) AS count FROM assignments WHERE id = ?`)
      .get(result.assignment.id).count;
    expect(tenantCount).toBe(1);
    expect(assignmentCount).toBe(1);
  });

  it("throws BED_INACTIVE if target bed is decommissioned", () => {
    db.prepare(`UPDATE beds SET is_active = 0 WHERE id = ?`).run(bedId);

    expect(() => {
      moveInWorkflow(
        {
          propertyId,
          bedId,
          name: "Jane Doe",
          phone: "9876543211",
          joiningDate: "2026-03-01",
          rentPaise: 1000000,
        },
        db,
      );
    }).toThrow("BED_INACTIVE");
  });

  it("throws BED_ALREADY_OCCUPIED if bed has an open active assignment", () => {
    db.prepare(
      `
      INSERT INTO tenants (id, property_id, name, phone, status, joining_date)
      VALUES ('existing-tenant', ?, 'Existing Tenant', '9000000000', 'ACTIVE', '2026-01-01')
    `,
    ).run(propertyId);

    db.prepare(
      `
      INSERT INTO assignments (id, tenant_id, bed_id, start_date, end_date_exclusive)
      VALUES ('active-assign', 'existing-tenant', ?, '2026-01-01', NULL)
    `,
    ).run(bedId);

    expect(() => {
      moveInWorkflow(
        {
          propertyId,
          bedId,
          name: "New Tenant",
          phone: "9876543212",
          joiningDate: "2026-03-01",
          rentPaise: 1000000,
        },
        db,
      );
    }).toThrow("BED_ALREADY_OCCUPIED");
  });

  it("rolls back all records if obligation generation fails", () => {
    vi.spyOn(obligationRepo, "insert").mockImplementationOnce(() => {
      throw new Error("SIMULATED_DB_FAILURE");
    });

    expect(() => {
      moveInWorkflow(
        {
          propertyId,
          bedId,
          name: "Rollback Tenant",
          phone: "9876543213",
          joiningDate: "2026-03-01",
          rentPaise: 1000000,
        },
        db,
      );
    }).toThrow("SIMULATED_DB_FAILURE");

    const tenants = db
      .prepare(
        `SELECT COUNT(*) AS count FROM tenants WHERE phone = '9876543213'`,
      )
      .get().count;
    const assignments = db
      .prepare(`SELECT COUNT(*) AS count FROM assignments WHERE bed_id = ?`)
      .get(bedId).count;
    expect(tenants).toBe(0);
    expect(assignments).toBe(0);

    vi.restoreAllMocks();
  });
});
