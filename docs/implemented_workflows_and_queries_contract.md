# Implemented Workflows and Queries Contract — Stay Ledger V1

Authoritative snapshot contract for the read queries and transactional write workflows in `Stay Ledger V1`. This specification defines the exact signatures, payload shapes, return structures, and domain error codes used by the Express transport layer (`src/routes/`, `src/middleware/errorHandler.js`) and client query hooks.

---

## 1. Read-Side Query Contracts (`src/core/queries/`)

All queries execute direct read-only SQL joins via `db.prepare(...)` returning screen-ready plain objects. They accept an optional database connection instance defaulting to `getDatabase()`.

### 1.1 `occupancyQueries.js`

#### `getPropertyOccupancyTree(propertyId, dateStr, db = getDatabase())`
- **Arguments**:
  - `propertyId` (`string`, required)
  - `dateStr` (`string`, optional, strict format `YYYY-MM-DD`, defaults to current calendar date)
  - `db` (optional connection instance)
- **Returns**: `PropertyOccupancyTree | null` (returns `null` if property is not found)

```typescript
type PropertyOccupancyTree = {
  property: {
    id: string;
    name: string;
    address: string;
  };
  asOfDate: string; // "YYYY-MM-DD"
  floors: Array<{
    id: string;
    name: string;
    displayOrder: number;
    rooms: Array<{
      id: string;
      roomNumber: string;
      beds: Array<{
        id: string;
        bedLabel: string;
        isActive: boolean;
        status: "VACANT" | "OCCUPIED" | "INACTIVE";
        tenant: {
          id: string;
          name: string;
          phone: string;
          totalOutstandingPaise: number;
          overduePaise: number;
        } | null;
      }>;
    }>;
  }>;
};
```

---

### 1.2 `tenantQueries.js`

#### `getTenantDirectory({ propertyId, status, search, paymentStatus }, db = getDatabase())`
- **Arguments**:
  - `filterObject`:
    - `propertyId` (`string`, required)
    - `status` (`"ACTIVE" | "CHECKED_OUT"`, optional)
    - `search` (`string`, optional, matches tenant name or phone)
    - `paymentStatus` (`"PAID" | "PENDING" | "OVERDUE" | "CREDIT"`, optional)
  - `db` (optional connection instance)
- **Returns**: `Array<TenantDirectoryItem>`

```typescript
type TenantDirectoryItem = {
  id: string;
  propertyId: string;
  name: string;
  phone: string;
  status: "ACTIVE" | "CHECKED_OUT";
  joiningDate: string; // "YYYY-MM-DD"
  checkoutDate: string | null; // "YYYY-MM-DD" | null
  createdAt: string;
  currentBed: {
    bedId: string;
    bedLabel: string;
    roomId: string;
    roomNumber: string;
    floorId: string;
    floorName: string;
  } | null;
  balances: {
    totalOutstandingPaise: number;
    overduePaise: number;
    advanceCreditPaise: number;
    paymentStatus: "PAID" | "PENDING" | "OVERDUE" | "CREDIT";
  };
};
```

---

### 1.3 `ledgerQueries.js`

#### `getTenantLedger(tenantId, db = getDatabase())`
- **Arguments**:
  - `tenantId` (`string`, required)
  - `db` (optional connection instance)
- **Returns**: `TenantLedger | null` (returns `null` if tenant is not found)

