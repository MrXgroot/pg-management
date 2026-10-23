# Historical snapshot — retained for history. Use the [current documentation index](../README.md) and [domain/API reference](../context/02_API_AND_DATA_CONTRACTS.md); this snapshot is not authoritative.

# Implemented API and Client Contracts — Stay Ledger V1

Authoritative API contract, payload schemas, TanStack Query cache policies, and shared client utilities for the React client application (`client/src/`) connecting to the Stay Ledger V1 Express backend (`/api/v1`).

---

## 1. API Client & Endpoint Inventory

All endpoints are mounted under the base prefix: `/api/v1`.  
All successful responses return HTTP `200 OK` (or `201 Created` for resource creation) wrapped inside a top-level `{ data: T }` envelope. In the specifications below, **Payload** indicates the incoming JSON body, and **Response Shape** details the unwrapped content of `response.data.data`.

### 1.1 Property & Physical Structure Endpoints

#### `GET /api/v1/properties`
- **Query Params**: None
- **Response Shape**:
  ```typescript
  Array<{
    id: string;
    name: string;
    address: string;
    createdAt: string;
  }>
  ```

#### `POST /api/v1/properties`
- **Status**: `201 Created`
- **Request Body**:
  ```json
  {
    "name": "Green Valley PG",
    "address": "123 Outer Ring Rd, Bellandur, Bengaluru"
  }
  ```
- **Response Shape**:
  ```typescript
  {
    id: string;
    name: string;
    address: string;
    createdAt: string;
  }
  ```

#### `GET /api/v1/properties/:id/occupancy`
- **Route Params**: `id` (`string`, property ID)
- **Query Params**: `date` (optional, `YYYY-MM-DD`, defaults to current date)
- **Response Shape**:
  ```typescript
  {
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
  }
  ```

#### `POST /api/v1/floors`
- **Status**: `201 Created`
- **Request Body**:
  ```json
  {
    "propertyId": "prop_001",
    "displayOrder": 1,
    "name": "1st Floor"
  }
  ```
- **Response Shape**:
  ```typescript
  {
    id: string;
    propertyId: string;
    displayOrder: number;
    name: string;
  }
  ```

#### `DELETE /api/v1/floors/:id`
- **Route Params**: `id` (`string`, floor ID)
- **Response Shape**: `{ success: true }`

#### `POST /api/v1/rooms`
- **Status**: `201 Created`
- **Request Body**:
  ```json
  {
    "floorId": "fl_01",
    "roomNumber": "101"
  }
  ```
- **Response Shape**:
  ```typescript
  {
    id: string;
    floorId: string;
    roomNumber: string;
  }
  ```

#### `DELETE /api/v1/rooms/:id`
- **Route Params**: `id` (`string`, room ID)
- **Response Shape**: `{ success: true }`

#### `POST /api/v1/beds`
- **Status**: `201 Created`
- **Request Body**:
  ```json
  {
    "roomId": "rm_101",
    "bedLabel": "Bed A",
    "isActive": true
  }
  ```
- **Response Shape**:
  ```typescript
  {
    id: string;
    roomId: string;
    bedLabel: string;
    isActive: boolean;
  }
  ```

#### `PATCH /api/v1/beds/:id/toggle-active`
- **Route Params**: `id` (`string`, bed ID)
- **Request Body**:
  ```json
  {
    "isActive": false
  }
  ```
- **Response Shape**:
  ```typescript
  {
    id: string;
    roomId: string;
    bedLabel: string;
    isActive: boolean;
  }
  ```

#### `DELETE /api/v1/beds/:id`
- **Route Params**: `id` (`string`, bed ID)
- **Response Shape**: `{ success: true }`

---

### 1.2 Tenant Lifecycle Endpoints

#### `GET /api/v1/tenants`
- **Query Params**:
  - `propertyId` (`string`, required)
  - `status` (`ACTIVE` | `CHECKED_OUT`, optional)
  - `search` (`string`, optional)
  - `paymentStatus` (`PAID` | `PENDING` | `OVERDUE` | `CREDIT`, optional)
- **Response Shape**:
  ```typescript
  Array<{
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
  }>
  ```

#### `POST /api/v1/tenants/move-in`
- **Status**: `201 Created`
- **Request Body**:
  ```json
  {
    "propertyId": "prop_001",
    "bedId": "bed_101_A",
    "name": "Rahul Sharma",
    "phone": "9876543210",
    "joiningDate": "2026-10-01",
    "rentPaise": 800000,
    "depositPaise": 1000000,
    "dueDate": "2026-10-05"
  }
  ```
