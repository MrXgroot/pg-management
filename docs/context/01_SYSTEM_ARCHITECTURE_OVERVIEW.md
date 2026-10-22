# Stay Ledger — System Architecture Overview

## Executive summary

Stay Ledger is a mobile-first property/PG operations application. It tracks property structure, occupancy, tenant rental terms, rent obligations, payments and allocations, security deposits, and checkout settlements. Its domain is **Properties → Floors → Rooms → Beds → Tenants → Assignments/Rental Terms → Obligations → Payments/Allocations → Deposits/Settlements**. An assignment is the temporal link between tenant and bed; historical assignments are retained. The code suggests property managers/operators as primary users. There is no authentication or role model in this repository.

## Stack (verified from manifests/config)

- Client: React 19, Vite 8, React Router 7, Axios, TanStack Query 5, lucide-react 1.55.
- Styling: Tailwind CSS 4.3 with `@tailwindcss/vite`; `client/tailwind.config.js` defines custom brand/surface colors, shadows, font, and radius values. `darkMode: "class"` is configured. The root stylesheet should be consulted before changing the Tailwind integration.
- Server: Node ESM, Express 4, better-sqlite3 11.8; CORS and JSON middleware. API prefix is `/api/v1`.
- Storage: SQLite schema is initialized from `server/db/schema.sql` when `getDatabase` opens the DB. Foreign keys, WAL, and 5-second busy timeout are enabled. No separate migration framework/version table is present; schema changes currently rely on `CREATE TABLE/INDEX IF NOT EXISTS`.
- Tests exist under `server/test/` using Vitest; no client test suite is present in the observed tree.

## Layers and code conventions

Server layers are Express routes → core workflows/queries → repositories and policies → SQLite. Workflows wrap multi-row mutations with `db.transaction`; queries build read models. Client layers are route screens → components/sheets/workflow forms → data hooks → Axios API client. `AppProviders` installs QueryClient and property state; `PropertyContext` tracks selected property.

Most JSX files use `.jsx`; pure modules use `.js`, and exports are predominantly named. Exceptions include `client/src/App.jsx`, a placeholder default-export component not used by `main.jsx`/router. Prefer `.jsx` for JSX and `.js` for pure logic; follow existing named-export conventions.

## Five architectural invariants

1. **Keep layers distinct.** Screens render and coordinate; hooks own network/query state; workflows own transactional domain rules; repositories own SQL persistence; policies own reusable calculations.
2. **Preserve temporal history.** Assignment and rental-term intervals use inclusive `start/effective_from` and exclusive `end_date_exclusive/effective_to_exclusive`. Do not overwrite historical rows to represent moves or term changes.
3. **Money is integer paise.** SQLite columns and API fields ending `Paise` represent integer paise. UI conversion belongs at the display/input boundary (`formatPaiseToRupees`, `parseRupeesToPaise`). Never persist rounded rupees or mix units.
4. **Transactions guard multi-row workflows.** A failed workflow must not leave partial tenant/assignment/term/deposit/obligation/payment/settlement state. Preserve the synchronous better-sqlite3 transaction boundary.
5. **Cache and overlays follow existing contracts.** TanStack keys come from `client/src/api/queryKeys.js`; mutation hooks invalidate affected families. Dashboard detail navigation is implemented with local selected-sheet state and a `BottomSheet`, not a `sheetStack` engine. Do not describe or build a stack unless one is added intentionally.

## Client navigation and data flow

`client/src/app/router.jsx` defines `/dashboard`, `/tenants`, `/payments`, `/properties/manage`, `/more`, redirects `/` to dashboard, and renders a not-found screen. `AppLayout` provides the app shell and bottom navigation. Data hooks in `client/src/data/` call the Axios client (base `/api/v1`); server responses use `{data: ...}` and the response interceptor unwraps that envelope. Dashboard opens room/tenant/payment-related overlays through `BottomSheet` and local state. No `sheetStack` identifier was found in `client/src`.

## Main domain data relationships

Properties own floors; floors own rooms; rooms own beds (beds can be inactive). Tenants belong to one property and have status `ACTIVE` or `CHECKED_OUT`. Assignments connect tenants to beds across date intervals. A tenant can have rental terms and obligations over time. Payments belong to tenants and allocate against obligations; unallocated payment value is represented as advance credit in read models. Deposits belong to tenants and can be settled once, with deductions and refund/liability totals.

## Operational caveats

There is no authentication/authorization, server-side schema validation framework, formal migration runner, or API version negotiation visible in this codebase. Treat those as current scope gaps, not implicit guarantees. The database defaults to `server/db/stay_ledger.db`; avoid committing generated runtime data.
