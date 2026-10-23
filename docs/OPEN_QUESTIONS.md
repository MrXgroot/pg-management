# Open product and architecture questions

These questions are unresolved. Current implementation mechanics described elsewhere are not automatically product decisions. Do not encode candidate answers as requirements until the product owner chooses them.

## A-03: Financial summary scope

Decide, metric by metric, whether “billed”, “collected”, “outstanding”, “overdue”, and deposits are lifetime totals or period-scoped; which date assigns payments to a period; how historic arrears and advance credit are shown; whether checked-out tenants are included; and whether deposits are part of financial totals. Current `financialQueries.js` aggregates billed, collected, outstanding, credit and deposits across all tenant history for the property; the as-of date affects occupancy and overdue comparison, not financial aggregation period. `occupancyQueries.js` uses current calendar month membership plus all unpaid obligations. These are observed mechanics, not settled semantics.

Candidate tests after decisions: same property with payments/obligations spanning month boundaries; payment date versus obligation-period attribution; arrears and advance crossing month boundaries; checked-out tenant inclusion; held versus settled deposit totals. Current tests should assert shape/arithmetic only where semantics are not disputed.

## A-06: Billing, due dates, proration, checkout

- Should `dueDateOffsetDays` affect due dates? Current policy accepts but ignores it, and due date equals period start.
- Should initial/terminal partial periods be prorated, and what day-count convention applies?
- Are month-end cycles anchored to original move-in day with clamping, as current date helper does?
- What happens to already generated future obligations on checkout?
- What should payment receipt trigger when periods are generated beyond checkout? Current collection can generate an interval ending after checkout.
- Which rental term should apply when a generated period crosses a rent change boundary?

## Other domain questions

- May payments be collected after checkout?
- Can an inactive bed have a current assignment, and how should it appear?
- Which timezone defines “today” for directory/financial as-of defaults? Current defaults use UTC ISO date.
- What is the operational handling for deductions exceeding the deposit and the resulting liability?
- Should retries with an idempotency key compare `nextDueDateOverride`? Current duplicate comparison excludes this field.
- Should a shift bed always belong to the tenant's property? Move-in checks same property; shift currently checks target availability but does not check property ownership.

## Android and deployment

- Is Android standalone and offline-only, or will synchronization/multiple users be required?
- Select UI/runtime and local persistence only after device support, data ownership, backup/export/restore, encryption, and migration requirements are clear.
- If a remote API remains, define identity, authorization/tenant scoping, transport protection, CORS policy, deployment boundary, and conflict handling.
- Define import from existing SQLite data, schema upgrades, rollback and recovery behavior.
