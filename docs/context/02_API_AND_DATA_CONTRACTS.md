# Stay Ledger — API and Data Contracts

This is an implementation inventory of `server/db/schema.sql`, routes, queries, workflows, and client query hooks. The server is synchronous SQLite code wrapped in async Express handlers; API success is `{ data: T }`, errors are normalized by `errorHandler`.

## Database schema

All IDs are text primary keys. Dates are text, conventionally `YYYY-MM-DD`; money fields are integer paise. Foreign keys are enabled by the connection module.

| Table | Columns and relationships | Constraints / indexes |
|---|---|---|
| `properties` | `id`, `name`, `address`, `created_at` | name/address required |
| `floors` | `id`, `property_id → properties`, `display_order`, `name` | property delete cascades |
| `rooms` | `id`, `floor_id → floors`, `room_number` | floor delete cascades |
| `beds` | `id`, `room_id → rooms`, `bed_label`, `is_active` | active 0/1; room delete cascades |
| `tenants` | `id`, `property_id → properties`, `name`, `phone`, `status`, `joining_date`, `checkout_date`, `created_at` | status ACTIVE/CHECKED_OUT; property delete RESTRICT |
| `assignments` | `id`, `tenant_id → tenants`, `bed_id → beds`, `start_date`, `end_date_exclusive` | tenant/bed deletes RESTRICT; indexes by bed+dates and tenant+dates; no DB exclusion constraint against overlap |
| `rental_terms` | `id`, `tenant_id`, `rent_paise`, `effective_from`, `effective_to_exclusive` | rent > 0; tenant delete RESTRICT |
| `obligations` | `id`, `tenant_id`, `period_start`, `period_end_exclusive`, `due_date`, `amount_paise`, nullable `rental_term_id`, `created_at` | amount > 0; unique tenant+period bounds; start < end; term delete SET NULL; index tenant+period/due |
| `payments` | `id`, `tenant_id`, `amount_paise`, `paid_on`, `payment_method`, `reference_note`, `idempotency_key`, `created_at` | amount > 0; method UPI/CASH/BANK_TRANSFER/OTHER; unique idempotency key; index tenant+paid date |
| `payment_allocations` | `id`, `payment_id → payments`, `obligation_id → obligations`, `amount_paise`, `created_at` | amount > 0; both deletes RESTRICT; indexes by obligation/payment |
| `deposits` | `id`, `tenant_id`, `amount_paise`, `received_on`, `status`, `created_at` | amount > 0; HELD/SETTLED; tenant delete RESTRICT |
| `deposit_settlements` | `id`, unique `deposit_id → deposits`, `tenant_id → tenants`, deduction/refund/liability totals, `settled_at` | totals ≥ 0; deletes RESTRICT |
| `deposit_deductions` | `id`, `settlement_id → deposit_settlements`, `amount_paise`, `reason` | amount > 0; nonblank trimmed reason; delete RESTRICT |

Indexes are explicitly listed in schema: assignments bed/tenant date ranges, obligations tenant period, allocations by obligation/payment, payments tenant/date, tenants property/status. Notably absent are uniqueness/exclusion constraints for a tenant's active assignment, bed/date overlap, room numbers per floor, or bed labels per room; workflows/queries must enforce relevant rules.

## HTTP routes (`/api/v1`)

| Method/path | Behavior / payload | Response |
|---|---|---|
| GET `/properties` | list properties | `{data: Property[]}` |
| POST `/properties` | `{name,address}` | 201 `{data: property}` |
| GET `/properties/:id/occupancy?date=` | occupancy read model at date | `{data: OccupancyTree}`; 404-style error if absent |
| POST `/floors`, DELETE `/floors/:id` | add floor body `{propertyId,displayOrder,name}`; delete only if empty | floor / `{success:true}` |
| POST `/rooms`, DELETE `/rooms/:id` | `{floorId,roomNumber}`; delete only if no beds | room / success |
| POST `/beds`, PATCH `/beds/:id/toggle-active`, DELETE `/beds/:id` | `{roomId,bedLabel,isActive?}`; toggle `{isActive}`; delete refuses historical assignment | bed / success |
| GET `/tenants?propertyId=&status=&search=&paymentStatus=` | tenant directory; propertyId required by SQL predicate | `{data: Tenant[]}` |
| POST `/tenants/move-in` | `{propertyId,bedId,name,phone,joiningDate,rentPaise,depositPaise?,dueDate?}` | 201 result with tenant, assignment, term, optional deposit, obligation |
| POST `/tenants/:id/shift-bed` | `{targetBedId,shiftDate}` | closed and new assignment |
| POST `/tenants/:id/checkout` | `{checkoutDate}` | checked-out tenant and closed assignment |
| POST `/tenants/:id/collect-payment` | `{amountPaise,paidOn,paymentMethod,referenceNote?,idempotencyKey?,nextDueDateOverride?}` | payment, allocations, unallocated amount, duplicate flag |
| GET `/tenants/:id/ledger` | no body | ledger read model; missing tenant error |
| POST `/tenants/:id/settle-deposit` or `/deposits/:id/settle` | `{depositId?,deductions:[{amountPaise,reason}]}` | updated deposit, settlement, deductions |
| GET `/financials/summary?propertyId=&date=` | property/date | summary object |

