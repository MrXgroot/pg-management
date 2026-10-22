# Stay Ledger — AI Handoff Primer

You are working on Stay Ledger, a mobile-first property/PG management application. Operators manage properties and their floors, rooms, beds, occupants, rental terms, rent obligations, payments, deposits, and checkout settlements. The domain is **Properties → Floors → Rooms → Beds → Tenants → Assignments/Rental Terms → Obligations → Payments/Allocations → Settlements**.

## Stack and layout

Client: React 19, Vite 8, React Router 7, Tailwind CSS 4, TanStack Query 5, Axios, lucide-react. Server: Node ESM, Express 4, better-sqlite3. SQLite schema is `server/db/schema.sql`; startup uses `CREATE TABLE/INDEX IF NOT EXISTS`, not a versioned migration framework. API base path is `/api/v1`; success responses use `{data: ...}`.

Server flow: routes → `server/src/core/workflows` or `queries` → repositories/policies → SQLite. Client flow: route screens → components/workflow sheets → hooks in `client/src/data` → Axios. Query keys are centralized at `client/src/api/queryKeys.js`. Routes are `/dashboard`, `/tenants`, `/payments`, `/properties/manage`, `/more`; `/` redirects to `/dashboard`.

## Five golden invariants — never break these

1. Keep screens, hooks, workflows, repositories, and policies in their existing layers; do not put SQL in UI or business transactions in components.
2. Preserve history and temporal boundaries. Assignment and rental-term ends are exclusive; represent shifts/checkouts with closed historical intervals and new rows.
3. Store and exchange money as integer paise. Only format/parse at UI boundaries with `formatPaiseToRupees` and `parseRupeesToPaise`.
4. Keep multi-row domain mutations atomic in better-sqlite3 transactions. A thrown workflow error must roll back the complete operation.
5. Use centralized query keys and invalidate every affected read model after mutations. Existing dashboard overlays use local single-sheet state; there is no `sheetStack` implementation today.

## Current route status (source-level)

- `/dashboard`: implemented occupancy/property overview with floor/room/bed views and bottom-sheet tenant actions/ledger flows.
- `/tenants`: implemented tenant directory with search/filter/list and tenant action pathways.
- `/payments`: implemented active collection queue, balance prioritization, filters, and collection sheet; continue UX and error-state validation rather than assuming it is analytics-only.
- `/properties/manage`: implemented property/structure management surfaces and add-floor/room/bed UI. Validate completeness, persistence feedback, and destructive/error cases.
- `/more`: implemented property details, policy settings, export, and system information cards. Verify which settings are persisted and complete missing behavior.

These are implementation-presence statements, not certification of release readiness. The source audit found no authentication layer, schema migration versioning, or sheet stack.

## Known concerns to verify/address

Property occupancy financial totals mix current-cycle matching with all outstanding obligations; financial summary mostly reports all-time totals. Move-in does not verify that the selected bed belongs to the submitted property. Assignment overlap is checked in workflows but is not enforced by a DB exclusion constraint. Collection does not reject checked-out tenants and idempotency key reuse is not compared to the retry payload. Query dates need consistent validation/timezone semantics. Allocation aggregate caps are not DB-enforced. Seed data lacks true unallocated advance credit, multi-shift history, and several deposit edge cases. See `03_CODEBASE_AUDIT_AND_FLAWS.md` for details.

## How to handle future tasks

First inspect the relevant existing files and repository instructions; state assumptions briefly. Follow the current API and schema contracts, and update documentation only when implementation changes warrant it. Do not invent paths or report unverified defects as facts. For money, use paise end-to-end; for dates, preserve canonical ISO text and exclusive end semantics. Keep changes scoped, explain behavior and risks, and run verification only when requested or necessary to establish correctness. Ask for a business-rule decision only when the implementation cannot safely infer it from existing behavior. Remember this primer is a handoff summary; inspect source before making changes.
