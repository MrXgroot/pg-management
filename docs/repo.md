# Repository responsibilities

Repositories are direct ES module modules under `server/src/core/repos/`. They perform focused SQL persistence work and return database-shaped records. Workflows compose them; query modules build read projections. Function names below are current module exports at a responsibility level, not a promise of a stable public API.

| Module | Responsibility |
| --- | --- |
| `propertyRepo.js` | List, find, insert and update properties. |
| `floorRepo.js`, `roomRepo.js` | Find/create/update structure and perform guarded child-aware deletion. |
| `bedRepo.js` | Find/create/update/deactivate beds; prevent deletion when assignment history exists. |
| `tenantRepo.js` | Find tenants/directory rows, insert tenant, change contact/status. |
| `assignmentRepo.js` | Find active assignments, inspect overlaps, insert assignments and close them. Database triggers provide a second overlap/interval boundary. |
| `rentalTermRepo.js` | Find and insert rental terms, close an effective term. |
| `obligationRepo.js` | Find tenant obligations/outstanding items, locate latest boundary, insert-if-period-missing, and update due date. |
| `paymentRepo.js` | Find and insert payments, including lookup by idempotency key. |
| `paymentAllocationRepo.js` | Read allocation totals and insert allocation rows. It does not itself enforce cross-row allocation caps. |
| `depositRepo.js` | Read/insert deposits and mark them settled. |
| `depositSettlementRepo.js`, `depositDeductionRepo.js` | Read/insert settlement and deduction records. |

Repositories generally do not open their own transaction. A workflow transaction must cover related writes. Repository and database boundaries are not authorization boundaries; the current API has no user authentication or per-owner scoping. See [database schema](database_schema.md), [workflows and queries](workflows_and_queries.md), and [API transport](API_TRANSPORT_CONTRACT.md).
