# Domain Rules and HTTP Contracts

Evidence: `server/db/schema.sql`, `server/src/core/{workflows,queries,policies}`, route handlers, client API/hooks, and current tests. Rules below are verified only to the extent named; unresolved semantics are called out.

## Domain and lifecycle

### Structure and occupancy

Property → floor → room → bed are linked by FKs. Bed has `is_active` 0/1. Occupancy query determines assignment at date using `start_date <= date AND (end_date_exclusive IS NULL OR end_date_exclusive > date)`. Move-in checks bed existence, active state, and overlaps; it does not verify that bed's floor/property corresponds to payload `propertyId` (finding A-01). Database does not enforce overlap exclusion or unique active assignment. Tests cover common overlap rejection in repositories/workflows, not concurrent requests.

### Tenant, assignment, move-in, shifts, checkout

Tenant status is `ACTIVE`/`CHECKED_OUT`. Move-in creates tenant, assignment, rental term, optional deposit, and first obligation in one transaction. Shift closes the old assignment and inserts a new one on `shiftDate`; shift date may equal start date under current comparison, potentially yielding invalid zero-length prior interval because schema does not check assignments (open issue). Checkout similarly closes assignment and term at `checkoutDate`, marks tenant checked out; it does not settle deposit or explicitly reconcile obligations beyond checkout. Future checkout versus existing future periods is unresolved. Repositories keep assignment history; tests cover one shift and checkout cases.

### Billing, rent, obligations, payment, ledger

Rental terms use `[effective_from,effective_to_exclusive)` semantics. `computeNextBillingPeriod` preserves original anchor day, clamping to month length (Jan 31→Feb 28/29; then March uses original anchor), and returns period start/end; `dueDateOffsetDays` is accepted but unused and `dueDate` currently equals period start. No proration calculation is implemented in this policy; move-in creates an obligation from joining date to next anchored period using full `rentPaise`. Whether that is intended billing policy is unknown. Payment collection generates periods while latest obligation end `<= paidOn`, allocates FIFO by period start, due date, ID, and leaves excess as unallocated credit. Allocation policy supports integer paise and partial allocations. Ledger computes outstanding as obligations minus allocated sums and credit as payment totals minus allocations. The source has no persisted credit ledger or automatic future allocation beyond each payment's allocation behavior.

Overdue policy in queries compares `due_date < asOfDate`; due today is not overdue. Tenant directory computes due/credit status using UTC current day. Collection validates paidOn but does not require active tenant status. Idempotency key is unique in DB; repeat key returns old payment regardless of payload (A-04).

### Deposit and settlement

Deposit status is HELD/SETTLED; a settlement is unique per deposit. Policy accepts itemized positive paise deductions with nonblank reasons; refund is max(deposit−deductions,0), liability max(deductions−deposit,0). It permits deductions above deposit, which tests explicitly cover. Business meaning/collection of remaining liability is not implemented beyond recording total.

### Validation and test evidence

`dateUtils.js` validates strict real `YYYY-MM-DD` calendar dates. Mutation workflows call it for their date inputs. Query route dates have no equivalent validation at the route boundary. SQLite enforces listed CHECK/UNIQUE/FK rules; many cross-row invariants are application-only or absent. Coverage is mapped in [frontend and test reference](04_FRONTEND_AND_TESTING_REFERENCE.md) and [audit](05_AUDIT_FINDINGS.md). No claim is made that tests were run during this documentation audit.

## HTTP API (`/api/v1`)

All mounted routes are in `server/src/routes`. Successful route responses use `{data: payload}`. Most successful GET/POST/PATCH/DELETE statuses are shown below. There is no auth requirement because no authentication layer is present; unauthenticated access is the current behavior. The API is a transport adapter and should not become a permanent core dependency in the Android target.

| Method and path | Request | Success |
|---|---|---|
| GET `/properties` | none | 200 `{data: properties[]}` |
| POST `/properties` | `{name,address}` | 201 `{data: property}` |
| GET `/properties/:id/occupancy?date=` | optional query date | 200 occupancy read model; missing property passes `PROPERTY_NOT_FOUND` |
| POST `/floors` | `{propertyId,displayOrder,name}` | 201 floor |
| DELETE `/floors/:id` | none | 200 `{success:true}` if empty |
| POST `/rooms` | `{floorId,roomNumber}` | 201 room |
| DELETE `/rooms/:id` | none | 200 success if empty |
| POST `/beds` | `{roomId,bedLabel,isActive?}` | 201 bed |
| PATCH `/beds/:id/toggle-active` | `{isActive}` | 200 bed / `BED_NOT_FOUND` |
| DELETE `/beds/:id` | none | 200 success if no assignment history |
| GET `/tenants?propertyId=&status=&search=&paymentStatus=` | filters | 200 tenant directory; propertyId is effectively required by query |
| POST `/tenants/move-in` | `{propertyId,bedId,name,phone,joiningDate,rentPaise,depositPaise?,dueDate?}` | 201 created records |
| POST `/tenants/:id/shift-bed` | `{targetBedId,shiftDate}` | 200 closed/new assignment |
| POST `/tenants/:id/checkout` | `{checkoutDate}` | 200 tenant and closed assignment |
| POST `/tenants/:id/collect-payment` | `{amountPaise,paidOn,paymentMethod,referenceNote?,idempotencyKey?,nextDueDateOverride?}` | 200 payment, allocations, `unallocatedPaise`, `isDuplicate` |
| POST `/tenants/:id/settle-deposit` | `{depositId?,deductions?}` | 200 deposit/settlement/deductions; route uses body depositId or path ID as depositId |
| POST `/deposits/:id/settle` | `{deductions?}` | 200 same settlement result |
| GET `/tenants/:id/ledger` | none | 200 ledger; missing tenant error |
| GET `/financials/summary?propertyId=&date=` | propertyId and optional date | 200 summary |

Property CRUD is incomplete: client `useUpdateProperty` sends PATCH `/properties/:id`, but no server handler exists (A-02). Client property settings also rely on details not shown to have a matching write endpoint. Error middleware returns `{error:{code,message,details}}`; mapped business codes yield 400/404/409; unknown errors and unrecognized SQLite errors become generic 500. Route-level request schemas are absent. Query/read response shape detail lives in source modules; the public shapes are occupancy, tenant directory, financial summary, and ledger as listed below.

### Read model shape summary

- Occupancy: property and billingCycle; summary counts/financials; nested floors → rooms → beds. Bed carries status/paymentStatus and optional tenant with current debt.
- Tenant directory: tenant identity/status/dates, nullable `currentBed`, `balances:{totalOutstandingPaise,overduePaise,advanceCreditPaise,paymentStatus}`.
- Ledger: tenant, financial totals, allocations, chronological event timeline (obligation/payment/deposit/settlement/assignment).
- Financial summary: bed counts, active tenant count, all-time bill/payment/deposit amounts plus overdue calculated at date. Date does not scope billed/collected to a month.

The complete field construction and SQL mechanics are in `server/src/core/queries/{occupancyQueries,tenantQueries,ledgerQueries,financialQueries}.js`; see A-03 for financial scope limitation.
