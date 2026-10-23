# Testing

The server uses Vitest (`server/package.json`, `npm test` → `vitest run`). Tests use the shared database helper in `server/test/helpers/testDb.js`, which creates isolated SQLite databases and initializes the actual schema. The current repository has no browser component or end-to-end test harness.

## Commands

From `server/`:

```powershell
npm test
npm test -- test/audit
npm test -- test/workflows/moveInWorkflow.test.js test/workflows/collectPaymentWorkflow.test.js
```

`npm test -- ...` passes paths to Vitest. No client test script is currently defined.

## Test inventory

- `test/audit/`: dedicated A-05 assignment interval scenarios and A-06 billing boundary scenarios.
- `test/db/db_integration.test.js`: database constraints/foreign keys and initialization behavior.
- `test/repos/`: domain and structure repository operations.
- `test/queries/occupancyQueries.test.js`: occupancy projection behavior.
- `test/routes/propertyRoutes.test.js`: property update route success and missing-property behavior. It invokes route and middleware without binding an HTTP socket.
- `test/workflows/`: move-in, payment collection/idempotency, checkout, bed shift and deposit settlement scenarios.

## Existing coverage highlights

- Move-in includes valid creation, invalid/missing/inactive/occupied resources, cross-property bed rejection and rollback assertions.
- Collection covers partial/excess allocation, FIFO order, identical retries, and conflicts for tenant, amount, date and method. Reference-note conflict and due-date-override conflict are not separately covered.
- A-05 audit tests exercise one-day and adjacent assignments, direct invalid insert, bed/tenant overlaps, updates, open-ended intervals, and trigger initialization. Workflow tests cover same-day checkout and shift rejection with unchanged state.
- Deposit workflow tests cover deduction/refund/liability calculations, repeat settlement, invalid input and rollback.
- Query coverage is concentrated on occupancy. There are no full API socket, client-render, end-to-end, Android device, migration, or synchronization tests.

## Interpreting results

A passing test demonstrates only the named behavior at that boundary. It does not establish unresolved financial semantics, Android portability, remote security, or complete data migration. Audit status and remaining work are tracked in [AUDIT_TEST_MATRIX.md](AUDIT_TEST_MATRIX.md); documented decisions remain in [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md).
