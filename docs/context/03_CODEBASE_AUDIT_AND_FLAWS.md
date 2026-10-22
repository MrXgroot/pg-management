# Stay Ledger — Codebase Audit and Flaws

This is a static source audit of the checked-in client/server tree. Severity indicates likely impact, not proof of an exploit. The audit did not execute the app or tests. Only reproducible source observations are called defects; prompt examples were independently checked.

## Severe / high-risk correctness issues

### [High] Property financial rollup can multiply obligations

In `getPropertyOccupancyTree`, the property financial query joins `obligations` to tenants and a grouped allocation subquery, so allocations themselves do not fan out; that query is sound in that respect. However its date predicate includes **every outstanding obligation** through `OR outstanding > 0`, alongside the current-cycle conditions. Consequently the `summary.financials` totals mix month-selected rows with any outstanding historical rows and should not be described as monthly billed/collected totals. Rename/document as a combined operational balance or replace with explicitly separate month and arrears aggregates.

### [High] No database exclusion constraints for bed/tenant assignment overlap

The workflows check conflicts in application code, but schema has no unique/exclusion constraint. Concurrent requests can both observe a bed vacant and insert overlapping open assignments. better-sqlite3 serializes individual DB writes, but read/check/write transaction contention and busy handling must be validated under concurrency. Add DB-enforced reservation strategy or retry-safe serialized workflow and concurrency tests.

### [High] Checkout date can leave later-dated obligations/assignments inconsistent

Checkout checks date against assignment start, but does not reject a checkout date in the future relative to existing obligations or cap/remove obligations beyond checkout. `moveOutWorkflow` closes assignment/term at checkout and marks status, while historical obligations remain. Financial/ledger semantics for future obligations need explicit policy and fixtures.

### [Medium-high] Date validation is not uniformly applied

Workflow date fields are checked, but query date parameters (`occupancy`, financial summary) are used to construct month details and SQL comparisons without the same validation. Tenant directory relies on server UTC “today”. Invalid dates can yield malformed/odd month labels or misleading occupancy. Establish validated ISO dates and explicit timezone/as-of semantics at route boundaries.

### [Medium-high] Payment workflow permits inactive/checked-out tenant collection

`collectPaymentWorkflow` checks tenant existence but not `status === ACTIVE`. It may accept payment for a checked-out tenant and generate billing periods subject to historical term/checkout logic. Decide whether final arrears collection is allowed, encode the rule, and test both cases.

### [Medium-high] Idempotency key reuse is not payload-bound

If a key already exists, the workflow returns the original payment regardless of tenant, amount, date, or method in the retry request. This is safe from duplicate writes but can silently report success for a conflicting request. Store/compare a request fingerprint and return an explicit conflict on mismatch.

### [Medium] Structure endpoint validation is thin

Add floor/room/bed and property routes largely pass body fields through to repositories. Missing/invalid values can become SQLite constraint errors; names/uniqueness/display order rules are not consistently checked. Standardize payload validation and map DB errors to stable API errors.

## Query/data model concerns

- `getFinancialSummary` aggregates all-time obligations, payments, and deposits despite accepting `date`; only overdue and occupancy are date-sensitive. UI labels must not imply month-bounded revenue.
- Tenant directory chooses active assignment by date join but no schema constraint prevents multiple matching assignments; duplicated directory entries can result from corrupt/overlapping history.
- Allocation schema enforces positive amounts but not `SUM(allocation) <= payment.amount` nor `SUM(allocation) <= obligation.amount`. Workflows currently allocate bounded amounts, but direct writes/seed drift can violate balances.
- No DB constraint asserts assignment tenant's property matches bed's property; bed is connected to property indirectly through room/floor. Workflow move-in verifies property and bed existence but not that the bed belongs to the submitted property. This is a concrete cross-property integrity gap.
- Dates are text, so canonical zero-padded ISO strings are required for lexical ordering. Schema checks only obligation start/end ordering; other interval consistency is in policy/workflows.

## Architecture and maintainability

- The `client/src/App.jsx` file is an unused placeholder/default export while actual boot is `main.jsx` → app providers/router. This is confusing but not a runtime defect by itself.
- No `sheetStack` was found. Dashboard overlays are local selection state around a single bottom sheet; the requested stack-based navigation invariant is not implemented.
- `.jsx`/`.js` split is broadly followed; do not claim “broken JS returning JSX” based on scanned source. Named exports are used throughout production modules with the placeholder `App` as a default-export exception.
- `PropertyStateBridge` feeds query data into a provider as `initialProperties`; inspect provider synchronization carefully when property list changes. Having server state and context selection in the same provider can become stale if treated as copied state.
- Query keys include a filter object directly, so callers should canonicalize stable filter values and avoid accidental cache fragmentation.
- Several workflow modules import `../../../../server/db/connection.js` while the server code lives within `server/src`; imports resolve in this repository but are unusually coupled to directory layout and make moving modules difficult.

## UI/UX audit

- `/payments` is already an action-oriented collection queue: it filters tenants by outstanding/overdue, prioritizes balances, and opens collection form in a bottom sheet. Its completion state and usability on real devices still need verification; the pasted prompt's claim that it is analytics-only is not supported by current `PaymentsScreen.jsx`.
- `/dashboard` is the operational occupancy view and supports room/tenant sheets; `/tenants` is directory/filter oriented. Verify one-tap collection and cross-navigation consistency in product review.
- `/properties/manage` includes structure management components, and `/more` includes property details, policy settings, export, and system info. Do not describe them as wholly absent; assess CRUD completeness and error handling individually.
- `rounded-[32px]` arbitrary Tailwind syntax is used, and `rounded-32` is also supported by custom config. The pasted “broken arbitrary CSS” example is not substantiated. Tailwind 4 configuration compatibility and actual dark-mode behavior deserve build/browser verification; no provider-based theme manager is obvious, while multiple components provide a theme toggle/class styling.
- Many screens use `select-none` on broad containers and dense small text; inspect touch accessibility, keyboard semantics, focus management, and contrast on devices. This source review alone cannot certify accessibility.

## Seeding and fixture gaps

`server/db/seed.js` provides one property, three floors, 6 rooms, mixed active/inactive beds, eight tenants, current and checked-out assignments, terms, multiple obligation/payment states, one split payment, held deposits, and one settled deposit with two deductions. It is more than a trivial happy path. Gaps include:

- no second property to prove property isolation or prevent cross-property bed assignment;
- no multiple successive bed shifts for one tenant or same-day boundary transition;
- no payment with true unallocated advance credit, despite comments describing rollovers; the seeded payments are allocated fully;
- no partially allocated payment plus subsequent credit rollover, or multiple payment allocations against one obligation edge cases;
- no deposit deduction exceeding deposit, full deduction/no refund, zero-deduction settlement, or remaining liability case;
- inactive bed has no historical assignment; no occupied bed is deactivated;
- no overlapping assignment/term, duplicate request, conflicting idempotency payload, invalid date, or cross-property adversarial fixtures;
- hard-coded dates become stale and `INSERT OR IGNORE` can leave old fixture state in place rather than reset to deterministic baseline.

## Suggested audit follow-up

Prioritize integrity and error behavior before UI polish: property-bed ownership validation, assignment conflict guarantees, contract validation, financial semantics, date rules, and idempotency conflicts. Turn each confirmed issue into focused regression coverage before changing business rules.