Input checking is partly in workflows and partly delegated to SQLite constraints. Do not infer comprehensive payload validation from these handlers.

## Read query inventory and response shapes

### `getPropertyOccupancyTree(propertyId, dateStr?, db?)`

Uses property lookup, a property financial aggregate with pre-aggregated allocations, and a floors→rooms→beds left-join. Assignment is active when `start_date <= date` and end is null or `end_date_exclusive > date`. Tenant debt is pre-aggregated by tenant before joining, preventing allocation-row fanout in that subquery. Returns `null` if property absent; otherwise `{propertyId,propertyName,billingCycle:{label,startDate,endDate},summary:{totalBeds,activeBeds,deactivatedBeds,occupiedBeds,vacantBeds,occupancyRate,totalMembers,unpaidMembersCount,financials:{totalObligationsPaise,totalCollectedPaise,totalPendingPaise,totalOverduePaise}},floors:[{id,number,name,displayOrder,totalBeds,activeBeds,occupiedBeds,vacantBeds,rooms:[{id,roomNumber,sharingType,totalBeds,occupiedBeds,vacantBeds,roomPendingPaise,beds:[{id,code,bedLabel,isActive,status,paymentStatus,tenant}]}]}]}`. Tenant is null for vacant/inactive beds; occupied tenant contains id/name/phone/joiningDate/outstanding/overdue/nextDueDate. Billing cycle is calendar month. Review the aggregate filter semantics before using its financial totals as a strictly month-scoped report.

### `getTenantDirectory({propertyId,status?,search?,paymentStatus?}, db?)`

Filters tenant base rows by property and optional status/name/phone search. Left joins the assignment active on current UTC date and structural labels. Debt and credit are separately grouped before joins. Returns array rows shaped `{id,propertyId,name,phone,status,joiningDate,checkoutDate,createdAt,currentBed:{bedId,bedLabel,roomId,roomNumber,floorId,floorName}|null,balances:{totalOutstandingPaise,overduePaise,advanceCreditPaise,paymentStatus}}`. Payment status is OVERDUE, PENDING, CREDIT, or PAID in that precedence. `paymentStatus` is filtered in JS after mapping. Exact filtering depends on current date, not a supplied date.

### `getTenantLedger(tenantId, db?)`

Reads tenant, obligations grouped per obligation, payments grouped per payment, allocations, deposits/settlements, deductions, assignments. It creates a sorted `timeline` of OBLIGATION, PAYMENT, DEPOSIT_RECEIVED, DEPOSIT_SETTLEMENT, ASSIGNMENT records. Returns `null` if tenant missing, otherwise `{tenant:{id,name,phone,status,joiningDate,checkoutDate},summary:{totalObligationsPaise,totalPaymentsPaise,totalOutstandingPaise,advanceCreditPaise},allocations:[{id,paymentId,obligationId,amountPaise,paidOn,periodStart,periodEndExclusive}],timeline:[{type,id,date,createdAt,amountPaise,details}]}`. For payment, `advanceRolloverPaise` is payment amount less its allocations; settlement timeline includes refund, deductions, liability, and deduction details.

### `getFinancialSummary(propertyId, dateStr?, db?)`

