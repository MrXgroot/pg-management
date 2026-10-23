# Project architecture

## Current system

Stay Ledger currently runs as a React/Vite browser client, a Node.js/Express server, and a local SQLite database accessed with `better-sqlite3`. The repository contains no Android app or remote synchronization service.

```text
React screen → TanStack Query hook → Axios client → Express route
                                                    ├─ read → query module → SQLite
                                                    └─ write → workflow → repository/policy → SQLite
```

The server starts from `server/src/index.js`; `server/src/app.js` configures Express, permissive CORS, JSON parsing, request logging, route mounts and error handling. Database setup is in `server/db/connection.js`, with DDL in `server/db/schema.sql`.

## Modules

- `client/src/screens/`, `components/`, `layouts/`: browser UI and route-level views.
- `client/src/data/`: TanStack Query reads and mutations. `client/src/api/`: Axios transport and envelope handling.
- `server/src/routes/`: HTTP adapters into query modules and workflows.
- `server/src/core/workflows/`: multi-step writes, normally enclosed in `better-sqlite3` transactions.
- `server/src/core/queries/`: SQL-backed read models for occupancy, tenants, financial summary and ledger.
- `server/src/core/repos/`: focused persistence operations.
- `server/src/core/policies/`: date, billing-period, allocation and deposit calculations/validation.
- `server/db/`: SQLite connection, schema and development seed.

See [repositories](repo.md), [workflows and queries](workflows_and_queries.md), and [database schema](database_schema.md) for implementation details.

## Persistence and transaction boundary

The connection enables SQLite foreign keys, WAL journaling and a 5-second busy timeout. Workflow transactions provide atomicity for the multi-row business operations such as move-in, shift, checkout, collection, and deposit settlement. Assignment integrity is additionally enforced by insert/update triggers in SQLite. Other cross-row financial invariants are not comprehensively enforced by schema constraints. There is no migration framework; opening a database executes the schema's `CREATE ... IF NOT EXISTS` statements and trigger definitions.

SQLite's local transaction behavior is the current deployment model. No claim is made about distributed concurrency, multi-device synchronization or conflict resolution.

## Intended Android direction

The stated direction is a standalone Android app with local domain logic and storage. This remains a plan, not the current architecture. Current server workflows directly depend on Node APIs, Express boundaries and synchronous `better-sqlite3`; they cannot be imported unchanged into a native Android application. Migration needs an explicit Android domain/persistence design and an existing-database import/versioning plan. If remote synchronization or multiple users become requirements, security and conflict architecture must be decided separately. See [open questions](OPEN_QUESTIONS.md).
