// test/repos/structureRepos.test.js
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getDatabase, initSchema } from "../../db/connection.js";
import * as propertyRepo from "../../src/core/repos/propertyRepo.js";
import * as floorRepo from "../../src/core/repos/floorRepo.js";
import * as roomRepo from "../../src/core/repos/roomRepo.js";
import * as bedRepo from "../../src/core/repos/bedRepo.js";
describe("Structure Repositories Contract Verification", () => {
  let db;

  beforeEach(() => {
    db = getDatabase(":memory:");
    initSchema(db);
  });

  afterEach(() => {
    if (db) db.close();
  });

  it("manages property hierarchy and maps to camelCase", () => {
    const prop = propertyRepo.insert(
      { id: "p1", name: "Downtown PG", address: "Indiranagar" },
      db,
    );
    expect(prop.name).toBe("Downtown PG");

    const floor = floorRepo.insert(
      { id: "f1", propertyId: "p1", displayOrder: 1, name: "Ground Floor" },
      db,
    );
    expect(floor.displayOrder).toBe(1);

    const room = roomRepo.insert(
      { id: "r1", floorId: "f1", roomNumber: "G-01" },
      db,
    );
    expect(room.roomNumber).toBe("G-01");

    const bed = bedRepo.insert(
      { id: "b1", roomId: "r1", bedLabel: "Bed 1", isActive: true },
      db,
    );
    expect(bed.isActive).toBe(true);

    const allProps = propertyRepo.getAll(db);
    expect(allProps).toHaveLength(1);
    expect(allProps[0].id).toBe("p1");
  });

  it("blocks floor deletion when child rooms exist", () => {
    propertyRepo.insert(
      { id: "p1", name: "Downtown PG", address: "Indiranagar" },
      db,
    );
    floorRepo.insert(
      { id: "f1", propertyId: "p1", displayOrder: 1, name: "Ground Floor" },
      db,
    );
    roomRepo.insert({ id: "r1", floorId: "f1", roomNumber: "G-01" }, db);

    expect(() => floorRepo.remove("f1", db)).toThrow(
      /floor contains child rooms/,
    );
  });

  it("blocks room deletion when child beds exist", () => {
    propertyRepo.insert(
      { id: "p1", name: "Downtown PG", address: "Indiranagar" },
      db,
    );
    floorRepo.insert(
      { id: "f1", propertyId: "p1", displayOrder: 1, name: "Ground Floor" },
      db,
    );
    roomRepo.insert({ id: "r1", floorId: "f1", roomNumber: "G-01" }, db);
    bedRepo.insert({ id: "b1", roomId: "r1", bedLabel: "Bed 1" }, db);

    expect(() => roomRepo.remove("r1", db)).toThrow(/room contains child beds/);
  });

  it("allows bed deactivation and blocks deletion if assignment history exists", () => {
    propertyRepo.insert(
      { id: "p1", name: "Downtown PG", address: "Indiranagar" },
      db,
    );
    floorRepo.insert(
      { id: "f1", propertyId: "p1", displayOrder: 1, name: "Ground Floor" },
      db,
    );
    roomRepo.insert({ id: "r1", floorId: "f1", roomNumber: "G-01" }, db);
    bedRepo.insert({ id: "b1", roomId: "r1", bedLabel: "Bed 1" }, db);

    // Deactivate bed
    const updated = bedRepo.setActive("b1", false, db);
    expect(updated.isActive).toBe(false);

    // Insert mock tenant and assignment
    db.prepare(
      `
      INSERT INTO tenants (id, property_id, name, phone, status, joining_date)
      VALUES ('t1', 'p1', 'Alice', '9999999999', 'ACTIVE', '2026-09-01')
    `,
    ).run();
    db.prepare(
      `
      INSERT INTO assignments (id, tenant_id, bed_id, start_date)
      VALUES ('a1', 't1', 'b1', '2026-09-01')
    `,
    ).run();

    // Bed deletion must be blocked due to assignment history
    expect(() => bedRepo.remove("b1", db)).toThrow(
      /historical assignments exist/,
    );
  });
});