Runs separate aggregates for bed occupancy as-of date, active tenant count, all obligations and allocations, all payments/advance, and deposits by status. Returns `{propertyId,asOfDate,beds:{total,active,inactive,occupied,vacant},tenants:{activeCount},financials:{totalBilledPaise,totalCollectedPaise,totalOutstandingPaise,overduePaise,advanceCreditPaise,heldDepositPaise,settledDepositPaise}}`. Financial values are lifetime totals except overdue is evaluated against `date`; it is not a month-filtered summary.

## Transactional workflows

All named workflows below use a better-sqlite3 transaction where multiple writes occur. Throwing rolls back writes inside that transaction. Error codes below are literal `Error.message` values in the implementation; the middleware maps errors to HTTP responses.

| Workflow | Important validation / emitted errors |
|---|---|
| `moveInWorkflow` | validates joining/due date shape and positive integer rent, nonnegative integer deposit; property/bed exist, bed active and unoccupied. Codes: `INVALID_RENT_AMOUNT`, `INVALID_DEPOSIT_AMOUNT`, `PROPERTY_NOT_FOUND`, `BED_NOT_FOUND`, `BED_INACTIVE`, `BED_ALREADY_OCCUPIED`. Creates tenant, assignment, term, optional held deposit, first obligation atomically. |
| `collectPaymentWorkflow` | date validation, positive integer amount; tenant must exist. Idempotency key returns prior payment/allocations as duplicate. Generates eligible obligations through paidOn, allocates oldest outstanding first, records payment and allocations atomically. Codes include `INVALID_PAYMENT_AMOUNT`, `TENANT_NOT_FOUND`; payment method/foreign-key/unique failures may surface from SQLite. |
| `shiftBedWorkflow` | date shape, active tenant and assignment, target differs/existing/active, shift not before current assignment; target must be free. Codes: `TENANT_NOT_FOUND`, `TENANT_NOT_ACTIVE`, `NO_ACTIVE_ASSIGNMENT`, `CANNOT_SHIFT_TO_SAME_BED`, `SHIFT_DATE_BEFORE_START_DATE`, `TARGET_BED_NOT_FOUND`, `TARGET_BED_INACTIVE`, `TARGET_BED_OCCUPIED`. Closes old and inserts new assignment atomically. |
| `moveOutWorkflow` | valid date, tenant exists/not checked out, active assignment exists, checkout not before assignment start. Closes assignment/current rental term and marks tenant checked out atomically. Codes: `TENANT_NOT_FOUND`, `TENANT_ALREADY_CHECKED_OUT`, `NO_ACTIVE_ASSIGNMENT`, `CHECKOUT_DATE_BEFORE_START_DATE`. It does not settle deposit itself. |
| `settleDepositWorkflow` | deposit exists and not settled; `calculateDepositSettlement` validates/calculates deductions. Codes: `DEPOSIT_NOT_FOUND`, `DEPOSIT_ALREADY_SETTLED`; policy errors apply to invalid deductions. Inserts settlement/deductions and marks deposit settled atomically. |
| `manageStructureWorkflow` | add floor/room/bed forwards data to repositories; delete floor requires no rooms (`FLOOR_HAS_ROOMS`), room no beds (`ROOM_HAS_BEDS`), bed must have no historical assignments (`BED_HAS_HISTORICAL_ASSIGNMENTS`); toggle updates active flag. Add operations are not wrapped in explicit multi-step transactions. |

Date utility currently validates canonical calendar dates; inspect `server/src/core/policies/dateUtils.js` for exact accepted format before extending. API-level schemas and uniform error-code mapping should be strengthened as a separate hardening item.

## TanStack Query keys and invalidation

Key factory (`client/src/api/queryKeys.js`):

- `properties.all = ['properties']`; `properties.detail(id) = ['properties',id]`
- `properties.occupancy(propertyId,date) = ['properties',propertyId,'occupancy',date ?? 'latest']`
- `properties.financials(propertyId,date) = ['properties',propertyId,'financials',date ?? 'latest']`
- `tenants.all = ['tenants']`; `tenants.list(filters) = ['tenants','list',filters]`; `tenants.ledger(id) = ['tenants',id,'ledger']`

Read hooks use properties/all, occupancy, financials, tenant list, and tenant ledger keys. Mutation hooks for checkout and payment collection invalidate occupancy/financials for the property and tenant directory/ledger as applicable. Inspect `client/src/data/mutations/` before adding a new mutation; structure mutation hooks should also invalidate properties and occupancy to keep tree screens fresh. There is no dedicated payments key family.