- **Response Shape**:
  ```typescript
  {
    tenant: {
      id: string;
      propertyId: string;
      name: string;
      phone: string;
      status: "ACTIVE";
      joiningDate: string;
      checkoutDate: null;
      createdAt: string;
    };
    assignment: {
      id: string;
      tenantId: string;
      bedId: string;
      startDate: string;
      endDateExclusive: null;
    };
    rentalTerm: {
      id: string;
      tenantId: string;
      rentPaise: number;
      effectiveFrom: string;
      effectiveToExclusive: null;
    };
    deposit: {
      id: string;
      tenantId: string;
      amountPaise: number;
      receivedOn: string;
      status: "HELD";
    } | null;
    obligation: {
      id: string;
      tenantId: string;
      periodStart: string;
      periodEndExclusive: string;
      dueDate: string;
      amountPaise: number;
    };
  }
  ```

#### `POST /api/v1/tenants/:id/shift-bed`
- **Route Params**: `id` (`string`, tenant ID)
- **Request Body**:
  ```json
  {
    "targetBedId": "bed_101_B",
    "shiftDate": "2026-10-15"
  }
  ```
- **Response Shape**:
  ```typescript
  {
    closedAssignment: {
      id: string;
      tenantId: string;
      bedId: string;
      startDate: string;
      endDateExclusive: string;
    };
    newAssignment: {
      id: string;
      tenantId: string;
      bedId: string;
      startDate: string;
      endDateExclusive: null;
    };
  }
  ```

#### `POST /api/v1/tenants/:id/checkout`
- **Route Params**: `id` (`string`, tenant ID)
- **Request Body**:
  ```json
  {
    "checkoutDate": "2026-11-01"
  }
  ```
- **Response Shape**:
  ```typescript
  {
    tenant: {
      id: string;
      status: "CHECKED_OUT";
      checkoutDate: string;
    };
    closedAssignment: {
      id: string;
      endDateExclusive: string;
    };
  }
  ```

---

### 1.3 Payments, Settlements & Financial Endpoints

#### `POST /api/v1/tenants/:id/collect-payment`
- **Route Params**: `id` (`string`, tenant ID)
- **Request Body**:
  ```json
  {
    "amountPaise": 1000000,
    "paidOn": "2026-10-02",
    "paymentMethod": "UPI",
    "referenceNote": "GPay ref #987213",
    "idempotencyKey": "pay_req_897123",
    "nextDueDateOverride": null
  }
  ```
- **Response Shape**:
  ```typescript
  {
    payment: {
      id: string;
      tenantId: string;
      amountPaise: number;
      paidOn: string;
      paymentMethod: "UPI" | "CASH" | "BANK_TRANSFER" | "OTHER";
      referenceNote: string | null;
      idempotencyKey: string | null;
    };
    allocations: Array<{
      id: string;
      paymentId: string;
      obligationId: string;
      amountPaise: number;
    }>;
    unallocatedPaise: number;
    isDuplicate: boolean;
  }
  ```

#### `POST /api/v1/tenants/:id/settle-deposit` (or `/api/v1/deposits/:id/settle`)
- **Route Params**: `id` (`string`, tenant ID or deposit ID)
- **Request Body**:
  ```json
  {
    "depositId": "dep_001",
    "deductions": [
      {
        "amountPaise": 150000,
        "reason": "Deep room cleaning fee"
      },
      {
        "amountPaise": 50000,
        "reason": "Lost cupboard key replacement"
      }
    ]
  }
  ```
- **Response Shape**:
  ```typescript
  {
    deposit: {
      id: string;
      tenantId: string;
      amountPaise: number;
      status: "SETTLED";
    };
    settlement: {
      id: string;
      depositId: string;
      tenantId: string;
      deductionsTotalPaise: number;
      refundPaise: number;
      remainingLiabilityPaise: number;
    };
    deductions: Array<{
      amountPaise: number;
      reason: string;
    }>;
  }
  ```

#### `GET /api/v1/tenants/:id/ledger`
- **Route Params**: `id` (`string`, tenant ID)
- **Response Shape**:
  ```typescript
  {
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
    timeline: Array<{
      type: "OBLIGATION" | "PAYMENT" | "DEPOSIT_RECEIVED" | "DEPOSIT_SETTLEMENT" | "ASSIGNMENT";
      id: string;
      date: string;
      createdAt: string;
      amountPaise: number;
      details: Record<string, any>;
    }>;
  }
  ```

#### `GET /api/v1/financials/summary`
- **Query Params**:
  - `propertyId` (`string`, required)
  - `date` (optional, `YYYY-MM-DD`, defaults to current date)
- **Response Shape**:
  ```typescript
  {
    propertyId: string;
    asOfDate: string;
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
  }
  ```

---

## 2. TanStack Query Strategy

### 2.1 Query Key Factory (`client/src/hooks/queryKeys.js`)

```javascript
export const queryKeys = {
  properties: {
    all: ['properties'],
    detail: (id) => ['properties', id],
    occupancy: (propertyId, date) => ['properties', propertyId, 'occupancy', date ?? 'latest'],
    financials: (propertyId, date) => ['properties', propertyId, 'financials', date ?? 'latest'],
  },
  tenants: {
    all: ['tenants'],
    list: (filters = {}) => ['tenants', 'list', filters],
    ledger: (tenantId) => ['tenants', tenantId, 'ledger'],
  }
};
```

