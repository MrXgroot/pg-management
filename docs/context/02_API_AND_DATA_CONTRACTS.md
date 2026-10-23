# Historical domain rules and temporary HTTP contracts

> This context reference is retained for audit history. For current authoritative contracts, use [business rules](../business_rules_and_policies.md), [database schema](../database_schema.md), [workflows](../workflows_and_queries.md), and [API transport](../API_TRANSPORT_CONTRACT.md). Later A-05 work added SQLite assignment triggers; any conflicting pre-trigger statement below is superseded by the current schema reference.

This document separates observed implementation from unresolved product intent. Current sources are `server/db/schema.sql`, `server/src/core`, `server/src/routes`, client API hooks, and the named tests. The HTTP API is a prototype transport boundary and is not the intended final Android architecture.

## Confirmed domain behavior

### Structure and occupancy

Property → floor → room → bed relationships use foreign keys. Occupancy at a date uses `start_date <= date AND (end_date_exclusive IS NULL OR end_date_exclusive > date)`. Move-in checks property existence, bed existence/activity, bed/property hierarchy ownership, and overlapping assignments before writing. The cross-property guard is in the workflow; the schema does not enforce it for direct database writes.

### Tenant lifecycle and assignments

Tenant status is `ACTIVE` or `CHECKED_OUT`. Move-in writes tenant, assignment, rental term, optional deposit, and first obligation in one transaction. Bed shift closes the prior assignment at the shift date and opens the target assignment in one transaction. Checkout closes the active assignment and rental term, then updates tenant status/date in one transaction.

Confirmed rules: same-calendar-day shifts and checkout are rejected; an assignment must span at least one calendar day; Jan 10 to Jan 11 is a valid one-day assignment; rejected operations preserve database state. Current error names differ: shift throws `SHIFT_DATE_BEFORE_START_DATE`; checkout throws `CHECKOUT_DATE_MUST_BE_AFTER_START_DATE`. Tests are in `server/test/workflows/{shiftBedWorkflow,moveOutWorkflow}.test.js` and `server/test/audit/a05AssignmentIntervalRules.test.js`.

The later schema triggers enforce interval non-emptiness and prevent bed/tenant overlaps on direct inserts and relevant updates. Checkout treatment of future obligations remains unresolved; see the current [database reference](../database_schema.md) and [workflow reference](../workflows_and_queries.md).

### Billing, obligations, and payments

Rental terms use half-open date intervals. Billing periods preserve the joining-day anchor and clamp to shorter months. `dueDateOffsetDays` is accepted but unused; due date currently equals period start. Move-in creates its first obligation for the full `rentPaise`, without proration. These are observed mechanics; intended offset and proration policy remain undecided.

Payment collection validates date and positive integer paise, generates subsequent obligations when due, allocates FIFO by period start, due date, then ID, and leaves excess as unallocated credit. The idempotency branch compares tenant, amount, paid date, payment method, and reference note. Identical retries return the original payment; differing compared fields throw `IDEMPOTENCY_KEY_CONFLICT`. The workflow and rollback tests are in `server/test/workflows/collectPaymentWorkflow.test.js`.

Overdue comparisons use `due_date < asOfDate`; a due date equal to the as-of date is not overdue. Collection checks tenant existence but does not require ACTIVE status. No persisted credit account exists.

### Financial reporting: current mechanics, unresolved meaning

`getFinancialSummary` aggregates billed obligations, allocated amounts, outstanding balances, payments, and deposits across the property without a month filter; the supplied date affects occupancy and overdue status. `getPropertyOccupancyTree` selects obligations in the displayed cycle **or any obligation with a positive outstanding balance**. These are different scopes. The dashboard currently reads occupancy data and labels those values “Cycle Rent Obligations”. `useFinancials`, `MonthPicker`, and `FinancialSummaryCard` exist but are not currently wired into `PaymentsScreen`; that screen currently derives its outstanding queue from the active tenant directory.

No monthly total definition is inferred here. See [A-03 in the audit matrix](../AUDIT_TEST_MATRIX.md) and [decisions](../DECISIONS.md) before adding expected financial totals.

### Deposits

Deposits are HELD or SETTLED. A deposit has at most one settlement. Deductions require positive paise and a nonblank reason; deductions may exceed deposit, leaving a recorded liability. Collection of that liability is not implemented. See settlement workflow tests before treating any other deposit behavior as established.

## Domain validation and HTTP error mapping

Date utilities validate strict real `YYYY-MM-DD` calendar dates; mutation workflows call them. Amount workflows require positive integer paise where applicable. These are domain checks, independent of HTTP mapping.

The Express error handler maps known `.code` values to status codes and returns `{error:{code,message,details}}`; unmapped errors become generic 500 responses. Date utility errors do not set stable `.code`. The checkout workflow's current `CHECKOUT_DATE_MUST_BE_AFTER_START_DATE` is not in the status map (which contains the older `CHECKOUT_DATE_BEFORE_START_DATE`), so the HTTP adapter can return generic 500 for that domain rejection. Query date inputs lack route-level validation. This is a temporary API concern, tracked separately as A-07.

## Current HTTP API (`/api/v1`)

Mounted routes are in `server/src/routes/`. Success payloads are wrapped in `{data: payload}`.

| Method and path | Request | Observed success |
|---|---|---|
| GET `/properties` | none | 200 `{data: properties}` |
| POST `/properties` | `{name,address}` | 201 `{data: property}` |
| PATCH `/properties/:id` | `{name,address}` | 200 `{data: updatedProperty}`; absent property maps to 404 `PROPERTY_NOT_FOUND` |
| GET `/properties/:id/occupancy?date=` | optional date | 200 occupancy read model; missing property passes `PROPERTY_NOT_FOUND` |
| POST `/floors`, `/rooms`, `/beds` | structure fields | 201 `{data: createdRecord}` |
| DELETE `/floors/:id`, `/rooms/:id`, `/beds/:id` | none | 200 success when workflow permits deletion |
| PATCH `/beds/:id/toggle-active` | `{isActive}` | 200 bed or `BED_NOT_FOUND` |
| GET `/tenants` | property and optional filters | 200 tenant directory |
| POST `/tenants/move-in` | property/bed/tenant/date/amount fields | 201 created tenant, assignment, rental term, deposit, obligation |
| POST `/tenants/:id/shift-bed` | `{targetBedId,shiftDate}` | 200 closed and new assignments |
| POST `/tenants/:id/checkout` | `{checkoutDate}` | 200 updated tenant and closed assignment |
| POST `/tenants/:id/collect-payment` | amount/date/method and optional reference/idempotency/due override | 200 payment, allocations, credit, duplicate flag |
| POST `/tenants/:id/settle-deposit`, `/deposits/:id/settle` | optional deductions | 200 settlement result |
| GET `/tenants/:id/ledger` | none | 200 ledger |
| GET `/financials/summary?propertyId=&date=` | property and optional date | 200 financial summary |

There is no authentication/authorization layer. The API, CORS configuration, and error envelope serve the current prototype only. Do not expand them for Android unless the prototype requires it; any remote sync or multi-user target needs its own security design.
