# Prioritized Audit Findings

Static source audit of this working tree. Findings distinguish confirmed contract gaps from concurrency/semantic risks. No app was run, no database changed, and no tests were executed during this docs task.

## A-01 — Move-in does not verify bed belongs to property

- **Severity/category:** High — data integrity.
- **Evidence:** `server/src/core/workflows/moveInWorkflow.js`, `moveInWorkflow`; checks property exists and bed exists/active, then inserts tenant using `propertyId` and assignment to `bedId`. No relationship check connects the selected bed’s room/floor property to submitted property.
- **Actual vs expected:** A tenant can be created under property A and assigned a bed structurally under property B. Cross-property assignment is not blocked by schema either.
- **Impact:** Property occupancy and tenant directory can disagree about ownership; data isolation/reporting becomes unreliable.
- **Next action/tests:** Verify hierarchy ownership in the workflow or enforce equivalent domain constraint; test cross-property move-in rejection. **Android blocker:** yes, preserve this invariant at local persistence boundary.

## A-02 — Client property update has no server contract

- **Severity/category:** High — API/UI consistency.
- **Evidence:** `client/src/data/properties/usePropertySettings.js`, `useUpdateProperty`, sends PATCH `/properties/${propertyId}`. `server/src/routes/propertyRoutes.js` declares GET/POST properties and occupancy, but no PATCH `/properties/:id`.
- **Actual vs expected:** Calling this mutation reaches route 404, despite client code offering the operation.
- **Impact:** Property edit UI cannot complete through the present API.
- **Next action/tests:** Either remove/disable unsupported client operation or implement and document the server contract in a separately authorized feature change; add API contract test. **Android blocker:** transport mismatch itself no; the underlying property edit behavior decision should be settled.

## A-03 — Financial summary and occupancy totals have mixed scopes

- **Severity/category:** High — financial accuracy / documentation drift risk.
- **Evidence:** `financialQueries.js`, `getFinancialSummary`, aggregates all obligations/payments/deposits for property; date affects occupancy and overdue comparison only. `occupancyQueries.js` property financial query includes current-cycle predicates OR any outstanding balance.
- **Actual vs expected:** A date/month-selected screen can display lifetime totals, while occupancy totals can include outstanding historic obligations in current-cycle figures.
- **Impact:** Users may interpret lifetime/combined values as month revenue or collections.
- **Next action/tests:** Obtain product definition for each financial card, name scopes, add bounded-date calculation and tests after rule decision. **Android blocker:** yes, financial parity needs exact definitions.

## A-04 — Idempotency key retry does not verify payload identity

- **Severity/category:** Medium-high — financial integrity.
- **Evidence:** `collectPaymentWorkflow.js`, idempotency branch calls `findByIdempotencyKey` then returns the existing payment without comparing tenant, amount, paid date, or method.
- **Actual vs expected:** A different request reusing a key is treated as a successful duplicate of the original request.
- **Impact:** Client key reuse bugs can silently acknowledge an unrelated payment.
- **Next action/tests:** Persist or derive a canonical request fingerprint and reject mismatched reuse; test same payload replay and conflicting payload. **Android blocker:** yes if idempotency remains part of offline/retry behavior.

## A-05 — Assignment overlap relies on application checks; interval bounds are not schema-checked

- **Severity/category:** High risk — concurrency/data integrity.
- **Evidence:** `assignmentRepo.findOverlapsForBed` is called in move-in/shift, but schema has no exclusion/unique constraint or `CHECK(start_date < end_date_exclusive)`. Shift/checkout reject date `< start`, not `<= start`.
- **Actual vs expected:** Concurrent check-then-write can race; shift/checkout at exact assignment start can create a zero-length historical assignment. This is a source-derived risk, not reproduced concurrency evidence.
- **Impact:** Overlapping or invalid intervals can make as-of occupancy ambiguous and corrupt history.
- **Next action/tests:** Decide same-day semantics, enforce interval bounds and serialize/guard conflicting writes; test same-date and concurrent move-ins. **Android blocker:** yes, local transaction/constraint semantics must preserve occupancy integrity.

