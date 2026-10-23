# Android Migration Plan (Planning Only)

## Current versus target

**Current:** React/Vite browser client calls Express/Node API; server core executes workflows/queries, repositories use better-sqlite3, and server owns a filesystem SQLite database. **Intended target:** Android is the primary standalone runtime; business core runs locally and manages its local database directly; current server/API disappears from that final runtime. This is product direction, not implemented architecture. No Android project, framework, database adapter, or migration strategy is selected.

## Migration boundary

Potentially portable: policy concepts in `server/src/core/policies/` (pure JS aside from built-in Date APIs); schema/domain concepts; behavior contracts and tests. Needs adaptation: workflow orchestration, identifiers, errors, transaction interface, query read models, repositories. Likely retire or redesign in standalone runtime: Express routes/envelopes, Axios, Node DB connection, Vite proxy. Client UI is React web and not directly an Android native UI; the target UI technology remains undecided.

Current dependencies/barriers: workflow modules use `node:crypto`; query/workflow modules import `server/db/connection.js`; connection uses `node:fs`, `node:path`, `node:url`, module filesystem location, and better-sqlite3; server startup uses `process.env.PORT`, `process`, HTTP server lifecycle. Browser code uses `window`, localStorage, DOM, CSS/Tailwind, React Router, Axios, and TanStack Query. No server sessions were found. These are facts about current runtimes, not proof that a specific replacement is required.

## Staged, dependency-aware plan

### Stage 0 — Requirements and baseline capture

- **Objective:** Agree standalone/offline/multi-device/security requirements and current business behavior before porting.
- **Existing code:** policies, workflows, schema, seed, workflow/repo/query tests.
- **Prerequisites/decisions:** offline needs, data ownership, sync expectations, user/account model, supported Android devices, date/timezone, proration, checkout, credit, and settlement rules. Do not choose framework or adapter until this is resolved.
- **Deliverables:** behavior matrix, source-to-target boundary map, data volume and supported DB capability inventory.
- **Acceptance:** each financial/lifecycle rule has source evidence, test case, and an explicit open/decided status.
- **Risk/rollback:** none to runtime; preserve current implementation as reference.
- **Tests:** run and record existing server suite; add missing behavior tests before extraction.

### Stage 1 — Close remaining integrity and contract gaps

- **Objective:** Stabilize property ownership, assignment intervals, payment idempotency, financial scopes, and API/client mismatches before parity baseline.
- **Code:** A-01 through A-07; `server/src/core`, routes, tests, client hooks.
- **Prerequisites:** A-05 same-day interval semantics are decided and workflow-tested; schema-level interval enforcement and concurrency remain open. A-03/A-06 product rules and other listed open questions need explicit decisions before financial changes.
- **Deliverables:** validated rule decisions, regression cases, clarified contracts. Implementation requires a separate task authorization.
- **Acceptance:** consistent historical ledger and occupancy under boundary, duplicate, retry, and property-isolation cases.
- **Risk/rollback:** schema/data migrations could invalidate existing DB; snapshot and migration rollback plan needed before schema changes.
- **Tests:** current suite plus targeted API, concurrency, financial-scope, idempotency conflict tests.

### Stage 2 — Define portable domain boundary

- **Objective:** Separate domain rules from Node persistence/transport.
- **Code:** policies/workflows/repositories and current HTTP routes.
- **Prerequisites:** baseline test suite and selected target runtime interface (decision still open).
- **Deliverables:** documented domain input/output/error contracts; persistence port and transaction requirements; deterministic parity fixtures. Do not prematurely select a concrete adapter.
- **Acceptance:** pure domain behavior can be exercised without Express, filesystem DB initialization, or HTTP; server implementation still passes parity tests.
- **Risk/rollback:** abstraction can overfit a future guess; keep existing server implementation runnable during extraction.
- **Tests:** contract tests against current workflows and alternative in-memory/fake persistence boundary.

### Stage 3 — Select Android runtime, storage, and UI architecture

- **Objective:** Choose Android implementation after requirements and dependency inventory.
- **Code:** no Android code exists.
- **Prerequisites:** Stage 0; comparison of framework choices, SQLite versions/driver features, filesystem sandbox, lifecycle, and UI needs.
- **Decisions:** native vs cross-platform UI; core language/runtime; SQLite driver; schema migration library; encryption/backup; data import/export; local auth/security.
- **Deliverables:** approved architecture decision records and threat/data-loss model.
- **Acceptance:** prototype proves required transactions, constraints, migrations, backup/restore, offline operation, and supported date handling.
- **Risk/rollback:** platform lock-in; keep data export format and migration tooling explicit.
- **Tests:** storage capability probes and backup/restore round trips on target devices.

### Stage 4 — Port persistence and core behavior with parity

- **Objective:** Port domain behavior and preserve SQLite data integrity/history.
- **Code:** schema/repositories/workflows/policies; seed/test fixtures.
- **Prerequisites:** chosen platform/adapters; source behavior baseline.
- **Deliverables:** Android persistence adapter, migration from existing SQLite DB, ported operations, audit/event or ledger semantics as decided.
- **Acceptance:** fixture-by-fixture parity for occupancy, obligations, payments, allocation, deposits, and lifecycle; migration preserves IDs, paise, dates, FKs, and history; restore verified.
- **Risk/rollback:** schema differences, transaction isolation/locking, WAL/backup handling, interrupted migration, precision/date conversion. Use copy-before-migrate and rollback/restore route; never overwrite only source DB.
- **Tests:** DB integrity checks, migration from real-version snapshots, interruption recovery, concurrent local writes, financial parity/property tests.

### Stage 5 — Build Android UI and remove server runtime for standalone release

- **Objective:** Deliver Android screens over local core, then retire HTTP only after parity and operational acceptance.
- **Code:** current React screens as interaction reference; APIs as temporary transport contracts.
- **Prerequisites:** core parity, approved UI/accessibility model, export/backup/data ownership rules.
- **Deliverables:** Android screens/workflows, local navigation/state, error/retry/offline UX, data import/export, release and support plan.
- **Acceptance:** end-to-end move-in→collection→shift→checkout→settlement works offline, survives restart, and matches reference ledger; server/API no longer required for standalone flows.
- **Risk/rollback:** user data loss, behavior divergence, support continuity. Keep safe export/restore and staged user migration path.
- **Tests:** device E2E, lifecycle/background restart, accessibility, offline, backup restore, full regression parity.

## Cross-cutting concerns

Schema currently depends on SQLite features visible in DDL (CHECK, FK actions, unique indexes); target SQLite version/driver compatibility must be checked. Current FK enforcement is a connection pragma; target adapter must enable it. better-sqlite3 transaction behavior is synchronous and must not be assumed identical in an Android driver. WAL, busy timeout, backup consistency, app upgrades, partial writes, and device storage failure need explicit design. Money remains integer paise. Date strings and exclusive interval bounds require parity. No final framework, DB adapter, or migration tool is chosen here.
