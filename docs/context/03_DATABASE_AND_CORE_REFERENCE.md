# Database, Persistence, and Core Reference

## Schema inventory

SQLite schema is `server/db/schema.sql`. IDs are text PKs; timestamps/dates are text; financial amounts are integer paise. Foreign keys are enabled by connection configuration.

| Table | Fields | Constraints, relations, indexes |
|---|---|---|
| `properties` | id, name, address, created_at | name/address NOT NULL; timestamp default CURRENT_TIMESTAMP |
| `floors` | id, property_id, display_order, name | property FK CASCADE |
| `rooms` | id, floor_id, room_number | floor FK CASCADE |
| `beds` | id, room_id, bed_label, is_active | room FK CASCADE; active default 1 CHECK 0/1 |
| `tenants` | id, property_id, name, phone, status, joining_date, checkout_date, created_at | property FK RESTRICT; status CHECK ACTIVE/CHECKED_OUT; created timestamp default |
| `assignments` | id, tenant_id, bed_id, start_date, end_date_exclusive | tenant/bed FK RESTRICT; indexes bed+dates and tenant+dates |
| `rental_terms` | id, tenant_id, rent_paise, effective_from, effective_to_exclusive | tenant FK RESTRICT; rent >0 |
| `obligations` | id, tenant_id, period_start, period_end_exclusive, due_date, amount_paise, rental_term_id, created_at | tenant RESTRICT, term SET NULL; amount >0; period start<end; unique tenant+period bounds; index tenant+period/due |
| `payments` | id, tenant_id, amount_paise, paid_on, payment_method, reference_note, idempotency_key, created_at | tenant RESTRICT; amount >0; method enum CHECK; unique idempotency key; index tenant+date |
| `payment_allocations` | id, payment_id, obligation_id, amount_paise, created_at | payment/obligation RESTRICT; amount >0; indexes by payment and obligation |
| `deposits` | id, tenant_id, amount_paise, received_on, status, created_at | tenant RESTRICT; amount >0; HELD/SETTLED CHECK |
| `deposit_settlements` | id, deposit_id, tenant_id, deductions_total_paise, refund_paise, remaining_liability_paise, settled_at | deposit unique; both FKs RESTRICT; totals >=0 |
| `deposit_deductions` | id, settlement_id, amount_paise, reason | settlement RESTRICT; amount >0; trimmed reason nonempty |

Not enforced by schema: overlap/exclusion for assignment or term periods; one active assignment per tenant/bed; cross-property tenant/bed consistency; allocation totals bounded by payment/obligation; unique floor order/room number/bed label. Some are workflow-checked; some are not. `db_integration.test.js` checks selected FK, unique, period, idempotency, and amount constraints.

## Initialization, migrations, backup

`connection.js` resolves `stay_ledger.db` next to the module, opens better-sqlite3, enables `foreign_keys=ON`, `journal_mode=WAL`, `busy_timeout=5000`, then executes `schema.sql`. Schema uses `CREATE TABLE/INDEX IF NOT EXISTS`; there is no migration registry/version table, migration directory, backup/restore tooling, or database adapter abstraction found. This is initialization, not versioned migration. WAL means backup/restore must account for SQLite WAL semantics; no app-specific procedure is documented or implemented.

## Repositories, policies, and workflow contracts

Repositories in `server/src/core/repos/` provide table-specific CRUD/find operations and snake_case-to-camelCase mapping. `assignmentRepo` checks overlaps in application SQL; `obligationRepo` and allocation/payment repos support financial reads/writes. Repositories generally accept `db` parameters but defaulting conventions vary. Keep SQL here, domain orchestration in workflows, and pure calculations in policies.

| Module | Responsibility / transaction |
|---|---|
| `moveInWorkflow` | validate dates/amounts; create tenant, assignment, rental term, optional deposit, first obligation in one transaction |
| `collectPaymentWorkflow` | optional idempotency lookup; generate due periods, optional due-date override, FIFO allocations, payment+allocations in one transaction |
| `shiftBedWorkflow` | close prior assignment and insert new assignment transactionally |
| `moveOutWorkflow` | close assignment and active term, mark checkout transactionally |
| `settleDepositWorkflow` | calculate, insert settlement/deductions, mark deposit settled transactionally |
| `manageStructureWorkflow` | add floor/room/bed; delete only empty floor/room or historically unused bed; toggle active. Adds are individual writes. |
| Policies | date/interval helpers, anchored month periods, FIFO allocation, deposit refund/liability calculations |

Transaction rollback applies to thrown errors within a synchronous transaction callback. External side effects are not part of those transactions. Database constraints cover only row-local and listed relational rules; they do not replace application validation.

## Query and cache contracts

Queries: `getPropertyOccupancyTree(propertyId,date?,db?)`, `getTenantDirectory({propertyId,status,search,paymentStatus},db?)`, `getTenantLedger(tenantId,db?)`, `getFinancialSummary(propertyId,date?,db?)`. Occupancy and directory preaggregate allocations/debt before joining to prevent allocation row multiplication. Financial summary uses separate aggregates and returns lifetime billed/collected/outstanding/credit/deposit totals; overdue uses as-of date. Occupancy's financial aggregate selects current-cycle obligations plus any outstanding obligations, so its totals are not pure monthly totals.

Query key factory: properties all/detail/occupancy/financials; tenants all/list/ledger. Read hooks are under `client/src/data`. Mutation hooks invalidate occupancy, financials and tenant family as applicable. Structure create/delete/toggle invalidates some property views; there are no hooks for floor/room deletes in current `useStructureMutations`, while the UI may invoke other paths. Some invalidations use literal `['properties',id,...]` prefixes instead of key factories. There is no payments-specific key family.

## Android portability flags

The existing core imports `node:crypto` and `server/db/connection.js`; repos use better-sqlite3 statement APIs and receive Node DB objects. Connection reads schema via `node:fs`, resolves path via `node:path`/`fileURLToPath`, and creates a server-local file. These are direct barriers to running this code unchanged in Android. Pure policy functions are the clearest candidate to port/reuse, subject to parity tests. The DB schema is SQLite SQL but driver behavior, supported SQLite version/extensions, date/text handling, transaction semantics, data upgrade path, and backup/import/export need platform-specific investigation. No final adapter/framework is selected.
