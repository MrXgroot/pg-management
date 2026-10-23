# Test and documentation work log

This is a chronological record of work actually performed. Current finding status and evidence live in [AUDIT_TEST_MATRIX.md](AUDIT_TEST_MATRIX.md); this log avoids restating that matrix.

## 2026-10-23 — Rebuild documentation from current project

- Inspected the current source tree, package scripts, schema/connection, workflows, policies, repositories, queries, routes/error handling, client router/screens/data hooks, test inventory, existing audit matrix and status/log documents.
- Added canonical references for SQLite schema, repositories, HTTP transport, screens, and unresolved questions; rewrote the architecture, business-rules, workflows/queries, testing, status, and decision pages to distinguish current mechanics from intended behavior.
- Corrected stale A-05 documentation: `server/db/schema.sql` currently installs insert/update triggers for non-empty assignment intervals and non-overlap by bed/tenant; the existing A-05 audit test exercises direct writes, updates, open intervals, adjacency, and trigger initialization.
- Marked retained context snapshots as historical where their older A-05 descriptions conflict with current triggers. Preserved the detailed audit findings and historical archive.
- No source, test, schema, or configuration files were changed in this documentation update. No tests were run. Markdown relative links and the updated claims were manually checked against repository paths and source.

## 2026-10-23 — A-01 through A-04 audit scenario review

- Inspected workflow, query, repository, route, database tests, helpers, frontend calls, and audit findings.
- Added `server/test/routes/propertyRoutes.test.js` for the property PATCH success envelope and missing-property response. A local HTTP socket attempt was blocked by sandbox `EACCES`; the final test invokes the registered route and error middleware directly.
- Reused existing A-01 move-in and A-04 payment idempotency tests. Added no duplicate scenario tests.
- Did not assert disputed A-03 financial totals. Recorded candidate scenarios and product decisions.
- Command: from `server/`, `npm test -- test/routes/propertyRoutes.test.js test/workflows/moveInWorkflow.test.js test/workflows/collectPaymentWorkflow.test.js test/queries/occupancyQueries.test.js` — 4 files, 32 tests passed.

## 2026-10-23 — A-05 same-day rejection updates

- Replaced `characterizes checkout on assignment start as a zero-length interval` with `rejects same-day checkout without changing tenant, assignment, or rental term` in `server/test/workflows/moveOutWorkflow.test.js`.
- Replaced `characterizes a same-start-date shift as a zero-length historical interval` with `rejects a same-day bed shift without changing assignment history` in `server/test/workflows/shiftBedWorkflow.test.js`.
- The replacements assert the actual errors: `CHECKOUT_DATE_MUST_BE_AFTER_START_DATE` and `SHIFT_DATE_BEFORE_START_DATE`. They verify the relevant state is unchanged after rejection. The two names remain inconsistent; no production code was changed.
- Command: from `server/`, `npm test -- test/workflows/moveOutWorkflow.test.js test/workflows/shiftBedWorkflow.test.js` — 2 files, 10 tests passed.
- Command: from `server/`, `npm test` — 10 files, 66 tests passed.

## 2026-10-23 — Dedicated audit tracking

- Inspected `docs/context/05_AUDIT_FINDINGS.md`, all existing test categories, the SQLite fixture, current workflows/routes/queries, package scripts, project status, and this log.
- Added `server/test/audit/a05AssignmentIntervalRules.test.js`, test `allows a one-day bed assignment from January 10 through January 11`. It verifies adjacent Jan 10–11 and Jan 11–12 intervals.
- Reused existing A-01 cross-property move-in, A-04 idempotency, A-05 same-day rejection, and A-07 domain validation tests by reference in the audit matrix.
- Command: from `server/`, `npm test -- test/audit` — 1 file, 1 test passed.
- Command: from `server/`, `npm test` — 11 files, 67 tests passed.

## 2026-10-23 — Documentation audit and refactor

- Inspected every Markdown file under `docs/`, the available client README, package scripts, tests, and source relevant to documented behavior. No root README existed before this entry.
- Added a root README, revised the documentation index, and reorganized maintained content around context/domain/persistence/testing, audit, decisions, and status. Moved five explicitly superseded snapshots to `docs/archive/`; their contents are retained.
- Corrected stale A-01/A-02/A-04/A-05 claims and test inventory in maintained docs; labeled the original audit report as historical and linked current evidence to the matrix.
- Updated status, decisions, collaboration handoff, and changelog. No application source, tests, schema, dependencies, package scripts, or runtime configuration were changed during this refactor.
- Verification: all relative Markdown target paths resolved across 22 Markdown files; archive and maintained-document links were included. No test suite was run for this documentation-only change.
