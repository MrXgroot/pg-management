# Business rules and policies

This reference separates confirmed rules from current code behavior and undecided product semantics. Historical tenant, occupancy and financial records should not be silently rewritten.

## Confirmed rules and implemented invariants

- Dates are strict calendar strings `YYYY-MM-DD` at workflow boundaries.
- Occupancy assignments use half-open intervals `[start_date, end_date_exclusive)`. A closed assignment requires start before end; a null end is open. Adjacent intervals do not overlap. Assignments must span at least one calendar day; Jan 10 through Jan 11 is a valid one-day interval.
- Same-calendar-day checkout and same-calendar-day bed shifts are rejected. A rejected workflow operation must leave no partial database changes.
- Money is represented in integer paise. Rent, payment, deposit, allocation and deduction inputs are expected to be positive integer amounts; calculated amounts may be zero where the schema permits.
- Hierarchy is Property → Floor → Room → Bed. Move-in checks that the bed belongs to the selected property. Existing assignment history prevents bed deletion; deactivation is available.
- Move-in writes tenant, assignment, rental term, optional deposit and initial obligation in one transaction. Shift closes the original assignment and inserts the target assignment on the shift date atomically. Checkout closes the active assignment, changes tenant status/date and closes the active rental term atomically.
- Payment idempotency key is unique in SQLite. A retry matching the workflow's compared payload returns the original payment. Current comparison checks tenant, amount, date, method and reference note; it does not compare the next due-date override.
- Deposit settlement is atomic and one settlement per deposit is enforced. The pure policy calculates `refund = max(0, deposit − deductions)` and `remaining liability = max(0, deductions − deposit)`.

## Current billing and allocation mechanics (not all settled intent)

- `dateUtils.js` supports anchored month addition with target-month clamping (e.g. Jan 31 → Feb 28/29 → Mar 31).
- `billingPolicy.js` returns the next monthly interval and currently sets due date to period start. Its `dueDateOffsetDays` argument is unused. Checkout comparison checks whether period start is before checkout; generation can therefore produce a period whose end is after checkout.
- Move-in creates the first obligation at full rent from joining date; no proration is performed.
- Collection generates periods until the latest obligation boundary reaches the paid date, using rental terms selected by period start where possible. It allocates the submitted payment FIFO across outstanding obligations. Any remainder is unallocated credit derived from totals; existing credit is not automatically applied when new obligations are generated.
- FIFO ordering is `period_start`, then `due_date`, then `id`. Allocation policy calculates current payment allocations but the database does not enforce aggregate allocation caps.
- Checkout does not remove future obligations already recorded. Future obligation cap/proration behavior remains unresolved.

## Deposits and history

Deposits are stored separately from rent payments and rent allocations. Deduction rows require a positive amount and nonblank reason. Settlement can produce a liability larger than the deposit; the application does not implement collection of that liability. Checkout does not require immediate deposit settlement. Corrections to historic financial records have no explicit reversal workflow yet.

## Policy modules

- `dateUtils.js`: strict dates, month anchoring, interval overlap helper.
- `billingPolicy.js`: next monthly interval calculation.
- `allocationPolicy.js`: FIFO allocation plan.
- `depositPolicy.js`: deduction/refund/liability calculation.

The implementation and database contract are detailed in [database schema](database_schema.md) and [workflows and queries](workflows_and_queries.md). Decisions still needed are listed in [open questions](OPEN_QUESTIONS.md).
