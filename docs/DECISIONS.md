# Decisions and unresolved questions

This page is the decision register. For current mechanics see [business rules](business_rules_and_policies.md), [workflows](workflows_and_queries.md), and the [audit matrix](AUDIT_TEST_MATRIX.md). Do not treat an implementation detail as product intent unless listed as confirmed below.

## Confirmed rules

- Money uses integer paise; dates use strict `YYYY-MM-DD` calendar dates.
- Assignment intervals are half-open `[start, end)`. Closed intervals require start before end; one-day intervals are valid; adjacent assignments do not overlap.
- Same-day checkout and bed shifts are rejected. Rejected operations must not partially modify the database.
- Payment allocation currently uses FIFO by period start, due date, then ID. The algorithm is observed; whether that ordering is final product policy is not independently settled.
- The target direction is a standalone Android application, but deployment details and migration plan are not selected.

## Observed mechanics, not product decisions

- Move-in creates the first obligation at full rent from joining date; proration is undefined.
- Billing due date currently equals period start; `dueDateOffsetDays` is accepted and unused.
- Financial summary query totals are lifetime aggregates; occupancy query combines current-cycle and all outstanding obligations.
- Payment retry compares tenant, amount, date, method, and reference note; due-date override is not compared.
- Assignment integrity triggers currently enforce non-empty closed intervals and prevent bed/tenant overlaps in SQLite.
- Current service is Node/Express/SQLite; this does not settle Android language/framework/database or whether remote sync is needed.

## Decisions needed

### Financial reporting (A-03)

For each metric, decide lifetime versus monthly scope, payment-date versus obligation-period attribution, treatment of historic arrears/advance, checked-out tenants, and held/settled deposits. Also decide whether dashboard cycle values include all outstanding obligations.

### Billing and proration (A-06)

Decide whether due-date offset applies and its calculation; first/last partial-period proration and day-count convention; month-end anchor behavior; and treatment of obligations across checkout and rent-term boundaries.

### Other domain questions

- Are payments accepted after checkout?
- Should a same idempotency-key retry compare `nextDueDateOverride`?
- Must a shift target bed belong to the tenant's property?
- Can inactive beds have current assignments?
- Which timezone defines default “today”?
- How is liability from deductions above the deposit collected?
- What explicit reversal/correction process preserves the original financial record?

### Android and deployment

Decide standalone offline use versus remote sync/multiple users; device authentication and local data protection; backup/export/restore; target UI/runtime and persistence; SQLite import, version upgrades and rollback; and, only if remote API remains, identity, authorization, transport protection and conflict handling.
