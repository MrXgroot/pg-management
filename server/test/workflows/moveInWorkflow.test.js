import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
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

  afterEach(() => {
    vi.restoreAllMocks();
    db?.close();
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

    expect(db.prepare("SELECT COUNT(*) AS count FROM tenants WHERE id = ?").get(result.tenant.id).count).toBe(1);
    expect(db.prepare("SELECT COUNT(*) AS count FROM assignments WHERE id = ? AND tenant_id = ? AND bed_id = ?").get(result.assignment.id, result.tenant.id, bedId).count).toBe(1);
    expect(db.prepare("SELECT COUNT(*) AS count FROM rental_terms WHERE tenant_id = ?").get(result.tenant.id).count).toBe(1);
    expect(db.prepare("SELECT COUNT(*) AS count FROM deposits WHERE tenant_id = ? AND amount_paise = 2000000").get(result.tenant.id).count).toBe(1);
    expect(db.prepare("SELECT COUNT(*) AS count FROM obligations WHERE tenant_id = ? AND rental_term_id = ?").get(result.tenant.id, result.rentalTerm.id).count).toBe(1);
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
          depositPaise: 250000,
        },
        db,
      );
    }).toThrow("SIMULATED_DB_FAILURE");

    expect(db.prepare("SELECT COUNT(*) AS count FROM tenants WHERE phone = '9876543213'").get().count).toBe(0);
    expect(db.prepare("SELECT COUNT(*) AS count FROM assignments WHERE bed_id = ?").get(bedId).count).toBe(0);
    expect(db.prepare("SELECT COUNT(*) AS count FROM rental_terms").get().count).toBe(0);
    expect(db.prepare("SELECT COUNT(*) AS count FROM deposits").get().count).toBe(0);
    expect(db.prepare("SELECT COUNT(*) AS count FROM obligations").get().count).toBe(0);

  });

  it("rejects a bed that belongs to a different property", () => {
    db.prepare("INSERT INTO properties (id, name, address) VALUES ('prop-2', 'Beta PG', 'Other St')").run();
    db.prepare("INSERT INTO floors (id, property_id, display_order, name) VALUES ('floor-2', 'prop-2', 1, '1F')").run();
    db.prepare("INSERT INTO rooms (id, floor_id, room_number) VALUES ('room-2', 'floor-2', '201')").run();
    db.prepare("INSERT INTO beds (id, room_id, bed_label, is_active) VALUES ('bed-2', 'room-2', 'A', 1)").run();

    expect(() => moveInWorkflow({
      propertyId,
      bedId: "bed-2",
      name: "Cross Property Tenant",
      phone: "9876543214",
      joiningDate: "2026-03-01",
      rentPaise: 1000000,
      depositPaise: 100000,
    }, db)).toThrow();

    expect(db.prepare("SELECT COUNT(*) AS count FROM tenants").get().count).toBe(0);
    expect(db.prepare("SELECT COUNT(*) AS count FROM assignments").get().count).toBe(0);
    expect(db.prepare("SELECT COUNT(*) AS count FROM rental_terms").get().count).toBe(0);
    expect(db.prepare("SELECT COUNT(*) AS count FROM deposits").get().count).toBe(0);
    expect(db.prepare("SELECT COUNT(*) AS count FROM obligations").get().count).toBe(0);
  });

  it.each([
    ["missing property", { propertyId: "missing-property", bedId }, "PROPERTY_NOT_FOUND"],
    ["missing bed", { propertyId, bedId: "missing-bed" }, "BED_NOT_FOUND"],
  ])("rejects a %s", (_label, identity, errorCode) => {
    expect(() => moveInWorkflow({
      ...identity,
      name: "Test Tenant",
      phone: "9876543215",
      joiningDate: "2026-03-01",
      rentPaise: 1000000,
    }, db)).toThrow(errorCode);
  });

  it.each([
    ["invalid calendar date", { joiningDate: "2026-02-30", rentPaise: 1000000, depositPaise: 0 }, /Invalid calendar date/],
    ["zero rent", { joiningDate: "2026-03-01", rentPaise: 0, depositPaise: 0 }, "INVALID_RENT_AMOUNT"],
    ["negative rent", { joiningDate: "2026-03-01", rentPaise: -1, depositPaise: 0 }, "INVALID_RENT_AMOUNT"],
    ["negative deposit", { joiningDate: "2026-03-01", rentPaise: 1000000, depositPaise: -1 }, "INVALID_DEPOSIT_AMOUNT"],
  ])("rejects %s before writing records", (_label, values, expectedError) => {
    expect(() => moveInWorkflow({
      propertyId,
      bedId,
      name: "Invalid Tenant",
      phone: "9876543216",
      ...values,
    }, db)).toThrow(expectedError);

    expect(db.prepare("SELECT COUNT(*) AS count FROM tenants").get().count).toBe(0);
    expect(db.prepare("SELECT COUNT(*) AS count FROM assignments").get().count).toBe(0);
    expect(db.prepare("SELECT COUNT(*) AS count FROM rental_terms").get().count).toBe(0);
    expect(db.prepare("SELECT COUNT(*) AS count FROM deposits").get().count).toBe(0);
    expect(db.prepare("SELECT COUNT(*) AS count FROM obligations").get().count).toBe(0);
  });
});
