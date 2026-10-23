# Stay Ledger context primer

Stay Ledger manages property structure, tenant occupancy, rental obligations and collections, deposits, and ledger history. The codebase currently runs as a React web client with an Express/Node server and SQLite database. The intended direction is a standalone Android app with local persistence; that target is not implemented.

## Current stack

- Client: React 19, Vite 8, React Router 7, Tailwind CSS 4, TanStack Query 5, Axios.
- Server: Node.js ES modules, Express 4, better-sqlite3 11.
- Storage: SQLite, schema in `server/db/schema.sql`; initialized on connection open. No versioned migration system is present.
- Tests: Vitest, server-side only, using in-memory SQLite fixtures.

Versions above are package manifest declarations, not an independent audit of the installed runtime.

## Repository map

- `client/src/app`, `screens`, `layouts`, `components`, `workflows`: web composition and UI.
- `client/src/data`, `api`, `context`: query/mutation hooks, HTTP client, selected-property state.
- `server/src/routes`: temporary HTTP adapters.
- `server/src/core/workflows`, `queries`, `repos`, `policies`: use cases, read models, SQL access, and calculations.
- `server/db`: schema, connection, and seed script.
- `server/test`: workflow, repository, query, database, route, and audit tests.
- [Documentation index](../README.md): maintained project documentation.

## Confirmed domain rules

- Money is represented in integer paise.
- Assignment and rental-term intervals use `[start, end)` semantics.
- Same-calendar-day checkout and bed shifts are rejected by current workflows. A Jan 10 to Jan 11 assignment is valid; workflow tests verify rejected operations do not partially change the relevant records.
- Multi-write move-in, checkout, bed-shift, payment, and deposit-settlement workflows use SQLite transactions.
- Move-in checks that the bed belongs to the submitted property. The schema itself does not enforce cross-property consistency.
- An idempotency key replay returns the prior payment only when the compared request fields match; conflicting fields throw `IDEMPOTENCY_KEY_CONFLICT`.

See [domain rules](02_API_AND_DATA_CONTRACTS.md) for verified mechanics versus product intent and [the audit matrix](../AUDIT_TEST_MATRIX.md) for finding status.

## Source of truth

Use schema and connection code for persistence, routes for current HTTP behavior, workflows and policies for domain execution, client hooks/screens for UI wiring, and tests for only the assertions they actually make. Historical snapshots are in [archive](../archive/README.md) and are not current contracts. If documentation cannot be confirmed against code/tests, it must say so.
