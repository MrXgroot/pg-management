import { getDatabase, initSchema } from "./connection.js";

export function seedDatabase(db) {
  const run = db.transaction(() => {
    function insertRows(sql, rows) {
      const stmt = db.prepare(sql);
      for (const row of rows) {
        stmt.run(...row);
      }
    }

    // 1. Property
    insertRows(
      `INSERT OR IGNORE INTO properties (id, name, address)
       VALUES (?, ?, ?)`,
      [["prop_1", "Greenview Luxury PG", "4th Cross, Koramangala, Bengaluru"]],
    );

    // 2. Floors
    insertRows(
      `INSERT OR IGNORE INTO floors
       (id, property_id, display_order, name)
       VALUES (?, ?, ?, ?)`,
      [
        ["floor_1", "prop_1", 1, "First Floor"],
        ["floor_2", "prop_1", 2, "Second Floor"],
        ["floor_3", "prop_1", 3, "Third Floor"],
      ],
    );

    // 3. Rooms
    insertRows(
      `INSERT OR IGNORE INTO rooms (id, floor_id, room_number)
       VALUES (?, ?, ?)`,
      [
        ["room_101", "floor_1", "101"],
        ["room_102", "floor_1", "102"],
        ["room_103", "floor_1", "103"],
        ["room_201", "floor_2", "201"],
        ["room_202", "floor_2", "202"],
        ["room_301", "floor_3", "301"],
      ],
    );

    // 4. Beds
    insertRows(
      `INSERT OR IGNORE INTO beds (id, room_id, bed_label, is_active)
       VALUES (?, ?, ?, ?)`,
      [
        ["bed_101_a", "room_101", "Bed A", 1],
        ["bed_101_b", "room_101", "Bed B", 1],
        ["bed_102_a", "room_102", "Bed A", 1],
        ["bed_102_b", "room_102", "Bed B", 1],
        ["bed_103_a", "room_103", "Bed A", 1],
        ["bed_103_b", "room_103", "Bed B", 1],
        ["bed_201_a", "room_201", "Bed A", 1],
        ["bed_201_b", "room_201", "Bed B", 1],
        ["bed_202_a", "room_202", "Bed A", 1],
        ["bed_202_b", "room_202", "Bed B", 1],
        ["bed_301_a", "room_301", "Bed A", 1],
        ["bed_301_b", "room_301", "Bed B", 0],
      ],
    );

    // 5. Tenants
    // Mix of active and checked-out tenants.
    insertRows(
      `INSERT OR IGNORE INTO tenants
       (id, property_id, name, phone, status, joining_date, checkout_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        [
          "ten_1",
          "prop_1",
          "Rahul Sharma",
          "9876543210",
          "ACTIVE",
          "2026-09-01",
          null,
        ],
        [
          "ten_2",
          "prop_1",
          "Priya Nair",
          "9876543211",
          "ACTIVE",
          "2026-09-01",
          null,
        ],
        [
          "ten_3",
          "prop_1",
          "Arjun Kumar",
          "9876543212",
          "ACTIVE",
          "2026-09-10",
          null,
        ],
        [
          "ten_4",
          "prop_1",
          "Neha Reddy",
          "9876543213",
          "ACTIVE",
          "2026-09-15",
          null,
        ],
        [
          "ten_5",
          "prop_1",
          "Karthik Rao",
          "9876543214",
          "ACTIVE",
          "2026-10-01",
          null,
        ],
        [
          "ten_6",
          "prop_1",
          "Manish Verma",
          "9876543215",
          "CHECKED_OUT",
          "2026-08-01",
          "2026-09-10",
        ],
        [
          "ten_7",
          "prop_1",
          "Divya Shetty",
          "9876543216",
          "ACTIVE",
          "2026-08-01",
          null,
        ],
        [
          "ten_8",
          "prop_1",
          "Vivek Joshi",
          "9876543217",
          "ACTIVE",
          "2026-10-05",
          null,
        ],
      ],
    );

    // 6. Bed assignments
    // Historical assignments remain available after checkout/move.
    insertRows(
      `INSERT OR IGNORE INTO assignments
       (id, tenant_id, bed_id, start_date, end_date_exclusive)
       VALUES (?, ?, ?, ?, ?)`,
      [
        ["asgn_1", "ten_1", "bed_101_a", "2026-09-01", null],
        ["asgn_2", "ten_2", "bed_101_b", "2026-09-01", null],
        ["asgn_3", "ten_3", "bed_102_a", "2026-09-10", null],
        ["asgn_4", "ten_4", "bed_102_b", "2026-09-15", null],
        ["asgn_5", "ten_5", "bed_201_a", "2026-10-01", null],
        ["asgn_6", "ten_6", "bed_103_a", "2026-08-01", "2026-09-10"],
        ["asgn_7", "ten_7", "bed_202_a", "2026-08-01", null],
        ["asgn_8", "ten_8", "bed_301_a", "2026-10-05", null],
      ],
    );

    // 7. Rental terms
    // Amounts are stored in paise: ₹8,500 = 850000.
    insertRows(
      `INSERT OR IGNORE INTO rental_terms
       (id, tenant_id, rent_paise, effective_from, effective_to_exclusive)
       VALUES (?, ?, ?, ?, ?)`,
      [
        ["term_1", "ten_1", 850000, "2026-09-01", null],
        ["term_2", "ten_2", 750000, "2026-09-01", null],
        ["term_3", "ten_3", 700000, "2026-09-10", null],
        ["term_4", "ten_4", 650000, "2026-09-15", null],
        ["term_5", "ten_5", 800000, "2026-10-01", null],
        ["term_6", "ten_6", 600000, "2026-08-01", "2026-09-10"],
        ["term_7", "ten_7", 900000, "2026-08-01", null],
        ["term_8", "ten_8", 680000, "2026-10-05", null],
      ],
    );

    // 8. Rent obligations
    // Historical obligations are preserved. Outstanding balances
    // are calculated from allocations, not stored in this table.
    insertRows(
      `INSERT OR IGNORE INTO obligations
       (id, tenant_id, period_start, period_end_exclusive,
        due_date, amount_paise, rental_term_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        // Rahul: September and October
        [
          "oblg_1",
          "ten_1",
          "2026-09-01",
          "2026-10-01",
          "2026-09-05",
          850000,
          "term_1",
        ],
        [
          "oblg_2",
          "ten_1",
          "2026-10-01",
          "2026-11-01",
          "2026-10-05",
          850000,
          "term_1",
        ],

        // Priya: fully paid September and October
        [
          "oblg_3",
          "ten_2",
          "2026-09-01",
          "2026-10-01",
          "2026-09-05",
          750000,
          "term_2",
        ],
        [
          "oblg_4",
          "ten_2",
          "2026-10-01",
          "2026-11-01",
          "2026-10-05",
          750000,
          "term_2",
        ],

        // Arjun: partial September payment and unpaid October
        [
          "oblg_5",
          "ten_3",
          "2026-09-10",
          "2026-10-10",
          "2026-09-15",
          700000,
          "term_3",
        ],
        [
          "oblg_6",
          "ten_3",
          "2026-10-10",
          "2026-11-10",
          "2026-10-15",
          700000,
          "term_3",
        ],

        // Neha: overdue September and October
        [
          "oblg_7",
          "ten_4",
          "2026-09-15",
          "2026-10-15",
          "2026-09-20",
          650000,
          "term_4",
        ],
        [
          "oblg_8",
          "ten_4",
          "2026-10-15",
          "2026-11-15",
          "2026-10-20",
          650000,
          "term_4",
        ],

        // Karthik: current cycle, due in October
        [
          "oblg_9",
          "ten_5",
          "2026-10-01",
          "2026-11-01",
          "2026-10-05",
          800000,
          "term_5",
        ],

        // Manish: historical rent plus final partial period
        [
          "oblg_10",
          "ten_6",
          "2026-08-01",
          "2026-09-01",
          "2026-08-05",
          600000,
          "term_6",
        ],
        [
          "oblg_11",
          "ten_6",
          "2026-09-01",
          "2026-09-10",
          "2026-09-05",
          180000,
          "term_6",
        ],

        // Divya: older balance and current October obligation
        [
          "oblg_12",
          "ten_7",
          "2026-09-01",
          "2026-10-01",
          "2026-09-05",
          900000,
          "term_7",
        ],
        [
          "oblg_13",
          "ten_7",
          "2026-10-01",
          "2026-11-01",
          "2026-10-05",
          900000,
          "term_7",
        ],

        // Vivek: new tenant
        [
          "oblg_14",
          "ten_8",
          "2026-10-05",
          "2026-11-05",
          "2026-10-10",
          680000,
          "term_8",
        ],
      ],
    );

    // 9. Payments
    // One payment is a real transaction. Allocations below determine
    // which obligations that transaction pays.
    insertRows(
      `INSERT OR IGNORE INTO payments
       (id, tenant_id, amount_paise, paid_on, payment_method,
        reference_note, idempotency_key)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        [
          "pay_1",
          "ten_1",
          850000,
          "2026-09-04",
          "UPI",
          "UPI Ref #992819",
          "idem_seed_001",
        ],
        [
          "pay_2",
          "ten_1",
          850000,
          "2026-10-04",
          "UPI",
          "October rent",
          "idem_seed_002",
        ],

        // Priya: two separate monthly payments
        [
          "pay_3",
          "ten_2",
          750000,
          "2026-09-03",
          "CASH",
          "September rent",
          "idem_seed_003",
        ],
        [
          "pay_4",
          "ten_2",
          750000,
          "2026-10-03",
          "UPI",
          "October rent",
          "idem_seed_004",
        ],

        // Arjun: partial payment
        [
          "pay_5",
          "ten_3",
          300000,
          "2026-09-20",
          "UPI",
          "Part payment",
          "idem_seed_005",
        ],

        // Divya: one transaction split across two obligations
        [
          "pay_6",
          "ten_7",
          1000000,
          "2026-10-06",
          "BANK_TRANSFER",
          "Payment covering old balance and October",
          "idem_seed_006",
        ],

        // Vivek: paid in cash
        [
          "pay_7",
          "ten_8",
          680000,
          "2026-10-08",
          "CASH",
          "First rent payment",
          "idem_seed_007",
        ],

        // Manish: payment for his historical rent
        [
          "pay_8",
          "ten_6",
          780000,
          "2026-09-08",
          "UPI",
          "Final rent settlement",
          "idem_seed_008",
        ],
      ],
    );

    // 10. Payment allocations
    insertRows(
      `INSERT OR IGNORE INTO payment_allocations
       (id, payment_id, obligation_id, amount_paise)
       VALUES (?, ?, ?, ?)`,
      [
        ["alloc_1", "pay_1", "oblg_1", 850000],
        ["alloc_2", "pay_2", "oblg_2", 850000],
        ["alloc_3", "pay_3", "oblg_3", 750000],
        ["alloc_4", "pay_4", "oblg_4", 750000],

        // Arjun still owes ₹4,000 for September
        ["alloc_5", "pay_5", "oblg_5", 300000],

        // Divya pays ₹9,000 toward September and ₹1,000 toward October
        ["alloc_6", "pay_6", "oblg_12", 900000],
        ["alloc_7", "pay_6", "oblg_13", 100000],

        ["alloc_8", "pay_7", "oblg_14", 680000],

        // Manish paid ₹7,800 against ₹7,800 in historical obligations
        ["alloc_9", "pay_8", "oblg_10", 600000],
        ["alloc_10", "pay_8", "oblg_11", 180000],
      ],
    );

    // 11. Security deposits
    insertRows(
      `INSERT OR IGNORE INTO deposits
       (id, tenant_id, amount_paise, received_on, status)
       VALUES (?, ?, ?, ?, ?)`,
      [
        ["dep_1", "ten_1", 1500000, "2026-09-01", "HELD"],
        ["dep_2", "ten_2", 1200000, "2026-09-01", "HELD"],
        ["dep_3", "ten_3", 1000000, "2026-09-10", "HELD"],
        ["dep_4", "ten_4", 1000000, "2026-09-15", "HELD"],
        ["dep_5", "ten_5", 1200000, "2026-10-01", "HELD"],

        // Manish has checked out and his deposit is settled
        ["dep_6", "ten_6", 1300000, "2026-08-01", "SETTLED"],

        ["dep_7", "ten_7", 1500000, "2026-08-01", "HELD"],
        ["dep_8", "ten_8", 1000000, "2026-10-05", "HELD"],
      ],
    );

    // 12. Deposit settlement
    // Manish: ₹13,000 deposit - ₹2,000 deductions = ₹11,000 refund.
    insertRows(
      `INSERT OR IGNORE INTO deposit_settlements
       (id, deposit_id, tenant_id, deductions_total_paise,
        refund_paise, remaining_liability_paise, settled_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        [
          "settle_1",
          "dep_6",
          "ten_6",
          200000,
          1100000,
          0,
          "2026-09-10 12:00:00",
        ],
      ],
    );

    // 13. Deposit deduction details
    insertRows(
      `INSERT OR IGNORE INTO deposit_deductions
       (id, settlement_id, amount_paise, reason)
       VALUES (?, ?, ?, ?)`,
      [
        ["deduct_1", "settle_1", 150000, "Room cleaning"],
        ["deduct_2", "settle_1", 50000, "Damaged key and lock"],
      ],
    );
  });

  run();
}

// Standalone execution using the default database.
if (process.argv[1]?.endsWith("seed.js")) {
  const db = getDatabase();
  initSchema(db);
  seedDatabase(db);
  console.log("Database schema created and seeded successfully.");
}
