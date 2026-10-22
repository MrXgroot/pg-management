# Stay Ledger — Project Context Primer

Stay Ledger is a property/PG operations app for managing property structure and occupancy, tenant lifecycle, rent obligations and collection, deposits, and ledger history. This document is an orientation map; inspect source before relying on a behavior claim.

## Verified current stack

- Client: React 19, Vite 8, React Router 7, Tailwind CSS 4, TanStack Query 5, Axios, lucide-react.
- Server: Node.js ES modules, Express 4, better-sqlite3 11.8; API prefix `/api/v1`.
- Database: SQLite initialized through `server/db/connection.js` and `server/db/schema.sql`; no versioned migrations found.
- Android is an intended future standalone runtime, not current implementation. No Android project/framework is present.

## Repository map

- `client/src/app/`: app composition, providers, router.
- `client/src/screens/`, `layouts/`, `components/`, `workflows/`: screen and UI workflow code.
- `client/src/data/`, `api/`, `context/`: TanStack Query hooks, API client, selected-property state.
- `server/src/routes/`: HTTP route adapters.
- `server/src/core/workflows/`, `queries/`, `repos/`, `policies/`: server-side business operations, read models, SQL access, calculations.
- `server/db/`: SQLite schema, connection, seed.
- `server/test/`: Vitest repository, query, workflow, and DB integration coverage.
- `docs/README.md`: authoritative document index.

## Golden verified invariants

1. Money is stored and exchanged in integer paise (`*_paise`/`*Paise`); client formats at UI boundary via `formatPaiseToRupees`.
2. Assignment and rental-term intervals use exclusive end dates in SQL predicates and workflows; adjacent intervals can meet at a boundary.
3. Core multi-write workflows use better-sqlite3 transactions.
4. Frontend reads are TanStack Query hooks; keys are centralized in `client/src/api/queryKeys.js`, although some invalidation uses literal prefixes.
5. Dashboard overlay navigation uses a local `sheetStack` in `DashboardBottomSheet`; this is UI state over cached occupancy data, not server-side routing.

## Current implementation status

The router declares `/dashboard`, `/tenants`, `/payments`, `/properties/manage`, `/more`. Dashboard presents occupancy and stacked bottom-sheet actions; tenants provides directory/filtering; payments has collection queue and collection sheet; manage has property/structure screens; more has settings/export/info cards. These statements indicate code presence only; see the frontend reference for incomplete or mismatched behavior.

## Sources and AI use

Schema and connection are authoritative for persistence; route files for HTTP; workflows/policies for business rules; client hooks and screens for UI behavior; tests establish only their covered assertions. Package manifests establish declared versions/scripts. GitHub snapshots and old documents may differ from the local working tree: state which revision/tree was inspected, and never claim to have seen local uncommitted changes unless explicitly provided. Code/schema/tests take precedence over stale AI-generated documentation.

Read [architecture](01_SYSTEM_ARCHITECTURE_OVERVIEW.md), [domain and API](02_API_AND_DATA_CONTRACTS.md), [persistence and core](03_DATABASE_AND_CORE_REFERENCE.md), [frontend and tests](04_FRONTEND_AND_TESTING_REFERENCE.md), [audit findings](05_AUDIT_FINDINGS.md), [Android plan](06_ANDROID_MIGRATION.md), and [AI collaboration/handoff](07_AI_COLLABORATION_AND_HANDOFF.md). Do not start Android migration as part of an audit or planning task.
