# Changelog

## 2026-10-23 — Documentation rebuilt from current project

- Added the missing database, repository, API transport, screen, and open-question references; replaced architecture, domain, workflow, and testing pages with descriptions checked against current files.
- Corrected the A-05 status to reflect assignment insert/update triggers now present in `server/db/schema.sql`; clarified local SQLite scope and named business decisions that remain open.
- Reconciled the documentation index, project status, and decision register. Marked retained context snapshots as historical where later source changes superseded them. No source, test, schema, or configuration files were changed for this documentation update.
- Tests were not run for this documentation-only update; verification performed was Markdown link and consistency inspection.

## 2026-10-23

- Reorganized and reconciled the project documentation, added a root README and decisions page, and archived five superseded snapshots without deleting their contents. Updated the current domain, testing, status, and handoff references against the code and tests; retained the original audit report as a clearly labeled historical record. Verified all relative Markdown target paths across 22 Markdown files; application tests were not run for this docs-only change.
- Updated the same-day checkout and bed-shift tests to reflect the agreed rule that assignments must last at least one calendar day. The tests now expect each workflow's existing rejection error and verify that rejected operations leave the relevant tenant, assignment, and rental-term state unchanged. Production code was not changed.
