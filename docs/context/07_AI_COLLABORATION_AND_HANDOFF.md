# AI collaboration and handoff

This document provides reusable task and review formats plus a current source-backed handoff. The [documentation index](../README.md) and [project status](../PROJECT_STATUS.md) are the entry points; this file is not a substitute for inspecting the working tree.

## Task brief template

```text
Goal:
User-visible behavior:
Relevant source files (verify these and find others as needed):
Constraints / files not to change:
Business rules already decided:
Open questions (do not invent answers):
Acceptance criteria:
Required tests/commands and evidence:
Documentation updates needed:
Report format: changed files, decisions, observed results, risks, open questions.
```

## Read-only review template

```text
Inspect the actual diff and relevant surrounding code. READ ONLY: do not edit source, tests, configuration, or docs. Report findings ordered by severity, with file/symbol evidence, expected vs actual behavior, impact, and a concrete test or reproduction suggestion. Separate confirmed defects from risks and missing tests. If there are no findings, say so and list areas not verified. Identify the revision/working tree and checks actually run; do not claim unrun checks pass.
```

## Current verified handoff

Stay Ledger has a React/Vite browser client, Express/Node ESM server, SQLite database through better-sqlite3, and server-side workflows, queries, repositories, and policies. The server test suite covers selected domain workflows, repositories, queries, database constraints, a property route, and one dedicated A-05 audit scenario.

Current confirmed rules include integer paise; half-open assignment/rental intervals; same-day checkout and bed shifts rejected; Jan 10 to Jan 11 valid; idempotency payload conflicts rejected; workflow transactions for multi-row operations. See [domain rules](02_API_AND_DATA_CONTRACTS.md), [decisions](../DECISIONS.md), and [audit matrix](../AUDIT_TEST_MATRIX.md).

The intended target is standalone Android with local business logic and storage. It is not implemented, and no runtime, UI framework, database adapter, migration path, or sync model is selected. Current server workflows depend on Node crypto, the server DB connection, and better-sqlite3, so they cannot be embedded unchanged.

Immediate work should first resolve A-03 financial scopes and A-06 billing/proration requirements; see [project status](../PROJECT_STATUS.md). A-05 persistence-level bounds/concurrency, A-08 deployment security, and Android migration design remain separate work. The HTTP API is temporary and should not be expanded for Android without a prototype requirement.

## Snapshot reconciliation

When repository snapshots differ, state which tree and revision were inspected. Do not imply that another collaborator saw local uncommitted changes unless those changes were explicitly shared. Source and tests describe current behavior; decisions describe product intent; the historical audit and archive are not current authority.
