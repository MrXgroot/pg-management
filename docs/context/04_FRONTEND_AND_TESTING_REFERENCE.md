# Frontend and testing reference

## Current client

The React/Vite client is a browser application. Routes are declared in `client/src/app/router.jsx`; providers install TanStack Query and property context. Screens are in `client/src/screens/`, UI workflows in `client/src/workflows/`, query/mutation hooks in `client/src/data/`, and Axios configuration in `client/src/api/httpClient.js`.

| Route | Current screen |
|---|---|
| `/dashboard` | Property occupancy, cycle summary, rooms/beds, and stacked workflow sheets. |
| `/tenants` | Property-scoped tenant list/search/filter. |
| `/payments` | Active-tenant outstanding queue and payment sheet. |
| `/properties/manage` | Property and physical structure management. Property edit sends a PATCH request. |
| `/more` | Property details, policy display, export and system information components. Persistence is not established for every displayed setting. |

The dashboard uses `useOccupancy`; the collection queue uses `useTenantDirectory`. `useFinancials`, `MonthPicker`, and `FinancialSummaryCard` exist but are not wired into the current `PaymentsScreen`. Do not describe a selected-month financial screen as currently active.

## Data flow and UI state

Read and mutation hooks call Axios under `/api/v1` and use centralized query keys, with some literal invalidation prefixes. The property selection is stored in localStorage. Dashboard sheet navigation uses a local stack over cached occupancy data. This is web-client behavior, not a shared domain service.

## Test inventory

From `server/`, `npm test` runs Vitest; `npm run test:watch` starts watch mode. The in-memory SQLite fixture is `server/test/helpers/testDb.js`.

- `server/test/workflows/`: move-in, checkout, shift, payment, deposit settlement.
- `server/test/repos/`: structure and domain repository operations.
- `server/test/queries/`: occupancy query/read model.
- `server/test/db/`: selected schema and database integration constraints.
- `server/test/routes/`: property update route contract exercised with handler/middleware mocks (not a real-socket test).
- `server/test/audit/`: targeted audit scenario not already adequately covered elsewhere.

The latest recorded full run was `npm test` on 2026-10-23: 11 test files and 67 tests passed. That result includes the route and dedicated audit test files. This documentation audit did not rerun tests.

From `client/`, `npm run build` runs Vite and `npm run lint` runs ESLint. No client test script, end-to-end harness, CI workflow, Android parity suite, migration test, or backup/restore test was found. See [audit matrix](../AUDIT_TEST_MATRIX.md) for coverage and limits.

## Confirmed test boundaries and gaps

Workflow tests verify selected normal, rejection, idempotency, and rollback scenarios. They do not prove protection against concurrent overlap races, direct database writes that bypass workflows, UI behavior, browser/mobile lifecycle, migration, or recovery. Financial totals are tested only for current mechanics; product definitions are pending. Avoid treating a passing server suite as Android parity evidence.
