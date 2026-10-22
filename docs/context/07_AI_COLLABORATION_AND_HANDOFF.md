# AI Collaboration Protocol and Current Handoff

## Intended collaboration workflow

1. ChatGPT reads the committed repository context and this docs index, then inspects relevant actual source and prepares a scoped plan/prompt.
2. Gemini helps the human reason through and implement the task; it should not assume this document is newer than code.
3. The human edits code, runs relevant tests, and controls commits.
4. Codex reviews actual local changes in read-only mode for ordinary feature reviews. It must inspect/report only and not edit code or docs during those reviews.
5. Review findings return to ChatGPT for prioritization and a follow-up plan.
6. Update maintained docs and handoff after meaningful verified changes. The present audit authorized documentation-only edits as an exception.

### Snapshot reconciliation

GitHub may show the last committed snapshot while Codex can inspect a local working tree. Always identify branch/commit and whether changes are committed, staged, or uncommitted. Do not tell ChatGPT or Gemini they saw uncommitted code unless the human supplied it or the collaboration system actually shared it. When snapshots disagree, source tree being acted on is authoritative for local work; report differences and avoid silently treating remote snapshot as current.

## Task prompt template

```text
Goal:
User-visible behavior:
Relevant source files (verify these and find others as needed):
Constraints / files not to change:
Business rules already decided:
Open questions (do not invent answers):
Acceptance criteria:
Required tests/commands and expected evidence:
Documentation updates needed:
Report format: files changed, decisions, tests actually run/results, risks, open questions.
```

## Codex read-only review template

```text
Inspect the actual diff and relevant surrounding code. READ ONLY: do not edit source, tests, configuration, or docs. Report findings only, ordered by severity, with file/symbol/line evidence, expected vs actual behavior, impact, and a concrete test or reproduction suggestion. Separate confirmed defects from risks and missing tests. If no findings, say so and list areas not verified. State which revision/working tree was inspected and which checks were actually run; do not claim unrun tests pass.
```

## Reusable current-state handoff

Stay Ledger currently consists of a React 19/Vite/Tailwind 4 browser client, Express 4/Node ESM server, better-sqlite3 SQLite DB, and server-side workflows/queries/repos/policies. Client routes: `/dashboard`, `/tenants`, `/payments`, `/properties/manage`, `/more`. Money uses integer paise; assignment and rent-term ends are exclusive; mutation workflows use SQLite transactions. Dashboard sheet navigation uses local `sheetStack`.

Intended target is Android standalone with local business logic and DB and no final server/API runtime. It is not implemented; no framework, DB adapter, or migration strategy is selected. Current core depends on Node crypto/filesystem/path and better-sqlite3, so it cannot be moved unchanged.

Active audit priorities: (1) enforce tenant-property/bed ownership; (2) resolve assignment interval concurrency and same-day boundaries; (3) define financial reporting scopes and billing/proration semantics; (4) bind idempotency keys to request payload; (5) reconcile client property PATCH with absent server route; (6) formalize validation and security requirements. See `05_AUDIT_FINDINGS.md`; do not fix these without an implementation task and required business decisions.

Suggested next task: establish an executable behavior baseline by running current server tests and adding focused tests for the confirmed cross-property move-in gap, assignment boundary, conflicting idempotency payload, and report scopes—after product decisions for ambiguous behaviors. Inspect `server/src/core/workflows/`, policies, query modules, schema, and `server/test/`. Acceptance: reproduce each documented case; classify expected policy for unresolved cases; report actual test results. No code change is authorized by this handoff alone.

## Decisions and unknowns

Decided by current code: paise integer units; half-open assignment/term intervals; FIFO allocation ordering; full rent amount on move-in obligation; deposit excess deductions are recorded as remaining liability. Product intent for proration, due-date offset, checked-out collections, future checkout obligations, financial time scopes, authentication, Android framework/storage/sync/backup remains open. Preserve that distinction in future work.
