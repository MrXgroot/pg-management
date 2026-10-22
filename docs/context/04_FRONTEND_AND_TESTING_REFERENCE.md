# Frontend and Testing Reference

## Routes and screens

Router source: `client/src/app/router.jsx`; shell: `layouts/AppLayout.jsx`, `TopAppBar.jsx`, `BottomNavbar.jsx`.

| Route | Screen and observed interactions |
|---|---|
| `/dashboard` | occupancy dashboard with property/floor selection, room grid/cards, cycle metrics; `DashboardBottomSheet` has `sheetStack` views for room beds, tenant actions, move-in, shift, collect, ledger, checkout. Stack resolves room/bed from in-memory occupancy data. |
| `/tenants` | tenant directory, search/filter tabs/list/cards. Uses property-scoped directory query. |
| `/payments` | outstanding/overdue collection queue with search, chips, priority sorting, collection sheet; summary and transaction/financial components also exist. |
| `/properties/manage` | property hub/detail and floor/room/bed management sheets/modals. UI for property update exists, but matching server PATCH route is absent. |
| `/more` | property details, policy settings, export section, system information. Actual persistence of each displayed policy value requires per-control verification; no server settings API is listed. |

These are source-presence statements. No browser/device QA was performed in this docs-only audit.

## State, APIs, loading and error handling

`AppProviders` creates one QueryClient (stale 2 minutes, retry once, no focus refetch) and provides property state. `PropertyContext` stores selected property ID in localStorage and falls back to first fetched property if saved ID is stale. Read hooks cover properties, occupancy, financial summary, tenant directory, ledger. Mutation hooks cover move-in, payment collection, checkout/deposit settlement, shift, property/floor/room/bed creation, bed deletion/toggle. Axios base is `/api/v1`; Vite dev proxy sends API to localhost:4000.

Screens include loading/error/empty states in some paths; there is no global React error boundary observed. BottomSheet handles overlay UI; `DashboardBottomSheet` has explicit stack/back behavior. Other screen sheets manage selected entity locally, so state is not a single app-wide navigation stack.

## Query keys and invalidation

Canonical keys are in `client/src/api/queryKeys.js`: properties all/detail/occupancy/financials; tenants all/list/ledger. Occupancy/financial key date fallback is literal `latest`. Mutations invalidate by key prefix; payment/checkout/shift invalidate property occupancy+financials and tenant family/ledger. Structure mutation invalidation is uneven; no dedicated payments key exists. Detailed DB/query semantics are in [database/core reference](03_DATABASE_AND_CORE_REFERENCE.md).

## Styling and frontend concerns

Tailwind v4 CSS-first import is in `index.css`, including `@variant dark`, custom `@theme` tokens and utilities. Config also defines custom theme; dark class support is explicit. `TopAppBar` provides a theme toggle path (verify persisted/root-class behavior during UI QA). `client/README.md` is the generic Vite template, not reliable product documentation. No TypeScript or client test script is configured.

## Available test/build/lint commands

From `server/`: `npm test` runs `vitest run`; `npm run test:watch` runs Vitest watch; `npm run seed` writes to the default SQLite DB and must not be used casually during a read-only audit. Tests use Node environment and helper-created in-memory DBs for isolated coverage. From `client/`: `npm run build` runs Vite build; `npm run lint` runs ESLint; `npm run dev` starts Vite; `npm run preview` previews build. No type-check script or CI workflow was found in the repository inventory.

## Existing test coverage (not run in this audit)

- Workflows: move-in atomic rollback/occupied/inactive; payment FIFO/partial/excess/duplicate key/due override; shift occupied/normal; checkout basic/already checked out; deposit refund/liability/already settled.
- Queries: occupancy tree hierarchy and bed statuses/live balances.
- Repositories: structure CRUD constraints and domain repository operations.
- DB integration: seed state, selected FK restrictions, unique intervals/idempotency, obligation period, positive amounts.
- Gaps: API route/envelope/error tests, frontend behavior/E2E, concurrency, move-in property-bed mismatch, same-date zero-length assignment, conflicting idempotency payload, date query validation, timezone boundaries, migrations/restore, Android parity, complete property financial scope.

Commands were documented, not executed here. There are no results asserted by this document.
