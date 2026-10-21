import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "../helpers/testDb.js";
import { getPropertyOccupancyTree } from "../../src/core/queries/occupancyQueries.js";

describe("occupancyQueries", () => {
  let db;
  const propertyId = "prop-1";
  const floorId = "floor-1";
  const roomId = "room-1";

  beforeEach(() => {
    db = createTestDb();
    db.prepare(
      `INSERT INTO properties (id, name, address) VALUES (?, ?, ?)`,
    ).run(propertyId, "Alpha PG", "Main St");
    db.prepare(
      `INSERT INTO floors (id, property_id, display_order, name) VALUES (?, ?, 1, '1st Floor')`,
    ).run(floorId, propertyId);
    db.prepare(
      `INSERT INTO rooms (id, floor_id, room_number) VALUES (?, ?, '101')`,
    ).run(roomId, floorId);

    // Bed A: Occupied
    db.prepare(
      `INSERT INTO beds (id, room_id, bed_label, is_active) VALUES ('bed-a', ?, 'A', 1)`,
    ).run(roomId);
    // Bed B: Vacant
    db.prepare(
      `INSERT INTO beds (id, room_id, bed_label, is_active) VALUES ('bed-b', ?, 'B', 1)`,
    ).run(roomId);
    // Bed C: Decommissioned / Inactive
    db.prepare(
      `INSERT INTO beds (id, room_id, bed_label, is_active) VALUES ('bed-c', ?, 'C', 0)`,
    ).run(roomId);

    // Tenant in Bed A
    db.prepare(
      `
      INSERT INTO tenants (id, property_id, name, phone, status, joining_date)
      VALUES ('tenant-a', ?, 'Alice', '9876543210', 'ACTIVE', '2026-01-01')
    `,
    ).run(propertyId);

    db.prepare(
      `
      INSERT INTO assignments (id, tenant_id, bed_id, start_date, end_date_exclusive)
      VALUES ('assign-a', 'tenant-a', 'bed-a', '2026-01-01', NULL)
    `,
    ).run();

    // Overdue obligation (due 2026-01-05, check date 2026-02-01)
    db.prepare(
      `
      INSERT INTO obligations (id, tenant_id, period_start, period_end_exclusive, due_date, amount_paise)
      VALUES ('ob-1', 'tenant-a', '2026-01-01', '2026-02-01', '2026-01-05', 1000000)
    `,
    ).run();

    // Partial allocation of 400,000 paise leaving 600,000 paise overdue
    db.prepare(
      `
      INSERT INTO payments (id, tenant_id, amount_paise, paid_on, payment_method)
      VALUES ('pay-1', 'tenant-a', 400000, '2026-01-06', 'UPI')
    `,
    ).run();

    db.prepare(
      `
      INSERT INTO payment_allocations (id, payment_id, obligation_id, amount_paise)
      VALUES ('alloc-1', 'pay-1', 'ob-1', 400000)
    `,
    ).run();
  });

  it("assembles the Floors -> Rooms -> Beds hierarchy with correct bed statuses and live balances", () => {
    const tree = getPropertyOccupancyTree(propertyId, "2026-02-01", db);

    expect(tree).toBeDefined();
    expect(tree.property.id).toBe(propertyId);
    expect(tree.asOfDate).toBe("2026-02-01");
    expect(tree.floors).toHaveLength(1);

    const floor = tree.floors[0];
    expect(floor.rooms).toHaveLength(1);

    const beds = floor.rooms[0].beds;
    expect(beds).toHaveLength(3);

    const bedA = beds.find((b) => b.bedLabel === "A");
    expect(bedA.status).toBe("OCCUPIED");
    expect(bedA.tenant).toBeDefined();
    expect(bedA.tenant.name).toBe("Alice");
    expect(bedA.tenant.totalOutstandingPaise).toBe(600000);
    expect(bedA.tenant.overduePaise).toBe(600000);

    const bedB = beds.find((b) => b.bedLabel === "B");
    expect(bedB.status).toBe("VACANT");
    expect(bedB.tenant).toBeNull();

    const bedC = beds.find((b) => b.bedLabel === "C");
    expect(bedC.status).toBe("INACTIVE");
    expect(bedC.tenant).toBeNull();
  });
});