```typescript
type LedgerTimelineEvent =
  | {
      type: "OBLIGATION";
      id: string;
      date: string; // periodStart "YYYY-MM-DD"
      createdAt: string;
      amountPaise: number;
      details: {
        dueDate: string;
        periodStart: string;
        periodEndExclusive: string;
        allocatedPaise: number;
        remainingPaise: number;
      };
    }
  | {
      type: "PAYMENT";
      id: string;
      date: string; // paidOn "YYYY-MM-DD"
      createdAt: string;
      amountPaise: number;
      details: {
        paymentMethod: "UPI" | "CASH" | "BANK_TRANSFER" | "OTHER";
        referenceNote: string | null;
        allocatedPaise: number;
        advanceRolloverPaise: number;
      };
    }
  | {
      type: "DEPOSIT_RECEIVED";
      id: string;
      date: string; // receivedOn "YYYY-MM-DD"
      createdAt: string;
      amountPaise: number;
      details: {
        status: "HELD" | "SETTLED";
      };
    }
  | {
      type: "DEPOSIT_SETTLEMENT";
      id: string; // settlementId
      date: string; // "YYYY-MM-DD"
      createdAt: string;
      amountPaise: number; // original deposit amount
      details: {
        deductionsTotalPaise: number;
        refundPaise: number;
        remainingLiabilityPaise: number;
        deductions: Array<{
          amountPaise: number;
          reason: string;
        }>;
      };
    }
  | {
      type: "ASSIGNMENT";
      id: string;
      date: string; // startDate "YYYY-MM-DD"
      createdAt: string;
      amountPaise: 0;
      details: {
        startDate: string;
        endDateExclusive: string | null;
        location: string;
      };
    };

type TenantLedger = {
  tenant: {
    id: string;
    name: string;
    phone: string;
    status: "ACTIVE" | "CHECKED_OUT";
    joiningDate: string;
    checkoutDate: string | null;
  };
  summary: {
    totalObligationsPaise: number;
    totalPaymentsPaise: number;
    totalOutstandingPaise: number;
    advanceCreditPaise: number;
  };
  allocations: Array<{
    id: string;
    paymentId: string;
    obligationId: string;
    amountPaise: number;
    paidOn: string;
    periodStart: string;
    periodEndExclusive: string;
  }>;
  timeline: Array<LedgerTimelineEvent>;
};
```

---

### 1.4 `financialQueries.js`

#### `getFinancialSummary(propertyId, dateStr, db = getDatabase())`
- **Arguments**:
  - `propertyId` (`string`, required)
  - `dateStr` (`string`, optional, strict format `YYYY-MM-DD`, defaults to current calendar date)
  - `db` (optional connection instance)
- **Returns**: `FinancialSummary`

```typescript
type FinancialSummary = {
  propertyId: string;
  asOfDate: string; // "YYYY-MM-DD"
  beds: {
    total: number;
    active: number;
    inactive: number;
    occupied: number;
    vacant: number;
  };
  tenants: {
    activeCount: number;
  };
  financials: {
    totalBilledPaise: number;
    totalCollectedPaise: number;
    totalOutstandingPaise: number;
    overduePaise: number;
    advanceCreditPaise: number;
    heldDepositPaise: number;
    settledDepositPaise: number;
  };
};
```

---

## 2. Transactional Workflow Contracts (`src/core/workflows/`)

All multi-step write mutations run inside an atomic `db.transaction(...)` wrapper and commit or roll back in one unit.

### 2.1 `moveInWorkflow.js`

#### `moveInWorkflow(input, db = getDatabase())`
- **Input Payload**:
  ```typescript
  {
    propertyId: string;
    bedId: string;
    name: string;
    phone: string;
    joiningDate: string;         // "YYYY-MM-DD"
    rentPaise: number;           // positive integer
    depositPaise?: number;       // integer >= 0, default 0
    dueDate?: string | null;     // "YYYY-MM-DD"
  }
  ```
- **Success Return**:
  ```typescript
  {
    tenant: Tenant;
    assignment: Assignment;
    rentalTerm: RentalTerm;
    deposit: Deposit | null;
    obligation: Obligation;
  }
  ```
- **Domain & Validation Error Codes**:
  - `INVALID_RENT_AMOUNT`
  - `INVALID_DEPOSIT_AMOUNT`
  - `PROPERTY_NOT_FOUND`
  - `BED_NOT_FOUND`
  - `BED_INACTIVE`
  - `BED_ALREADY_OCCUPIED`
  - Strict date validation error if `joiningDate` or `dueDate` is not a valid strict `YYYY-MM-DD` string.

---

### 2.2 `collectPaymentWorkflow.js`

#### `collectPaymentWorkflow(input, db = getDatabase())`
- **Input Payload**:
  ```typescript
  {
    tenantId: string;
    amountPaise: number;                    // positive integer
    paidOn: string;                         // "YYYY-MM-DD"
    paymentMethod: "UPI" | "CASH" | "BANK_TRANSFER" | "OTHER";
    referenceNote?: string | null;
    idempotencyKey?: string | null;
    nextDueDateOverride?: string | null;    // "YYYY-MM-DD"
  }
  ```
- **Success Return**:
  ```typescript
  {
    payment: Payment;
    allocations: Array<PaymentAllocation>;
    unallocatedPaise: number;
    isDuplicate: boolean;
  }
  ```
- **Domain & Validation Error Codes**:
  - `INVALID_PAYMENT_AMOUNT`
  - `TENANT_NOT_FOUND`
  - Strict date validation error if `paidOn` or `nextDueDateOverride` is not strict `YYYY-MM-DD`.

