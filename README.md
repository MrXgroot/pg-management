# Stay Ledger

Stay Ledger is a property and tenant management prototype. The current app is a React/Vite browser client, an Express/Node.js service, and a local SQLite database accessed with `better-sqlite3`. It supports property structure, tenant occupancy, rent obligations and collections, deposit settlement, and ledger views.

The intended direction is a standalone Android app with local domain operations and storage. Android implementation, framework selection, database migration, and synchronization requirements are not complete or decided. Current implementation behavior and unresolved decisions are documented separately.

## Run locally

Use two terminals from the repository root:

```powershell
cd server
npm ci
npm run dev
```

```powershell
cd client
npm ci
npm run dev
```

The server defaults to port 4000. Vite defaults to port 5173 and proxies `/api` to the server. Run server tests from `server/` with `npm test`. The seed script writes to the default local SQLite database; inspect its effects before running it.

## Documentation

Start at [docs/README.md](docs/README.md). It links the current domain rules, architecture, schema, repositories, workflows/queries, temporary API, screens, testing, audit status, and open decisions. See [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) for a concise state summary.

Current behavior should be verified against source, schema, and tests. The documentation labels unresolved product semantics and planned architecture instead of presenting them as implemented requirements.
