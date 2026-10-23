# Workflows and queries

This is a source-backed summary of current code, not a promise that every current calculation is settled product behavior. Routes and envelopes are catalogued in the [API transport contract](API_TRANSPORT_CONTRACT.md).

## Write workflows

| Workflow | Current operation |
| --- | --- |
| `moveInWorkflow.js` | Validates property, bed ownership/activity/availability and inputs; transactionally inserts tenant, assignment, rental term, optional deposit and initial full-rent obligation. |
| `shiftBedWorkflow.js` | Requires active tenant and assignment, a different active vacant target bed, and a shift date strictly after current assignment start; transaction closes old assignment and inserts new assignment. The target property's ownership is not checked. |
| `moveOutWorkflow.js` | Requires a valid checkout date after assignment start and an active tenant/assignment; transaction closes assignment and active rental term and marks tenant checked out. Does not settle deposits or rewrite obligations. |
| `collectPaymentWorkflow.js` | Validates payment; checks idempotency key; generates missing monthly obligations; optionally updates the first outstanding due date; computes FIFO allocations for this submitted payment; inserts payment and allocations transactionally. |
| `settleDepositWorkflow.js` | Validates deposit state and deductions; transaction inserts settlement/deduction rows and marks deposit settled. |
| `manageStructureWorkflow.js` | Creates structure, guarded floor/room deletion, guarded bed deletion and bed deactivation. |

For the same key, payment retries are compared on tenant, amount, payment date, method, and reference note; matching retries return the existing payment. Conflict on those compared fields throws `IDEMPOTENCY_KEY_CONFLICT`. The optional next due-date override is not part of this comparison. See [audit test matrix](AUDIT_TEST_MATRIX.md).

Multi-row workflows use `better-sqlite3` transactions. Repository writes participate in the caller transaction where applicable; schema triggers also reject invalid/overlapping assignments on direct insert/update. Trigger and transaction details are in [database schema](database_schema.md).

## Read queries

- `occupancyQueries.js` returns property/floor/room/bed hierarchy, assignment active on the requested date, tenant balances, and cycle/payment summary. Cycle label is the calendar month containing the target date. Its financial summary combines obligations in that calendar month with all outstanding obligations, so it is not a clean monthly-only financial definition.
- `tenantQueries.js` returns directory rows with filters, active bed details and derived obligation/payment balances. Default date is UTC current date.
- `ledgerQueries.js` combines tenant obligations, payments, allocations, assignment history and deposit activity into a ledger projection.
- `financialQueries.js` computes property-wide lifetime billed, collected, outstanding, credit, held deposits, and settled deposits; overdue is evaluated against an as-of date. The date does not select a financial month.

The query shapes describe current code. Reporting semantics need product decisions; see [open questions](OPEN_QUESTIONS.md).

## Known gaps and behavior needing decisions

- Billing `dueDateOffsetDays` is accepted but ignored; due date equals period start.
- Move-in obligation is full rent even for partial calendar periods; no proration rule exists.
- Obligation generation may extend beyond checkout and checkout does not truncate obligations.
- Pre-existing unallocated payment credit is not allocated when a later obligation is generated.
- `paymentAllocationRepo` and schema do not enforce aggregate payment/obligation allocation ceilings or tenant matching.
- A due-date override mutates the selected existing obligation's due date; it is not limited to future periods by repository validation.
- Shift checks target availability but not property ownership.
- Deposit liability above deposit is recorded, but no collection workflow exists.

Do not treat these observations as intended rules without resolving the decisions listed in [open questions](OPEN_QUESTIONS.md).