---

### 2.3 `shiftBedWorkflow.js`

#### `shiftBedWorkflow(input, db = getDatabase())`
- **Input Payload**:
  ```typescript
  {
    tenantId: string;
    targetBedId: string;
    shiftDate: string; // "YYYY-MM-DD"
  }
  ```
- **Success Return**:
  ```typescript
  {
    closedAssignment: Assignment;
    newAssignment: Assignment;
  }
  ```
- **Domain & Validation Error Codes**:
  - `TENANT_NOT_FOUND`
  - `TENANT_NOT_ACTIVE`
  - `NO_ACTIVE_ASSIGNMENT`
  - `CANNOT_SHIFT_TO_SAME_BED`
  - `SHIFT_DATE_BEFORE_START_DATE`
  - `TARGET_BED_NOT_FOUND`
  - `TARGET_BED_INACTIVE`
  - `TARGET_BED_OCCUPIED`
  - Strict date validation error if `shiftDate` is not strict `YYYY-MM-DD`.

---

### 2.4 `moveOutWorkflow.js`

#### `moveOutWorkflow(input, db = getDatabase())`
- **Input Payload**:
  ```typescript
  {
    tenantId: string;
    checkoutDate: string; // "YYYY-MM-DD"
  }
  ```
- **Success Return**:
  ```typescript
  {
    tenant: Tenant;
    closedAssignment: Assignment;
  }
  ```
- **Domain & Validation Error Codes**:
  - `TENANT_NOT_FOUND`
  - `TENANT_ALREADY_CHECKED_OUT`
  - `NO_ACTIVE_ASSIGNMENT`
  - `CHECKOUT_DATE_BEFORE_START_DATE`
  - Strict date validation error if `checkoutDate` is not strict `YYYY-MM-DD`.

---

### 2.5 `settleDepositWorkflow.js`

#### `settleDepositWorkflow(input, db = getDatabase())`
- **Input Payload**:
  ```typescript
  {
    depositId: string;
    deductions?: Array<{
      amountPaise: number;
      reason: string;
    }>;
  }
  ```
- **Success Return**:
  ```typescript
  {
    deposit: Deposit;
    settlement: DepositSettlement;
    deductions: Array<{
      amountPaise: number;
      reason: string;
    }>;
  }
  ```
- **Domain & Validation Error Codes**:
  - `DEPOSIT_NOT_FOUND`
  - `DEPOSIT_ALREADY_SETTLED`
  - Policy calculation error if any deduction `amountPaise` <= 0 or `reason` is empty or whitespace-only.

---

### 2.6 `manageStructureWorkflow.js`

#### `addFloor({ propertyId, displayOrder, name }, db = getDatabase())`
- **Input Payload**: `{ propertyId: string, displayOrder: number, name: string }`
- **Success Return**: `Floor`
- **Domain & Validation Error Codes**: Foreign key violation if `propertyId` does not exist.

#### `deleteFloor(floorId, db = getDatabase())`
- **Input Payload**: `floorId: string`
- **Success Return**: `void`
- **Domain & Validation Error Codes**:
  - `FLOOR_HAS_ROOMS`

#### `addRoom({ floorId, roomNumber }, db = getDatabase())`
- **Input Payload**: `{ floorId: string, roomNumber: string }`
- **Success Return**: `Room`
- **Domain & Validation Error Codes**: Foreign key violation if `floorId` does not exist.

#### `deleteRoom(roomId, db = getDatabase())`
- **Input Payload**: `roomId: string`
- **Success Return**: `void`
- **Domain & Validation Error Codes**:
  - `ROOM_HAS_BEDS`

#### `addBed({ roomId, bedLabel, isActive = true }, db = getDatabase())`
- **Input Payload**: `{ roomId: string, bedLabel: string, isActive?: boolean }`
- **Success Return**: `Bed`
- **Domain & Validation Error Codes**: Foreign key violation if `roomId` does not exist.

#### `deleteBed(bedId, db = getDatabase())`
- **Input Payload**: `bedId: string`
- **Success Return**: `void`
- **Domain & Validation Error Codes**:
  - `BED_HAS_HISTORICAL_ASSIGNMENTS`

#### `toggleBedActive(bedId, isActive, db = getDatabase())`
- **Input Payload**: `bedId: string`, `isActive: boolean`
- **Success Return**: `Bed | null`
- **Domain & Validation Error Codes**: Returns `null` if bed is not found.