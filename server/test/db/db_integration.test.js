// server/test/db_integration.test.js
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getDatabase, initSchema } from "../../db/connection.js";
import { seedDatabase } from "../../db/seed.js";
describe("Database Schema & Integrity Integration Tests", () => {
  let db;

  beforeEach(() => {
    // Brand new isolated in-memory DB for every single test
    db = getDatabase(":memory:");
    initSchema(db);
    seedDatabase(db);
  });

  afterEach(() => {
    if (db) {
      db.close();
    }
  });

  it("populates seed data accurately", () => {
    const prop = db
      .prepare("SELECT * FROM properties WHERE id = ?")
      .get("prop_1");
    expect(prop.name).toBe("Greenview Luxury PG");

    const beds = db.prepare("SELECT * FROM beds").all();
    expect(beds).toHaveLength(2);

    const tenant = db
      .prepare("SELECT * FROM tenants WHERE id = ?")
      .get("ten_1");
    expect(tenant.status).toBe("ACTIVE");
  });

  it("enforces RESTRICT foreign keys on assigned beds and active tenants", () => {
    // Bed 101 A is referenced by assignments; RESTRICT must block deletion
    expect(() => {
      db.prepare("DELETE FROM beds WHERE id = ?").run("bed_101_a");
    }).toThrow(/FOREIGN KEY constraint failed/);

    // Tenant has assignments and obligations; RESTRICT must block deletion
    expect(() => {
      db.prepare("DELETE FROM tenants WHERE id = ?").run("ten_1");
    }).toThrow(/FOREIGN KEY constraint failed/);
  });

  it("enforces UNIQUE constraints on duplicate tenant intervals", () => {
    expect(() => {
      db.prepare(
        `
        INSERT INTO obligations (id, tenant_id, period_start, period_end_exclusive, due_date, amount_paise)
        VALUES ('oblg_dup', 'ten_1', '2026-09-01', '2026-10-01', '2026-09-05', 850000)
      `,
      ).run();
    }).toThrow(/UNIQUE constraint failed/);
  });

  it("enforces CHECK constraints for obligation interval ordering", () => {
    expect(() => {
      db.prepare(
        `
        INSERT INTO obligations (id, tenant_id, period_start, period_end_exclusive, due_date, amount_paise)
        VALUES ('oblg_bad', 'ten_1', '2026-10-01', '2026-09-01', '2026-10-05', 850000)
      `,
      ).run();
    }).toThrow(/CHECK constraint failed/);
  });

  it("enforces unique payment idempotency key", () => {
    expect(() => {
      db.prepare(
        `
        INSERT INTO payments (id, tenant_id, amount_paise, paid_on, payment_method, idempotency_key)
        VALUES ('pay_dup', 'ten_1', 100000, '2026-09-05', 'CASH', 'idem_seed_001')
      `,
      ).run();
    }).toThrow(/UNIQUE constraint failed/);
  });

  it("enforces positive integer amounts in paise", () => {
    expect(() => {
      db.prepare(
        `
        INSERT INTO rental_terms (id, tenant_id, rent_paise, effective_from)
        VALUES ('term_invalid', 'ten_1', 0, '2026-10-01')
      `,
      ).run();
    }).toThrow(/CHECK constraint failed/);
  });
});
