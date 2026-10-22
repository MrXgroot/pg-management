# Historical snapshot — superseded by [docs/README.md](README.md) and its [current persistence/core reference](context/03_DATABASE_AND_CORE_REFERENCE.md). Kept for history; source code is authoritative.

# Implemented Repositories Contract Snapshot — Stay Ledger V1

This document is the authoritative implementation specification for the verified database schema, pure policies, and persistence repositories in `stay-ledger-v1`. Use this specification directly to construct transactional write workflows (`server/src/core/workflows/`) and read-side queries (`server/src/core/queries/`).

---

## 1. Database Schema Summary

SQLite engine configurations on all active connections:
```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA busy_timeout = 5000;
```

### Table DDL, Foreign Keys & Constraints

```sql
CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS floors (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  floor_id TEXT NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS beds (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  bed_label TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))
);

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'CHECKED_OUT')),
  joining_date TEXT NOT NULL,
  checkout_date TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  bed_id TEXT NOT NULL REFERENCES beds(id) ON DELETE RESTRICT,
  start_date TEXT NOT NULL,
  end_date_exclusive TEXT
);

CREATE TABLE IF NOT EXISTS rental_terms (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  rent_paise INTEGER NOT NULL CHECK (rent_paise > 0),
  effective_from TEXT NOT NULL,
  effective_to_exclusive TEXT
);

CREATE TABLE IF NOT EXISTS obligations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  period_start TEXT NOT NULL,
  period_end_exclusive TEXT NOT NULL,
  due_date TEXT NOT NULL,
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  rental_term_id TEXT REFERENCES rental_terms(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  UNIQUE (tenant_id, period_start, period_end_exclusive),
  CHECK (period_start < period_end_exclusive)
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  paid_on TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('UPI', 'CASH', 'BANK_TRANSFER', 'OTHER')),
  reference_note TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS payment_allocations (
  id TEXT PRIMARY KEY,
  payment_id TEXT NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  obligation_id TEXT NOT NULL REFERENCES obligations(id) ON DELETE RESTRICT,
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS deposits (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  received_on TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('HELD', 'SETTLED')),
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS deposit_settlements (
  id TEXT PRIMARY KEY,
  deposit_id TEXT NOT NULL UNIQUE REFERENCES deposits(id) ON DELETE RESTRICT,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  deductions_total_paise INTEGER NOT NULL DEFAULT 0 CHECK (deductions_total_paise >= 0),
  refund_paise INTEGER NOT NULL DEFAULT 0 CHECK (refund_paise >= 0),
  remaining_liability_paise INTEGER NOT NULL DEFAULT 0 CHECK (remaining_liability_paise >= 0),
  settled_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS deposit_deductions (
  id TEXT PRIMARY KEY,
  settlement_id TEXT NOT NULL REFERENCES deposit_settlements(id) ON DELETE RESTRICT,
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  reason TEXT NOT NULL CHECK (length(trim(reason)) > 0)
);
```

### Performance & Uniqueness Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_assignments_bed_dates
  ON assignments(bed_id, start_date, end_date_exclusive);

CREATE INDEX IF NOT EXISTS idx_assignments_tenant_dates
  ON assignments(tenant_id, start_date, end_date_exclusive);

CREATE UNIQUE INDEX IF NOT EXISTS idx_assignments_single_active_bed
  ON assignments(bed_id) WHERE end_date_exclusive IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_assignments_single_active_tenant
  ON assignments(tenant_id) WHERE end_date_exclusive IS NULL;

CREATE INDEX IF NOT EXISTS idx_obligations_tenant_period
  ON obligations(tenant_id, period_start, due_date);

CREATE INDEX IF NOT EXISTS idx_allocations_obligation
  ON payment_allocations(obligation_id);

CREATE INDEX IF NOT EXISTS idx_allocations_payment
  ON payment_allocations(payment_id);