## A-06 — Billing period parameter and proration intent are unresolved

- **Severity/category:** Medium — financial rules.
- **Evidence:** `billingPolicy.js`: `dueDateOffsetDays` accepted but unused and `dueDate=currentPeriodStart`; move-in creates full `rentPaise` obligation from joining date to next anchor. No proration logic in this policy.
- **Actual vs expected:** Code behavior is deterministically full rent for first obligation; whether product expects this is not established.
- **Impact:** Billing may not match an intended proration/due-date policy.
- **Next action/tests:** Product owner confirms policy before changing it; add anchor/clamp/proration and due date tests. **Android blocker:** yes, parity needs a decision.

## A-07 — Missing route validation and generic error mapping

- **Severity/category:** Medium — API robustness.
- **Evidence:** Route handlers mostly pass request bodies directly to workflows/repos; `errorHandler.js` recognizes a fixed list while date utility throws descriptive messages without stable `.code`; query date params are not validated at route boundary. Unknown and DB errors become generic 500.
- **Actual vs expected:** Malformed inputs can result in inconsistent response codes/messages or opaque 500s.
- **Impact:** Client cannot reliably present field errors/retry vs conflict.
- **Next action/tests:** Define request schemas and stable error-code contract; cover malformed dates, missing fields, enum/constraint failures. **Android blocker:** HTTP mapping is temporary; domain validation is not.

## A-08 — No authentication/authorization and permissive CORS

- **Severity/category:** High before network exposure — security.
- **Evidence:** `app.js` calls `cors()` without origin policy; no auth middleware or user/role model is present in source tree.
- **Actual vs expected:** API endpoints are unauthenticated in current implementation.
- **Impact:** If exposed beyond trusted local environment, anyone who can reach it may read or mutate tenant/financial data.
- **Next action/tests:** Establish deployment threat model and access-control requirements before remote/multi-user deployment. **Android blocker:** standalone local target may change boundary; cloud sync/multi-device does not remove need.

## A-09 — Android portability boundary is not isolated

- **Severity/category:** High — architecture/portability.
- **Evidence:** workflow/query modules import Node `crypto` and `server/db/connection.js`; DB connection uses `node:fs`, `node:path`, `node:url`; persistence is `better-sqlite3`. Current “core” therefore requires Node and a server-local DB file.
- **Actual vs expected:** Server core cannot be embedded unchanged in Android.
- **Impact:** Migration is a port/rearchitecture, not just moving current folder into an Android app.
- **Next action/tests:** Extract behavior contracts and parity fixtures, identify runtime-neutral domain layer, compare candidate Android persistence/runtime options only after requirements gathering. **Android blocker:** yes.

## A-10 — Test coverage is server-side and does not cover transport/client or migration

- **Severity/category:** Medium — testing.
- **Evidence:** tests exist for workflows, repositories, occupancy query, DB constraints; no client test script, route test directory, E2E harness, or CI workflow found in repository inventory.
- **Actual vs expected:** Business behavior has focused unit/integration coverage but HTTP/client flows and Android parity are unverified.
- **Impact:** API-client mismatch and cross-screen cache/UI defects escape current coverage.
- **Next action/tests:** Add API contract tests and behavior parity suite before core extraction; add E2E once test infrastructure and business rules are agreed. **Android blocker:** yes for claiming parity.

## Other open questions (not confirmed defects)

- Should collecting arrears from a checked-out tenant remain allowed? Workflow checks existence only; generation uses checkout date.
- Should move-in to the last day/month edge create full rent or prorate?
- Should checkout cap future obligations or retain them as ledger claims?
- Should inactive beds with a current assignment be allowed, and how should UI represent them?
- Does tenant directory's UTC “today” match property/operator local calendar?

## Scope not verified

No deployment/CI files appeared in the enumerated tree; no Android project, backup tool, auth model, browser/device QA, concurrency run, or test execution was inspected/performed. See [frontend/testing](04_FRONTEND_AND_TESTING_REFERENCE.md) for test inventory.
