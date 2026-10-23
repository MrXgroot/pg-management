# Project status

**Documentation snapshot:** 2026-10-23. The [audit matrix](AUDIT_TEST_MATRIX.md) is the detailed finding tracker; the [test work log](TEST_WORK_LOG.md) records observed work and results.

## Product and implementation

The current application is a React/Vite browser client backed by Node.js/Express and local SQLite (`better-sqlite3`). It supports property structure, tenant occupancy lifecycle, obligations, collections, deposits and ledger views. The intended standalone Android architecture is not implemented; framework, storage, migration and offline/security requirements remain open.

## A-01 through A-10 status

See the [audit test matrix](AUDIT_TEST_MATRIX.md). At a glance:

- A-01, A-02, A-04 and A-05 have meaningful passing scenario coverage for key current behaviors; their broader findings are not all resolved (for example, A-01 direct-write ownership, A-02 temporary transport, A-04 compared payload scope, and A-05 underlying SQLite/local transaction limits).
- A-03 and A-06 remain blocked on product definitions; current implementation behavior must not be treated as decided policy.
- A-07 domain validation exists, but temporary HTTP mapping coverage has gaps.
- A-08 depends on whether a remote API exists in the target deployment; no auth layer currently exists.
- A-09 remains an architectural Android portability/migration task.
- A-10 lacks client, end-to-end, Android, and migration coverage.

## Verification

No test suite was run for this documentation rebuild. The prior work log records historical test runs; those counts predate the current audit-test inventory and should not be read as the present suite count. Commands to reproduce the server suite are in [testing](testing.md).

## Recommended next steps

1. Decide financial and billing policies (A-03/A-06) before encoding expected totals or proration.
2. Define target Android and deployment/security requirements (A-08/A-09) and a migration/data preservation plan.
3. Expand coverage only for material boundary gaps once those product/architecture decisions are made.
