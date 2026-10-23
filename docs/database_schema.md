# Database schema

The active database definition is [server/db/schema.sql](../server/db/schema.sql). [server/db/connection.js](../server/db/connection.js) opens the `better-sqlite3` database, enables foreign keys, WAL mode and a 5-second busy timeout, and executes the schema SQL whenever a database is opened. `CREATE ... IF NOT EXISTS` leaves existing tables intact; the A-05 triggers are independently created on each schema initialization. There is no migration framework or schema-version table.

## Tables and relationships

| Table | Role and key relationships |
| --- | --- |
| `properties` | Property identity and address. Parent of floors and tenants. |
| `floors` | Belongs to a property (`ON DELETE CASCADE`). |
| `rooms` | Belongs to a floor (`ON DELETE CASCADE`). |
| `beds` | Belongs to a room (`ON DELETE CASCADE`); `is_active` is 0/1. |
| `tenants` | Belongs to a property (`ON DELETE RESTRICT`); lifecycle status is `ACTIVE` or `CHECKED_OUT`. |
| `assignments` | Tenant-to-bed occupancy interval; tenant and bed deletes are restricted. |
| `rental_terms` | Tenant rent amount and effective interval. |
| `obligations` | Tenant billing interval, due date, amount, optional rental-term reference; unique per tenant/period. |
| `payments` | Tenant receipt with amount, date, method, reference, optional unique idempotency key. |
| `payment_allocations` | Payment-to-obligation amount rows. Positive amount and foreign keys only. |
| `deposits` | Tenant deposit and `HELD`/`SETTLED` state. |
| `deposit_settlements` | One settlement per deposit, with deductions, refund and liability totals. |
| `deposit_deductions` | Positive amount and nonblank reason under a settlement. |

## Enforced constraints

- Foreign keys are enabled on connections. Money amounts that must be positive have `CHECK` constraints; selected calculated settlement fields allow zero but reject negative values.
- Obligation intervals require `period_start < period_end_exclusive`; tenant and period boundaries are unique.
- Payment methods are restricted to `UPI`, `CASH`, `BANK_TRANSFER`, and `OTHER`; idempotency keys are unique when non-null.
- A deposit can have at most one settlement (`UNIQUE(deposit_id)`).
- Assignment triggers `assignments_integrity_before_insert` and `assignments_integrity_before_update` reject closed intervals where start is on/after end and reject overlapping intervals for either bed or tenant. They implement half-open overlap comparisons, treat `NULL` end as open-ended, and permit adjacency. Trigger failures use `ASSIGNMENT_INTERVAL_INVALID`, `ASSIGNMENT_BED_OVERLAP`, or `ASSIGNMENT_TENANT_OVERLAP`.
- The indexes support assignment lookups, obligation ordering, allocations by payment/obligation, tenant payment history, and tenant status/property lookup.

## Limits of database enforcement

The schema does not enforce assignment dates as real calendar dates or enforce that assignment bed and tenant belong to the same property. Rental-term interval validity/non-overlap is not enforced. Allocation rows are positive and reference valid records, but the database does not cap aggregate allocations at a payment or obligation amount, nor ensure payment and obligation tenant IDs match. Deposit settlement totals are not cross-checked against deposit and deduction rows. These invariants currently depend on workflow/policy behavior or remain gaps; see [workflows and queries](workflows_and_queries.md) and the [audit matrix](AUDIT_TEST_MATRIX.md).

SQLite serializes writers and this app uses local `better-sqlite3` transactions, but this description is not a claim about multi-device or distributed concurrency. See [architecture](PROJECT_ARCHITECTURE.md).