CREATE INDEX IF NOT EXISTS idx_payments_tenant_date
  ON payments(tenant_id, paid_on);

CREATE INDEX IF NOT EXISTS idx_tenants_property_status
  ON tenants(property_id, status);
```

---

## 2. Pure Policy Contracts (`src/core/policies/`)

Policies contain no I/O, no database imports, and no Express dependencies.

### `dateUtils.js`

#### `isValidDateString(dateStr)`
- **Input:** `dateStr` (`string`)
- **Output:** `boolean`
- **Behavior:** Validates strict format `YYYY-MM-DD`, validating month days and leap-year February.

#### `assertValidDate(dateStr, fieldName = 'date')`
- **Input:** `dateStr` (`string`), `fieldName` (`string`, optional)
- **Output:** `void`
- **Errors Thrown:** Throws `Error('Invalid calendar date for [fieldName]: "[dateStr]". Must be a valid strict YYYY-MM-DD date.')` if invalid.

#### `addMonthsPreservingAnchor(startDateStr, monthsToAdd, anchorDay)`
- **Input:** `startDateStr` (`string`, `YYYY-MM-DD`), `monthsToAdd` (`number`, integer), `anchorDay` (`number`, integer 1-31)
- **Output:** `string` (`YYYY-MM-DD`)
- **Behavior:** Increments calendar month, clamping anchor day to the last valid day of shorter months (e.g., Jan 31 + 1 month -> Feb 28/29; Jan 31 + 2 months -> Mar 31).
- **Errors Thrown:** Throws `Error` if `anchorDay` is not an integer between 1 and 31.

#### `intervalsOverlap(startA, endA, startB, endB)`
- **Input:** `startA` (`string`), `endA` (`string|null`), `startB` (`string`), `endB` (`string|null`)
- **Output:** `boolean`
- **Behavior:** Evaluates half-open intervals `[start, end)`. Adjacent boundaries where `endA === startB` return `false`. `null` indicates an open-ended/active interval.
- **Errors Thrown:** Throws `Error` if `endA && startA >= endA` or `endB && startB >= endB`.

---

### `billingPolicy.js`

#### `computeNextBillingPeriod({ currentPeriodStart, anchorDay, checkoutDate = null, dueDateOffsetDays = 0 })`
- **Input Object:**
  - `currentPeriodStart`: `string` (`YYYY-MM-DD`)
  - `anchorDay`: `number` (integer 1-31)
  - `checkoutDate`: `string|null` (optional)
  - `dueDateOffsetDays`: `number` (optional, default `0`)
- **Output:** `null` OR plain object:
  ```javascript
  {
    periodStart: string,          // 'YYYY-MM-DD'
    periodEndExclusive: string,   // 'YYYY-MM-DD'
    dueDate: string               // 'YYYY-MM-DD'
  }
  ```
- **Behavior:** Returns `null` if `checkoutDate` is provided and `currentPeriodStart >= checkoutDate`. Otherwise computes the 1-month interval preserving `anchorDay`.

---

### `allocationPolicy.js`

#### `allocatePayment(paymentAmountPaise, outstandingObligations = [])`
- **Input Parameters:**
  - `paymentAmountPaise`: `number` (positive integer)
  - `outstandingObligations`: `Array<{ id: string, amountPaise: number, allocatedPaise: number }>` (sorted in FIFO order)
- **Output:** Plain object:
  ```javascript
  {
    allocations: Array<{
      obligationId: string,
      amountPaise: number
    }>,
    unallocatedPaise: number     // Advance credit remainder
  }
  ```
- **Behavior:** Distributes funds to obligations in order. Caps allocation per obligation to `amountPaise - allocatedPaise`. Remainder becomes `unallocatedPaise`.
- **Errors Thrown:** Throws `Error` if `paymentAmountPaise` is not a positive integer.

---

### `depositPolicy.js`

#### `calculateDepositSettlement(depositAmountPaise, deductions = [])`
- **Input Parameters:**
  - `depositAmountPaise`: `number` (positive integer)
  - `deductions`: `Array<{ amountPaise: number, reason: string }>`
- **Output:** Plain object:
  ```javascript
  {
    deductionsTotalPaise: number,
    refundPaise: number,
    remainingLiabilityPaise: number
  }
  ```
- **Behavior:** Sums deductions; `refundPaise = max(0, deposit - deductions)`; `remainingLiabilityPaise = max(0, deductions - deposit)`.
- **Errors Thrown:**
  - Throws `Error` if `depositAmountPaise` is not a positive integer.
  - Throws `Error` if any deduction `amountPaise` is not a positive integer.
  - Throws `Error` if any deduction `reason` is empty or whitespace-only.

---

## 3. Repository Contracts (`src/core/repos/`)

All repositories export direct ES functions. The optional `db` parameter defaults to `getDatabase()` from `server/db/connection.js`. Workflows pass transaction-bound database instances (`db.transaction(fn)`) to this parameter.

All snake_case columns are mapped to camelCase. All IDs are strings. All money fields are integer paise.

---

### 1. `propertyRepo.js`

* **`getAll(db = getDatabase())`**
  - **Returns:** `Array<Property>`
* **`findById(id, db = getDatabase())`**
  - **Returns:** `Property | null`
* **`insert(property, db = getDatabase())`**
  - **Input:** `{ id: string, name: string, address: string }`
  - **Returns:** `Property`
* **`update(id, changes, db = getDatabase())`**
  - **Input:** `id: string`, `changes: { name?: string, address?: string }`
  - **Returns:** `Property | null`

#### Return Type: `Property`
```javascript
{
  id: string,
  name: string,
  address: string,
  createdAt: string
}
```

---

### 2. `floorRepo.js`

* **`findById(id, db = getDatabase())`**
  - **Returns:** `Floor | null`
* **`findByPropertyId(propertyId, db = getDatabase())`**
  - **Returns:** `Array<Floor>` (ordered by `displayOrder ASC`)
* **`insert(floor, db = getDatabase())`**
  - **Input:** `{ id: string, propertyId: string, displayOrder: number, name: string }`
  - **Returns:** `Floor`
* **`update(id, changes, db = getDatabase())`**
  - **Input:** `id: string`, `changes: { name?: string, displayOrder?: number }`
  - **Returns:** `Floor | null`
* **`remove(id, db = getDatabase())`**
  - **Input:** `id: string`
  - **Returns:** `void`
  - **Errors Thrown:** Throws `Error('Cannot delete floor [id]: floor contains child rooms.')` if rooms reference this floor.

#### Return Type: `Floor`
```javascript
{
  id: string,
  propertyId: string,
  displayOrder: number,
  name: string
}
```

---

### 3. `roomRepo.js`

* **`findById(id, db = getDatabase())`**
  - **Returns:** `Room | null`
* **`findByFloorId(floorId, db = getDatabase())`**
  - **Returns:** `Array<Room>` (ordered by `roomNumber ASC`)
* **`insert(room, db = getDatabase())`**
  - **Input:** `{ id: string, floorId: string, roomNumber: string }`
  - **Returns:** `Room`
* **`update(id, changes, db = getDatabase())`**
  - **Input:** `id: string`, `changes: { roomNumber?: string }`
  - **Returns:** `Room | null`
* **`remove(id, db = getDatabase())`**
  - **Input:** `id: string`
  - **Returns:** `void`
  - **Errors Thrown:** Throws `Error('Cannot delete room [id]: room contains child beds.')` if beds reference this room.

#### Return Type: `Room`
```javascript
{
  id: string,
  floorId: string,
  roomNumber: string
}
```

---

### 4. `bedRepo.js`

* **`findById(id, db = getDatabase())`**
  - **Returns:** `Bed | null`
* **`findByRoomId(roomId, db = getDatabase())`**
  - **Returns:** `Array<Bed>` (ordered by `bedLabel ASC`)
* **`insert(bed, db = getDatabase())`**
  - **Input:** `{ id: string, roomId: string, bedLabel: string, isActive?: boolean }`
  - **Returns:** `Bed`
* **`update(id, changes, db = getDatabase())`**
  - **Input:** `id: string`, `changes: { bedLabel?: string, isActive?: boolean }`
  - **Returns:** `Bed | null`
* **`setActive(id, isActive, db = getDatabase())`**
  - **Input:** `id: string`, `isActive: boolean`
  - **Returns:** `Bed | null`
* **`remove(id, db = getDatabase())`**
  - **Input:** `id: string`
  - **Returns:** `void`
  - **Errors Thrown:** Throws `Error('Cannot delete bed [id]: historical assignments exist. Deactivate it instead.')` if assignments reference this bed.

#### Return Type: `Bed`
```javascript
{
  id: string,
  roomId: string,
  bedLabel: string,
  isActive: boolean
}
```

---

### 5. `tenantRepo.js`

* **`findById(id, db = getDatabase())`**
  - **Returns:** `Tenant | null`
* **`findDirectory({ propertyId, status, search }, db = getDatabase())`**
  - **Input:** `{ propertyId: string, status?: 'ACTIVE' | 'CHECKED_OUT', search?: string }`
  - **Returns:** `Array<Tenant>` (ordered by `createdAt DESC`)
* **`insert(tenant, db = getDatabase())`**
  - **Input:** `{ id: string, propertyId: string, name: string, phone: string, status?: 'ACTIVE' | 'CHECKED_OUT', joiningDate: string, checkoutDate?: string | null }`
  - **Returns:** `Tenant`
* **`updateContactDetails(id, changes, db = getDatabase())`**
  - **Input:** `id: string`, `changes: { name?: string, phone?: string }`
  - **Returns:** `Tenant | null`
* **`updateStatus(id, { status, checkoutDate }, db = getDatabase())`**
  - **Input:** `id: string`, `{ status: 'ACTIVE' | 'CHECKED_OUT', checkoutDate?: string | null }`
  - **Returns:** `Tenant | null`

#### Return Type: `Tenant`
```javascript
{
  id: string,
  propertyId: string,
  name: string,
  phone: string,
  status: 'ACTIVE' | 'CHECKED_OUT',
  joiningDate: string,
  checkoutDate: string | null,
  createdAt: string
}
```

---

### 6. `assignmentRepo.js`

* **`findById(id, db = getDatabase())`**
  - **Returns:** `Assignment | null`
* **`findActiveByBedId(bedId, db = getDatabase())`**
  - **Returns:** `Assignment | null` (where `endDateExclusive IS NULL`)
* **`findActiveByTenantId(tenantId, db = getDatabase())`**
  - **Returns:** `Assignment | null` (where `endDateExclusive IS NULL`)
* **`findOverlapsForBed({ bedId, startDate, endDateExclusive }, db = getDatabase())`**
  - **Input:** `{ bedId: string, startDate: string, endDateExclusive: string | null }`
  - **Returns:** `Array<Assignment>` matching half-open interval overlap
* **`findOverlapsForTenant({ tenantId, startDate, endDateExclusive }, db = getDatabase())`**
  - **Input:** `{ tenantId: string, startDate: string, endDateExclusive: string | null }`
  - **Returns:** `Array<Assignment>` matching half-open interval overlap
* **`insert(assignment, db = getDatabase())`**
  - **Input:** `{ id: string, tenantId: string, bedId: string, startDate: string, endDateExclusive?: string | null }`
  - **Returns:** `Assignment`
* **`close(id, endDateExclusive, db = getDatabase())`**
  - **Input:** `id: string`, `endDateExclusive: string`
  - **Returns:** `Assignment | null`

#### Return Type: `Assignment`
```javascript
{
  id: string,
  tenantId: string,
  bedId: string,
  startDate: string,
  endDateExclusive: string | null
}
```

---

### 7. `rentalTermRepo.js`

* **`findById(id, db = getDatabase())`**
  - **Returns:** `RentalTerm | null`
* **`findByTenantId(tenantId, db = getDatabase())`**
  - **Returns:** `Array<RentalTerm>` (ordered by `effectiveFrom ASC`)
* **`findActiveByTenantId(tenantId, date, db = getDatabase())`**
  - **Input:** `tenantId: string`, `date: string`
  - **Returns:** `RentalTerm | null` active at `date`
* **`insert(term, db = getDatabase())`**
  - **Input:** `{ id: string, tenantId: string, rentPaise: number, effectiveFrom: string, effectiveToExclusive?: string | null }`
  - **Returns:** `RentalTerm`
* **`closeAt(id, effectiveToExclusive, db = getDatabase())`**
  - **Input:** `id: string`, `effectiveToExclusive: string`
  - **Returns:** `RentalTerm | null`

#### Return Type: `RentalTerm`
```javascript
{
  id: string,
  tenantId: string,
  rentPaise: number,
  effectiveFrom: string,
  effectiveToExclusive: string | null
}
```

---

### 8. `obligationRepo.js`

* **`findById(id, db = getDatabase())`**
  - **Returns:** `Obligation | null`
* **`findByTenantId(tenantId, db = getDatabase())`**
  - **Returns:** `Array<Obligation>` (ordered by `periodStart ASC`)
* **`findOutstandingByTenantId(tenantId, db = getDatabase())`**
  - **Input:** `tenantId: string`
  - **Returns:** `Array<ObligationWithAllocated>` in FIFO order (`periodStart ASC, dueDate ASC, id ASC`) where `allocatedPaise < amountPaise`.
* **`findLatestBoundaryByTenantId(tenantId, db = getDatabase())`**
  - **Input:** `tenantId: string`
  - **Returns:** `Obligation | null` with the greatest `periodEndExclusive`.
* **`insert(obligation, db = getDatabase())`**
  - **Input:** `{ id: string, tenantId: string, periodStart: string, periodEndExclusive: string, dueDate: string, amountPaise: number, rentalTermId?: string | null }`
  - **Returns:** `Obligation`
* **`insertIfPeriodMissing(obligation, db = getDatabase())`**
  - **Input:** Same as `insert`.
  - **Returns:** Existing `Obligation` if found for `(tenantId, periodStart, periodEndExclusive)`; otherwise inserts and returns the new `Obligation`.
* **`updateDueDate(id, dueDate, db = getDatabase())`**
  - **Input:** `id: string`, `dueDate: string`
  - **Returns:** `Obligation | null`

#### Return Type: `Obligation`
```javascript
{
  id: string,
  tenantId: string,
  periodStart: string,
  periodEndExclusive: string,
  dueDate: string,
  amountPaise: number,
  rentalTermId: string | null,
  createdAt: string,
  allocatedPaise?: number       // Defined when retrieved via findOutstandingByTenantId
}
```

---

### 9. `paymentRepo.js`

* **`findById(id, db = getDatabase())`**
  - **Returns:** `Payment | null`
* **`findByTenantId(tenantId, db = getDatabase())`**
  - **Returns:** `Array<Payment>` (ordered by `paidOn ASC`)
* **`findByIdempotencyKey(key, db = getDatabase())`**
  - **Input:** `key: string`
  - **Returns:** `Payment | null`
* **`insert(payment, db = getDatabase())`**
  - **Input:** `{ id: string, tenantId: string, amountPaise: number, paidOn: string, paymentMethod: 'UPI' | 'CASH' | 'BANK_TRANSFER' | 'OTHER', referenceNote?: string | null, idempotencyKey?: string | null }`
  - **Returns:** `Payment`

#### Return Type: `Payment`
```javascript
{
  id: string,
  tenantId: string,
  amountPaise: number,
  paidOn: string,
  paymentMethod: 'UPI' | 'CASH' | 'BANK_TRANSFER' | 'OTHER',
  referenceNote: string | null,
  idempotencyKey: string | null,
  createdAt: string
}
```

---

### 10. `paymentAllocationRepo.js`

* **`findByPaymentId(paymentId, db = getDatabase())`**
  - **Returns:** `Array<PaymentAllocation>`
* **`findByObligationId(obligationId, db = getDatabase())`**
  - **Returns:** `Array<PaymentAllocation>`
* **`sumByPaymentId(paymentId, db = getDatabase())`**
  - **Returns:** `number` (total allocated in paise)
* **`sumByObligationIds(obligationIds = [], db = getDatabase())`**
  - **Input:** `Array<string>`
  - **Returns:** `number` (total allocated in paise)
* **`insertMany(allocations, db = getDatabase())`**
  - **Input:** `Array<{ id: string, paymentId: string, obligationId: string, amountPaise: number }>`
  - **Returns:** `void`

#### Return Type: `PaymentAllocation`
```javascript
{
  id: string,
  paymentId: string,
  obligationId: string,
  amountPaise: number,
  createdAt: string
}
```

---

### 11. `depositRepo.js`

* **`findById(id, db = getDatabase())`**
  - **Returns:** `Deposit | null`
* **`findByTenantId(tenantId, db = getDatabase())`**
  - **Returns:** `Array<Deposit>` (ordered by `receivedOn ASC`)
* **`insert(deposit, db = getDatabase())`**
  - **Input:** `{ id: string, tenantId: string, amountPaise: number, receivedOn: string, status?: 'HELD' | 'SETTLED' }`
  - **Returns:** `Deposit`
* **`markSettled(id, db = getDatabase())`**
  - **Input:** `id: string`
  - **Returns:** `Deposit | null`

#### Return Type: `Deposit`
```javascript
{
  id: string,
  tenantId: string,
  amountPaise: number,
  receivedOn: string,
  status: 'HELD' | 'SETTLED',
  createdAt: string
}
```

---

### 12. `depositSettlementRepo.js`

* **`findByDepositId(depositId, db = getDatabase())`**
  - **Returns:** `DepositSettlement | null`
* **`insert(settlement, db = getDatabase())`**
  - **Input:** `{ id: string, depositId: string, tenantId: string, deductionsTotalPaise: number, refundPaise: number, remainingLiabilityPaise: number }`
  - **Returns:** `DepositSettlement`

#### Return Type: `DepositSettlement`
```javascript
{
  id: string,
  depositId: string,
  tenantId: string,
  deductionsTotalPaise: number,
  refundPaise: number,
  remainingLiabilityPaise: number,
  settledAt: string
}
```

---

### 13. `depositDeductionRepo.js`

* **`findBySettlementId(settlementId, db = getDatabase())`**
  - **Returns:** `Array<DepositDeduction>`
* **`insertMany(deductions, db = getDatabase())`**
  - **Input:** `Array<{ id: string, settlementId: string, amountPaise: number, reason: string }>`
  - **Returns:** `void`

#### Return Type: `DepositDeduction`
```javascript
{
  id: string,
  settlementId: string,
  amountPaise: number,
  reason: string
}
```

---

## 4. Workflows Integration Rules

1. Every write workflow (`moveInWorkflow`, `collectPaymentWorkflow`, `shiftBedWorkflow`, `moveOutWorkflow`, `settleDepositWorkflow`, `manageStructureWorkflow`) must wrap multi-entity mutations inside:
   ```javascript
   const result = db.transaction(() => {
     // calls to repositories passing the transactional 'db' reference
   })();
   ```
2. Read operations or screen assemblies belong in query files (`server/src/core/queries/`) using direct SQL joins and aggregates, not multi-repo write workflows.
3. Repositories must never be imported into each other. Only workflows coordinate cross-repository actions.
