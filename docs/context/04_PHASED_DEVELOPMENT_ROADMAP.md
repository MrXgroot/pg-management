# Stay Ledger — Phased Development Roadmap

This order minimizes the chance of polishing screens over inconsistent financial or occupancy records. Confirm business rules where noted before changing persisted semantics.

## Phase 1 — Critical engine fixes

1. Document canonical date format, timezone, billing anchor-day rules, same-day move/checkout semantics, and checkout treatment of future obligations.
2. Validate all request payloads at route boundaries; return stable error codes/statuses for malformed input and SQLite constraint failures.
3. Verify and correct property occupancy and financial summary scopes. Separate current-cycle billed/collected totals from all-time arrears, or label the combined metric explicitly.
4. Enforce that move-in bed belongs to submitted property; also ensure assignment/tenant and deposit/tenant ownership consistency.
5. Close assignment race window: add DB-enforced uniqueness/serialized reservation approach and concurrency-safe retries. Protect allocation sums from exceeding payment or obligation amounts.
6. Decide checked-out tenant collection policy and enforce it. Bind idempotency keys to normalized request payload; mismatched retries should conflict.
7. Define and implement checkout obligation policy, plus term and assignment interval consistency. Preserve historical records.
8. Add schema migration versioning/backups before non-additive schema changes; current startup schema creation is not a migration runner.

## Phase 2 — Robust seeding and test fixtures

1. Make seed deterministic and repeatable: explicit reset/test database usage, stable IDs, fixed “as of” date, and no accidental production DB reset.
2. Add second property and assert data isolation; include active and inactive beds, occupied inactive edge if policy allows, and empty structure nodes.
3. Include a tenant with at least two bed shifts and boundary-day transitions; test a bed reused on exact exclusive end date.
4. Add fully paid, partially paid, overdue, multi-obligation allocation, unallocated advance credit, and later credit consumption cases.
5. Add deposit outcomes: zero deductions, partial deductions, full deduction, over-deduction rejection, and outstanding liability behavior according to policy.
6. Add invalid dates, invalid status/method, duplicate/conflicting idempotency key, overlapping assignment attempts, and cross-property move-in cases.
7. Keep existing workflow/repository/query tests and add endpoint contract coverage once rules are settled.

## Phase 3 — Screen polish and realignment

1. Preserve `/payments` as the collection desk: prioritize overdue then due balances, allow fast search, one-tap collection, show pending/credit states, and make success/error/retry feedback immediate. Existing screen already has queue behavior; close UX gaps rather than rebuilding it as a new concept.
2. Complete `/properties/manage` floor/room/bed CRUD with duplicate prevention, confirmation for destructive operations, inactive-bed visibility, validation, and errors surfaced at the action.
3. Complete `/more` policy settings with explicit persistence contract; currently cards exist, so confirm each control's server-backed behavior and avoid presenting local-only values as saved.
4. Ensure dashboard, tenant directory, collection queue, and tenant ledger use shared navigation/selection state or intentional sheet transitions without stale duplicated entities.
5. Review keyboard focus, screen-reader labels, tap targets, responsive behavior, and dark-mode toggling. Use the existing Tailwind config tokens consistently.

## Phase 4 — Production hardening and E2E validation

1. Add API request tracing, safe structured logs, health/readiness checks, backup/restore plan, and SQLite durability/locking operational guidance.
2. Add optimistic updates only where rollback/error UI is reliable; otherwise invalidate affected query families and show pending state.
3. Add E2E flows: property setup → move-in → collect partial/full/advance payment → bed shift → checkout → deposit settlement; verify persisted ledger and occupancy after reload.
4. Add idempotency guarantees and duplicate submission handling to all relevant writes, with client-generated stable keys and retry policy.
5. Validate mobile touch gestures for bottom sheets, keyboard interaction, offline/network failure, error boundaries, and recovery after app reload.
6. Add security/access control before multi-user deployment; no auth/authorization is evident in the present code.

## Exit criteria

Each phase should have explicit business-rule decisions, regression coverage for fixed failures, schema/data migration notes where needed, and an operator-readable release checklist. Do not call the system production-hardened solely because the current tests pass.
