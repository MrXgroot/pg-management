import { afterEach, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/testDb.js";
import { moveOutWorkflow } from "../../src/core/workflows/moveOutWorkflow.js";
import { shiftBedWorkflow } from "../../src/core/workflows/shiftBedWorkflow.js";
import { initSchema } from "../../db/connection.js";

function seedAssignmentParents(db) {
  db.prepare(
    "INSERT INTO properties (id, name, address) VALUES ('property-1', 'Alpha PG', 'Main St')",
  ).run();
  db.prepare(
    "INSERT INTO floors (id, property_id, display_order, name) VALUES ('floor-1', 'property-1', 1, '1F')",
  ).run();
  db.prepare(
    "INSERT INTO rooms (id, floor_id, room_number) VALUES ('room-1', 'floor-1', '101')",
  ).run();
  db.prepare(
    "INSERT INTO beds (id, room_id, bed_label, is_active) VALUES ('bed-1', 'room-1', 'A', 1), ('bed-2', 'room-1', 'B', 1), ('bed-3', 'room-1', 'C', 1)",
  ).run();
  db.prepare(
    "INSERT INTO tenants (id, property_id, name, phone, status, joining_date) VALUES ('tenant-1', 'property-1', 'Alice', '9876543210', 'ACTIVE', '2026-01-10'), ('tenant-2', 'property-1', 'Bob', '9876543211', 'ACTIVE', '2026-01-10')",
  ).run();
}

function insertAssignment(db, { id, tenantId, bedId, startDate, endDateExclusive }) {
  db.prepare(
    "INSERT INTO assignments (id, tenant_id, bed_id, start_date, end_date_exclusive) VALUES (?, ?, ?, ?, ?)",
  ).run(id, tenantId, bedId, startDate, endDateExclusive ?? null);
}

function assignmentsIn(db) {
  return db
    .prepare(
      "SELECT id, tenant_id, bed_id, start_date, end_date_exclusive FROM assignments ORDER BY id",
    )
    .all();
}

describe("A-05 assignment interval rules", () => {
  let db;

  afterEach(() => {
    db?.close();
    db = null;
  });

  it("allows a one-day bed assignment from January 10 through January 11", () => {
    db = createTestDb();
    db.prepare(
      "INSERT INTO properties (id, name, address) VALUES ('property-1', 'Alpha PG', 'Main St')",
    ).run();
    db.prepare(
      "INSERT INTO floors (id, property_id, display_order, name) VALUES ('floor-1', 'property-1', 1, '1F')",
    ).run();
    db.prepare(
      "INSERT INTO rooms (id, floor_id, room_number) VALUES ('room-1', 'floor-1', '101')",
    ).run();
    db.prepare(
      "INSERT INTO beds (id, room_id, bed_label, is_active) VALUES ('bed-1', 'room-1', 'A', 1), ('bed-2', 'room-1', 'B', 1)",
    ).run();
    db.prepare(
      "INSERT INTO tenants (id, property_id, name, phone, status, joining_date) VALUES ('tenant-1', 'property-1', 'Alice', '9876543210', 'ACTIVE', '2026-01-10')",
    ).run();
    db.prepare(
      "INSERT INTO assignments (id, tenant_id, bed_id, start_date, end_date_exclusive) VALUES ('assignment-1', 'tenant-1', 'bed-1', '2026-01-10', NULL)",
    ).run();
    db.prepare(
      "INSERT INTO rental_terms (id, tenant_id, rent_paise, effective_from) VALUES ('term-1', 'tenant-1', 1000000, '2026-01-10')",
    ).run();

    shiftBedWorkflow(
      { tenantId: "tenant-1", targetBedId: "bed-2", shiftDate: "2026-01-11" },
      db,
    );
    moveOutWorkflow({ tenantId: "tenant-1", checkoutDate: "2026-01-12" }, db);

    const intervals = db
      .prepare(
        "SELECT bed_id, start_date, end_date_exclusive FROM assignments WHERE tenant_id = ? ORDER BY start_date",
      )
      .all("tenant-1");

    expect(intervals).toEqual([
      {
        bed_id: "bed-1",
        start_date: "2026-01-10",
        end_date_exclusive: "2026-01-11",
      },
      {
        bed_id: "bed-2",
        start_date: "2026-01-11",
        end_date_exclusive: "2026-01-12",
      },
    ]);
  });

  it("rejects closed assignments with zero or negative duration without changing assignments", () => {
    db = createTestDb();
    seedAssignmentParents(db);
    insertAssignment(db, {
      id: "assignment-existing",
      tenantId: "tenant-1",
      bedId: "bed-1",
      startDate: "2026-01-10",
      endDateExclusive: "2026-01-11",
    });
    const before = assignmentsIn(db);

    expect(() =>
      insertAssignment(db, {
        id: "assignment-zero",
        tenantId: "tenant-2",
        bedId: "bed-2",
        startDate: "2026-01-10",
        endDateExclusive: "2026-01-10",
      }),
    ).toThrow("ASSIGNMENT_INTERVAL_INVALID");
    expect(assignmentsIn(db)).toEqual(before);

    expect(() =>
      insertAssignment(db, {
        id: "assignment-reversed",
        tenantId: "tenant-2",
        bedId: "bed-2",
        startDate: "2026-01-11",
        endDateExclusive: "2026-01-10",
      }),
    ).toThrow("ASSIGNMENT_INTERVAL_INVALID");
    expect(assignmentsIn(db)).toEqual(before);
  });

  it("rejects overlapping bed and tenant assignments without changing assignments", () => {
    db = createTestDb();
    seedAssignmentParents(db);
    insertAssignment(db, {
      id: "assignment-existing",
      tenantId: "tenant-1",
      bedId: "bed-1",
      startDate: "2026-01-10",
      endDateExclusive: "2026-01-12",
    });
    const before = assignmentsIn(db);

    expect(() =>
      insertAssignment(db, {
        id: "assignment-bed-overlap",
        tenantId: "tenant-2",
        bedId: "bed-1",
        startDate: "2026-01-11",
        endDateExclusive: "2026-01-13",
      }),
    ).toThrow("ASSIGNMENT_BED_OVERLAP");
    expect(assignmentsIn(db)).toEqual(before);

    expect(() =>
      insertAssignment(db, {
        id: "assignment-tenant-overlap",
        tenantId: "tenant-1",
        bedId: "bed-2",
        startDate: "2026-01-11",
        endDateExclusive: "2026-01-13",
      }),
    ).toThrow("ASSIGNMENT_TENANT_OVERLAP");
    expect(assignmentsIn(db)).toEqual(before);
  });

  it("rejects updates that create invalid or overlapping assignments without changing assignments", () => {
    db = createTestDb();
    seedAssignmentParents(db);
    insertAssignment(db, {
      id: "assignment-one",
      tenantId: "tenant-1",
      bedId: "bed-1",
      startDate: "2026-01-10",
      endDateExclusive: "2026-01-11",
    });
    insertAssignment(db, {
      id: "assignment-two",
      tenantId: "tenant-2",
      bedId: "bed-2",
      startDate: "2026-01-10",
      endDateExclusive: "2026-01-11",
    });
    const before = assignmentsIn(db);

    expect(() =>
      db.prepare("UPDATE assignments SET end_date_exclusive = start_date WHERE id = ?").run(
        "assignment-two",
      ),
    ).toThrow("ASSIGNMENT_INTERVAL_INVALID");
    expect(assignmentsIn(db)).toEqual(before);

    expect(() =>
      db.prepare("UPDATE assignments SET bed_id = ? WHERE id = ?").run(
        "bed-1",
        "assignment-two",
      ),
    ).toThrow("ASSIGNMENT_BED_OVERLAP");
    expect(assignmentsIn(db)).toEqual(before);

    expect(() =>
      db.prepare("UPDATE assignments SET tenant_id = ? WHERE id = ?").run(
        "tenant-1",
        "assignment-two",
      ),
    ).toThrow("ASSIGNMENT_TENANT_OVERLAP");
    expect(assignmentsIn(db)).toEqual(before);
  });

  it("allows adjacent intervals and rejects conflicts with open-ended assignments", () => {
    db = createTestDb();
    seedAssignmentParents(db);
    insertAssignment(db, {
      id: "assignment-closed",
      tenantId: "tenant-1",
      bedId: "bed-1",
      startDate: "2026-01-10",
      endDateExclusive: "2026-01-11",
    });

    expect(() =>
      insertAssignment(db, {
        id: "assignment-adjacent-open",
        tenantId: "tenant-1",
        bedId: "bed-1",
        startDate: "2026-01-11",
        endDateExclusive: null,
      }),
    ).not.toThrow();
    const beforeConflicts = assignmentsIn(db);

    expect(() =>
      insertAssignment(db, {
        id: "assignment-overlaps-open-bed",
        tenantId: "tenant-2",
        bedId: "bed-1",
        startDate: "2026-02-01",
        endDateExclusive: "2026-02-02",
      }),
    ).toThrow("ASSIGNMENT_BED_OVERLAP");
    expect(assignmentsIn(db)).toEqual(beforeConflicts);

    expect(() =>
      insertAssignment(db, {
        id: "assignment-overlaps-open-tenant",
        tenantId: "tenant-1",
        bedId: "bed-2",
        startDate: "2026-02-01",
        endDateExclusive: "2026-02-02",
      }),
    ).toThrow("ASSIGNMENT_TENANT_OVERLAP");
    expect(assignmentsIn(db)).toEqual(beforeConflicts);
  });

  it("installs assignment guards when schema initialization runs on an existing database", () => {
    db = createTestDb();
    seedAssignmentParents(db);
    insertAssignment(db, {
      id: "assignment-existing",
      tenantId: "tenant-1",
      bedId: "bed-1",
      startDate: "2026-01-10",
      endDateExclusive: "2026-01-11",
    });
    db.exec(
      "DROP TRIGGER assignments_integrity_before_insert; DROP TRIGGER assignments_integrity_before_update;",
    );

    initSchema(db);

    const triggers = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'trigger' AND name LIKE 'assignments_integrity_%' ORDER BY name")
      .all()
      .map(({ name }) => name);
    expect(triggers).toEqual([
      "assignments_integrity_before_insert",
      "assignments_integrity_before_update",
    ]);
    const before = assignmentsIn(db);
    expect(() =>
      insertAssignment(db, {
        id: "assignment-existing-bed-overlap",
        tenantId: "tenant-2",
        bedId: "bed-1",
        startDate: "2026-01-10",
        endDateExclusive: "2026-01-11",
      }),
    ).toThrow("ASSIGNMENT_BED_OVERLAP");
    expect(assignmentsIn(db)).toEqual(before);
  });
});
