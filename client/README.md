# Stay Ledger web client

This directory contains the current React/Vite browser client. Project overview and architecture are in the [repository README](../README.md) and [documentation index](../docs/README.md).

## Commands

- `npm install` — install client dependencies.
- `npm run dev` — start Vite on port 5173; `/api` requests proxy to `http://localhost:4000`.
- `npm run build` — create a production web build.
- `npm run lint` — run ESLint.

The client calls the temporary Express API. There is no client test script or Android UI in this package. The intended Android architecture remains undecided; see [Android migration planning](../docs/context/06_ANDROID_MIGRATION.md).