### 2.2 Mutation Invalidation Map

When any mutation executes, invalidate the designated query keys using `queryClient.invalidateQueries(...)`:

| Mutation Action | Route Called | Query Keys to Invalidate |
|---|---|---|
| **Add Property** | `POST /properties` | `queryKeys.properties.all` |
| **Add/Delete Floor** | `POST/DELETE /floors` | `['properties', propertyId, 'occupancy']`, `queryKeys.properties.all` |
| **Add/Delete Room** | `POST/DELETE /rooms` | `['properties', propertyId, 'occupancy']` |
| **Add/Delete/Toggle Bed** | `POST/PATCH/DELETE /beds` | `['properties', propertyId, 'occupancy']`, `['properties', propertyId, 'financials']` |
| **Move-In Tenant** | `POST /tenants/move-in` | `['properties', propertyId, 'occupancy']`, `['properties', propertyId, 'financials']`, `queryKeys.tenants.all` |
| **Shift Bed** | `POST /tenants/:id/shift-bed` | `['properties', propertyId, 'occupancy']`, `queryKeys.tenants.all`, `queryKeys.tenants.ledger(tenantId)` |
| **Checkout Tenant** | `POST /tenants/:id/checkout` | `['properties', propertyId, 'occupancy']`, `['properties', propertyId, 'financials']`, `queryKeys.tenants.all`, `queryKeys.tenants.ledger(tenantId)` |
| **Collect Payment** | `POST /tenants/:id/collect-payment` | `['properties', propertyId, 'occupancy']`, `['properties', propertyId, 'financials']`, `queryKeys.tenants.all`, `queryKeys.tenants.ledger(tenantId)` |
| **Settle Deposit** | `POST /tenants/:id/settle-deposit` | `['properties', propertyId, 'financials']`, `queryKeys.tenants.all`, `queryKeys.tenants.ledger(tenantId)` |

---

## 3. Client Utilities & Constants

### 3.1 Financial & Date Formatters (`client/src/shared/formatters.js`)

```javascript
/**
 * Formats an integer amount in paise to Indian Rupee currency string.
 * e.g., 800000 -> "₹8,000", 800050 -> "₹8,000.50"
 * @param {number} paise 
 * @returns {string}
 */
export function formatPaiseToRupees(paise = 0) {
  if (typeof paise !== 'number' || isNaN(paise)) return '₹0';
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
    minimumFractionDigits: 0
  }).format(rupees);
}

/**
 * Converts a standard Rupee string/number input to integer paise.
 * @param {string|number} rupeeAmount 
 * @returns {number}
 */
export function parseRupeesToPaise(rupeeAmount) {
  const numeric = parseFloat(String(rupeeAmount).replace(/[^0-9.-]+/g, '')) || 0;
  return Math.round(numeric * 100);
}

/**
 * Formats YYYY-MM-DD calendar date to human display string (e.g., "11 Oct 2026").
 * @param {string} dateStr 
 * @returns {string}
 */
export function formatDateDisplay(dateStr) {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}
```

### 3.2 Status Constants & Badge Config (`client/src/shared/constants.js`)

```javascript
export const BED_STATUS = {
  VACANT: 'VACANT',
  OCCUPIED: 'OCCUPIED',
  INACTIVE: 'INACTIVE',
};

export const PAYMENT_STATUS = {
  PAID: 'PAID',
  PENDING: 'PENDING',
  OVERDUE: 'OVERDUE',
  CREDIT: 'CREDIT',
};

export const TENANT_STATUS = {
  ACTIVE: 'ACTIVE',
  CHECKED_OUT: 'CHECKED_OUT',
};

export const STATUS_BADGE_CONFIG = {
  // Bed Status
  [BED_STATUS.VACANT]: {
    label: 'Vacant',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500'
  },
  [BED_STATUS.OCCUPIED]: {
    label: 'Occupied',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500'
  },
  [BED_STATUS.INACTIVE]: {
    label: 'Decommissioned',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-300',
    dot: 'bg-slate-400'
  },

  // Payment Status
  [PAYMENT_STATUS.PAID]: {
    label: 'Paid',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200'
  },
  [PAYMENT_STATUS.PENDING]: {
    label: 'Pending',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200'
  },
  [PAYMENT_STATUS.OVERDUE]: {
    label: 'Overdue',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200'
  },
  [PAYMENT_STATUS.CREDIT]: {
    label: 'Advance Credit',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200'
  },

  // Tenant Status
  [TENANT_STATUS.ACTIVE]: {
    label: 'Active',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200'
  },
  [TENANT_STATUS.CHECKED_OUT]: {
    label: 'Checked Out',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-300'
  }
};
```
