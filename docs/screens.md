# Client screens

The browser client is a React single-page app. Routes are defined in `client/src/app/router.jsx`, rendered inside `AppLayout`, and use TanStack Query hooks under `client/src/data/`. Navigation and selected property are client state; persistence and domain operations go through the HTTP API.

| Browser path | Screen | Current responsibility |
| --- | --- | --- |
| `/dashboard` | `DashboardScreen` | Property occupancy summary, floor selector, room/bed grid, and sheets for move-in, tenant actions and ledger. |
| `/tenants` | `TenantsScreen` | Tenant directory search/status/payment filters and tenant ledger sheet. |
| `/payments` | `PaymentsScreen` | Active-tenant collection queue, search, outstanding/overdue filters, payment collection sheet. |
| `/properties/manage` | `ManageStructureScreen` | Property hub/details and create/manage floors, rooms and beds. |
| `/more` | `MoreScreen` | Property details, policy settings UI, roster export, and system information. |
| unknown path | Not-found UI | “Page Not Found” destination. |

The app provides loading/error/empty states in several screens, but this is not a comprehensive accessibility, offline, device, or end-to-end verification. No Android screen implementation exists.

## Important current limitations

- The Payments screen currently queries the active tenant directory and builds a local collection queue. `useFinancials` and financial summary components exist, but the financial summary query is not used by `PaymentsScreen`.
- The “policy settings” presentation should not be interpreted as proof that each displayed setting is persisted or honored by the billing workflow; see [open questions](OPEN_QUESTIONS.md).
- Screen coverage is mainly indirect through workflow/query tests; there is no browser component or end-to-end test suite recorded in the repository.
