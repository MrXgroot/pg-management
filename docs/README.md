# Stay Ledger documentation

These documents describe the repository as inspected on 2026-10-23. The running implementation and tests are evidence of current behavior; product decisions and planned Android architecture are labeled separately.

## Canonical references

| Document | Purpose |
| --- | --- |
| [Business rules and policies](business_rules_and_policies.md) | Implemented rules, settled decisions, and unresolved product semantics |
| [Project architecture](PROJECT_ARCHITECTURE.md) | Current client/server architecture and the Android direction |
| [Database schema](database_schema.md) | SQLite tables, constraints, triggers, and gaps |
| [Repositories](repo.md) | Persistence module responsibilities and behaviors |
| [Workflows and queries](workflows_and_queries.md) | Write transactions, read projections, and current caveats |
| [API transport contract](API_TRANSPORT_CONTRACT.md) | Prototype HTTP routes, envelopes, and error mapping |
| [Screens](screens.md) | Current routes and screen responsibilities |
| [Testing](testing.md) | Test commands, fixture model, and verified coverage inventory |
| [Open questions](OPEN_QUESTIONS.md) | Product, security, and migration decisions still needed |

## Current tracking

- [Project status](PROJECT_STATUS.md) summarizes the implemented app and audit state.
- [Audit test matrix](AUDIT_TEST_MATRIX.md) tracks A-01 through A-10 separately.
- [Test work log](TEST_WORK_LOG.md) records observed changes and test runs.
- [Decisions](DECISIONS.md) records confirmed and unresolved decisions.
- [Changelog](CHANGELOG.md) records project documentation and implementation changes.
- [Archive](archive/README.md) retains superseded documentation snapshots for historical reference.
- [Original audit findings](context/05_AUDIT_FINDINGS.md) is preserved; use the current matrix for status.

## Authority and scope

The canonical references distinguish current behavior from intended contracts. Historical documents under `context/` and `archive/` may describe earlier states. They are not authoritative when they conflict with current source, schema, tests, or the current canonical references. This repository is presently a React web client, a Node/Express service, and a local SQLite database; Android migration is a direction, not completed work.
