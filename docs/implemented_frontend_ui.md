# Stay Ledger V1 Frontend: Comprehensive Architectural & Functional Audit

---

## 1. Global Architecture & Invariants Audit

```
┌────────────────────────────────────────────────────────────────────────┐
│  Layer 4: Screens & App Layout                                         │
│  (DashboardScreen, TenantsScreen, PaymentsScreen, AppLayout, router)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ consumes
┌───────────────────────────────────▼────────────────────────────────────┐
│  Layer 3: Presentation Primitives, Views & Workflows                   │
│  (BottomSheet, RoomBedsView, TenantActionsView, MoveInWorkflow, etc.)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ consumes
┌───────────────────────────────────▼────────────────────────────────────┐
│  Layer 2: Server Read & Mutation Hooks                                 │
│  (useOccupancy, useTenantDirectory, useCollectPayment, useMoveIn, etc.)│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ consumes
┌───────────────────────────────────▼────────────────────────────────────┐
│  Layer 1: Core Infrastructure, Context & Utilities                     │
│  (apiClient, queryKeys, formatters, constants, PropertyContext)        │
└────────────────────────────────────────────────────────────────────────┘

```

### 1.1 Four-Layer Stratification

- **Layer 1 (Core Infrastructure):** Pure, dependency-light foundations. Houses the configured Axios client (`apiClient`), TanStack Query key factories (`queryKeys`), pure data transformers (`formatPaiseToRupees`, `parseRupeesToPaise`, `formatDateDisplay`, `formatPhone`), domain constants (`BED_STATUS`, `PAYMENT_STATUS`, `STATUS_BADGE_CONFIG`), and the global multi-property state provider (`PropertyContext`).
- **Layer 2 (Data Hooks):** Domain-segregated read queries (`useOccupancy`, `useProperties`, `useTenantDirectory`, `useTenantLedger`, `useFinancials`) and mutation wrappers (`useMoveIn`, `useCollectPayment`, `useShiftBed`, `useCheckoutTenant`, `useSettleDeposit`, `useCreateFloor`, etc.). They coordinate query invalidation directly against the cache.
- **Layer 3 (Presentation & Workflows):** Reusable UI containers (`BottomSheet`, `Badge`), screen-owned sheets (`RoomBedsView`, `TenantActionsView`, `TenantLedgerView`), and multi-step transaction forms (`MoveInWorkflow`, `CollectPaymentWorkflow`, `ShiftBedWorkflow`, `CheckoutTenantWorkflow`). Zero direct Axios calls; UI components interact solely through Layer 2 hooks and callbacks.
- **Layer 4 (Screen Assemblies & Routing):** High-level view orchestrators (`DashboardScreen`, `TenantsScreen`, `PaymentsScreen`, `ManageStructureScreen`, `MoreScreen`) integrated inside `AppLayout` with top/bottom navigation and routed via React Router v6.

### 1.2 File Naming & Export Standards

- **Pure Named Exports (100%):** Every file in `client/src/` exclusively exports named identifiers (`export function ...`, `export const ...`). `export default` is strictly banned, eliminating synthetic wrapping issues and import hallucinations across chat sessions.
- **Strict Extension Discipline:**
- Every file containing React JSX markup uses `.jsx` (`BottomSheet.jsx`, `DashboardScreen.jsx`, `FloorAccordion.jsx`).
- Pure JavaScript modules without JSX use `.js` (`httpClient.js`, `queryKeys.js`, `formatters.js`, `useOccupancy.js`).
- Component imports explicitly reference `.jsx` extensions.

### 1.3 Single-Host Bottom Sheet Navigation Engine

- **Single Host Per Screen Flow:** Stacking `<BottomSheet>` components is prohibited. Exactly one `<BottomSheet>` container is mounted per screen flow.
- **Stack-Based Controller (`sheetStack`):** Screen-owned local state maintains an array stack:

```javascript
const [sheetStack, setSheetStack] = useState([]);
const currentSheet = sheetStack[sheetStack.length - 1] || null;
```

- **Navigation Invariants:**
- **Push:** `pushSheet({ view: '...', params: { ... } })` slides the view to the next step within the same container.
- **Back (`<`):** Enabled when `sheetStack.length > 1`. Invokes `popSheet()`, restoring prior view context with preserved inputs.
- **Close (`✕` / Backdrop / Esc):** Resets `setSheetStack([])`, cleanly returning the user to the underlying screen grid.
- **Zero Network Waterfalls:** Child views (`RoomBedsView`, `TenantActionsView`) resolve room, bed, and occupant data synchronously from in-memory queries (`occupancy.floors`) already fetched by `useOccupancy`.

### 1.4 Financial Integrity & Server Authority Invariant

- **Integer Paise Everywhere:** Currency values are treated strictly as positive or zero integers in paise (`₹1 = 100 paise`). Floating-point arithmetic on rupees is completely avoided on the frontend.
- **Display Only:** The client never computes outstanding balances, allocations, or prorated obligations. It formats server-provided paise values using `formatPaiseToRupees(paise)`. User rupee inputs are sanitized and converted to integer paise using `parseRupeesToPaise(rupeeAmount)` prior to dispatching mutation payloads.

---

## 2. Complete Screen-by-Screen Breakdown

### 2.1 Dashboard Screen (`/dashboard`)

- **Name & Route:** `DashboardScreen` mounted at `/dashboard` (and default route `/`).
- **Core Purpose:** The central command center for physical room occupancy, occupant status, and real-time operational dues.
- **Key Features:**
- `CycleObligationsCard`: Summary ribbon rendering total active beds, occupied/vacant counts, pending cycle dues, and overdue balances.
- `FloorSelector`: Horizontal pill selector enabling instant, in-memory switching across floors without refetching.
- `RoomGrid` & `RoomCard`: Multi-column room tiles displaying sharing capacity, vacant bed indicators, and total room dues.

- **Active User Interactions:**
- Tapping a `RoomCard` pushes `{ view: 'ROOM_BEDS', params: { roomId } }`.
- Tapping an occupied bed pushes `{ view: 'TENANT_ACTIONS', params: { roomId, bedId } }`.
- Tapping a vacant bed pushes `{ view: 'MOVE_IN', params: { roomId, bedId } }`.
- Decommissioning/activating beds in-place via `Power` button.

- **Connected Hooks & Endpoints:**
- `useOccupancy(selectedPropertyId)` $\to$ `GET /api/v1/properties/:id/occupancy`
- `useToggleBedActive(propertyId)` $\to$ `PATCH /api/v1/beds/:id/toggle-active`

- **Edge Cases & Guardrails:**
- Skeleton screens during query fetches.
- Error alert with retry suggestions on failure.
- Empty fallback if the property has no floors configured.
- Unselected property fallback directing user to header selector.

---

### 2.2 Tenants Directory Screen (`/tenants`)

- **Name & Route:** `TenantsScreen` mounted at `/tenants`.
- **Core Purpose:** Searchable, filterable directory of all current and historical property occupants.
- **Key Features:**
- `TenantSearchBar`: Debounced input searching across occupant name and 10-digit phone number.
- `TenantFilterTabs`: Segmented control switching between `Active Occupants` and `Checked Out`, with sub-filter chips (`All`, `Overdue`, `Pending`, `Paid`, `Credit`).
- `TenantCard`: Displays bed assignment path (`Floor • Room • Bed`), joining date, payment status chip, and financial balances (overdue, dues, or advance credit).

- **Active User Interactions:**
- Direct telephone dialing via `tel:` link.
- Tapping any `TenantCard` opens the screen's dedicated `<BottomSheet>` loading the tenant's complete ledger statement (`TenantLedgerView`).

- **Connected Hooks & Endpoints:**
- `useTenantDirectory({ propertyId, status, search, paymentStatus })` $\to$ `GET /api/v1/tenants`
- `useTenantLedger(tenantId)` $\to$ `GET /api/v1/tenants/:id/ledger`

- **Edge Cases & Guardrails:**
- Responsive empty slate when search or filters return zero matches.
- Skeletons during live search query updates.

---

### 2.3 Payments & Financial Summary Screen (`/payments`)

- **Name & Route:** `PaymentsScreen` mounted at `/payments`.
- **Core Purpose:** High-level property financial health monitoring, billing cycle collection tracking, and transaction verification.
- **Key Features:**
- `MonthPicker`: Cycle selector navigating month-by-month billing periods.
- `FinancialSummaryCard`: Real-time collection efficiency bar (`%`), total expected/billed, total collected, overdue totals, and total advance credits held.
- `RecentTransactionsList`: Reverse-chronological transaction stream showing recipient names, bed location, date, payment method, and amount.

- **Active User Interactions:**
- Stepping backwards or forwards across calendar billing cycles.

- **Connected Hooks & Endpoints:**
- `useFinancials(propertyId, selectedDate)` $\to$ `GET /api/v1/financials/summary?propertyId=...&date=...`
- `useOccupancy(propertyId)` $\to$ `GET /api/v1/properties/:id/occupancy`

- **Edge Cases & Guardrails:**
- Clamping percentage calculations to 100% max.
- Empty transaction placeholder for cycles without payment activity.

---

### 2.4 Manage Physical Structure Screen (`/properties/manage`)

- **Name & Route:** `ManageStructureScreen` mounted at `/properties/manage`.
- **Core Purpose:** Full architectural layout builder (Properties, Floors, Rooms, Beds).
- **Key Features:**
- `FloorAccordion`: Expandable/collapsible floor containers displaying room count and bed capacity.
- `RoomStructureRow`: Room card detailing bed allocation, bed operational state, and inline controls.
- `AddStructureModal`: Context-aware modal creating Floors, Rooms, or Beds based on trigger point.
- `CreatePropertyModal`: Modal to create a new property and auto-select it.

- **Active User Interactions:**
- "+ Add Property" button to instantiate new property records.
- "+ Add Floor" button to append floors with custom display orders.
- "+ Add Room" per floor.
- "+ Add Bed" per room.
- Power toggle to decommission/reactivate individual beds.
- Trash button (`Trash2`) on vacant beds with a confirmation dialog to permanently delete beds without assignment history.

- **Connected Hooks & Endpoints:**
- `useCreateProperty()` $\to$ `POST /api/v1/properties`
- `useCreateFloor(propertyId)` $\to$ `POST /api/v1/floors`
- `useCreateRoom(propertyId)` $\to$ `POST /api/v1/rooms`
- `useCreateBed(propertyId)` $\to$ `POST /api/v1/beds`
- `useDeleteBed(propertyId)` $\to$ `DELETE /api/v1/beds/:id`
- `useToggleBedActive(propertyId)` $\to$ `PATCH /api/v1/beds/:id/toggle-active`

- **Edge Cases & Guardrails:**
- Deletion blocked on occupied beds or beds with historical tenancy.
- Contextual error feedback mapping domain codes (e.g. `BED_HAS_HISTORICAL_ASSIGNMENTS`).

---

### 2.5 More & Settings Screen (`/more`)

- **Name & Route:** `MoreScreen` mounted at `/more`.
- **Core Purpose:** Property metadata administration, system configuration, policy rules, and data export.
- **Key Features:**
- `PropertyDetailsCard`: Property name and address with inline editing.
- `PolicySettingsCard`: Configurable billing cycle anchor day rules, overdue grace period limits, and deposit guidelines.
- `ExportDataSection`: Client-side CSV generator converting live occupancy and ledger snapshots into downloadable spreadsheets.
- `SystemInfoCard`: Application version tag and cache purge tool (`queryClient.clear()`).

- **Active User Interactions:**
- Updating property name and address in-place.
- Generating and downloading CSV snapshots (`_occupancy_snapshot.csv`).
- Purging cache.

- **Connected Hooks & Endpoints:**
- `useProperties()` $\to$ `GET /api/v1/properties`
- `useUpdateProperty(propertyId)` $\to$ `PATCH /api/v1/properties/:id`

- **Edge Cases & Guardrails:**
- Graceful handling of null property metadata.
- Immediate toast/indicator feedback upon policy changes.

---

## 3. Interactive Workflows & Bottom-Sheet Flows

All workflows operate inside the single-host `<BottomSheet>` container using the `sheetStack` navigation state machine:

```
[ROOM_BEDS] ──(tap occupied bed)──> [TENANT_ACTIONS] ──┬──> [COLLECT_PAYMENT]
     │                                                 ├──> [SHIFT_BED]
     └──(tap vacant bed)──> [MOVE_IN]                  ├──> [TENANT_LEDGER]
                                                       └──> [CHECKOUT_TENANT]

```

### 3.1 Move-In Workflow (`MOVE_IN`)

- **Trigger:** Tapping "Assign Tenant" on a vacant bed in `RoomBedsView`.
- **Form Inputs:**
- Tenant Name (string)
- 10-digit Phone Number (regex sanitized)
- Joining Date (`YYYY-MM-DD`, default: today)
- Monthly Rent (Rupees entered $\to$ converted to integer paise via `parseRupeesToPaise`)
- Security Deposit (Rupees entered $\to$ converted to integer paise)
- First Due Date (`YYYY-MM-DD`, auto-tracked with joining date)

- **Submission:** Dispatches `useMoveIn` with payload `{ propertyId, bedId, name, phone, joiningDate, rentPaise, depositPaise, dueDate }`.
- **Cache Invalidation:** Invalidates `['properties', propertyId, 'occupancy']`, `['properties', propertyId, 'financials']`, and `['tenants']`.
- **Completion:** Calls `popSheet()` to return to `RoomBedsView`, where the bed now reflects `OCCUPIED`.

---

### 3.2 Shift-Bed Workflow (`SHIFT_BED`)

- **Trigger:** Tapping "Shift Bed" in `TenantActionsView`.
- **In-Memory Target Bed Resolution (Zero Network Waterfall):**
- Iterates over `occupancy.floors` in memory to find beds where `isActive === true`, `status === 'VACANT'`, and `id !== currentBed.id`.
- Groups vacant options hierarchically by `FloorName — RoomNumber (BedLabel)`.

- **Form Inputs:**
- Target Bed Selector (dropdown of filtered vacant beds)
- Effective Shift Date (`YYYY-MM-DD`, default: today)

- **Submission:** Dispatches `useShiftBed` with `{ tenantId, targetBedId, shiftDate }`.
- **Cache Invalidation:** Invalidates `['properties', propertyId, 'occupancy']`, `['properties', propertyId, 'financials']`, `['tenants']`, and `['tenants', tenantId, 'ledger']`.
- **Completion:** Pops the view stack back to `RoomBedsView`, showing the old bed vacant and the new bed occupied.

---

### 3.3 Collect Payment Workflow (`COLLECT_PAYMENT`)

- **Trigger:** Tapping "Collect Rent" in `TenantActionsView`.
- **Key Capabilities:**
- Header displays current outstanding and overdue balances.
- "Full Due" quick-fill button sets the input to `totalOutstandingPaise / 100`.
- Payment Method selector (`UPI`, `CASH`, `BANK_TRANSFER`, `OTHER`).
- Idempotency key generation (`pay_<timestamp>_<random>`) prevents duplicate submissions on flaky networks.
- Payment date picker and optional reference note.

- **Submission:** Dispatches `useCollectPayment` with `{ tenantId, amountPaise, paidOn, paymentMethod, referenceNote, idempotencyKey }`.
- **Receipt Confirmation:** Displays inline receipt confirmation showing amount collected, cycle obligations settled, and advance credit rollover (if any), with a "Done" button that triggers `popSheet()`.
- **Cache Invalidation:** Invalidates occupancy, financials, tenant directory, and tenant ledger keys.

---

### 3.4 Tenant Details & Compact Ledger (`TENANT_LEDGER`)

- **Trigger:** Tapping "Tenant Details & Ledger" in `TenantActionsView`, or tapping a card in `TenantsScreen`.
- **Content Breakdown:**
- **Identity Banner:** Tenant name, status badge, phone dialing link, and join date.
- **3-Metric Financial Summary:** Total Billed, Total Paid, and Net Status (highlighted in Green for settled, Red for due, or Indigo for advance credit).
- **Activity Feed (Timeline):** Chronological log of:
- `OBLIGATION`: Billing cycle dates, amount billed, due date, and pending/paid tag.
- `PAYMENT`: Date, payment method, amount, reference note, and advance rollover.
- `DEPOSIT_RECEIVED`: Deposit held record.
- `DEPOSIT_SETTLEMENT`: Deductions applied, refund amount.
- `ASSIGNMENT`: Historical and current bed occupancy intervals.

---

### 3.5 Checkout & Deposit Settlement Workflow (`CHECKOUT_TENANT`)

- **Trigger:** Tapping "Checkout Tenant" in `TenantActionsView`.
- **Two-Phase Transaction Flow:**
- **Phase 1: Bed Checkout:**
- Displays active dues warning if outstanding balance $> 0$.
- Checkout date picker (`YYYY-MM-DD`, default: today).
- Submits `useCheckoutTenant({ tenantId, checkoutDate })`, terminating the assignment interval and halting future obligations.

- **Phase 2: Deposit Settlement (if held deposit exists):**
- Retrieves held deposit amount from the ledger timeline.
- Allows dynamically adding deduction line items (Reason + Rupee amount).
- Real-time client calculation of estimated refund or remaining liability.
- Dispatches `useSettleDeposit({ tenantId, depositId, deductions })`.
- Option to "Settle Later" if inspection is pending.

- **Completion:** Pops stack back to `RoomBedsView`, displaying the newly vacated bed.

---

## 4. Data Layer & Cache Invalidation Strategy

### 4.1 TanStack Query Hook Inventory

| Hook                 | Layer Path                                | HTTP Method & Endpoint              | Primary Query Key                                |
| -------------------- | ----------------------------------------- | ----------------------------------- | ------------------------------------------------ |
| `useProperties`      | `data/structure/useProperties.js`         | `GET /properties`                   | `['properties']`                                 |
| `useOccupancy`       | `data/occupancy/useOccupancy.js`          | `GET /properties/:id/occupancy`     | `['properties', propertyId, 'occupancy', date]`  |
| `useTenantDirectory` | `data/tenants/useTenantDirectory.js`      | `GET /tenants`                      | `['tenants', 'list', filters]`                   |
| `useTenantLedger`    | `data/tenants/useTenantLedger.js`         | `GET /tenants/:id/ledger`           | `['tenants', tenantId, 'ledger']`                |
| `useFinancials`      | `data/financials/useFinancials.js`        | `GET /financials/summary`           | `['properties', propertyId, 'financials', date]` |
| `useToggleBedActive` | `data/structure/useBedMutations.js`       | `PATCH /beds/:id/toggle-active`     | _(Mutation)_                                     |
| `useCreateProperty`  | `data/structure/useStructureMutations.js` | `POST /properties`                  | _(Mutation)_                                     |
| `useCreateFloor`     | `data/structure/useStructureMutations.js` | `POST /floors`                      | _(Mutation)_                                     |
| `useCreateRoom`      | `data/structure/useStructureMutations.js` | `POST /rooms`                       | _(Mutation)_                                     |
| `useCreateBed`       | `data/structure/useStructureMutations.js` | `POST /beds`                        | _(Mutation)_                                     |
| `useDeleteBed`       | `data/structure/useStructureMutations.js` | `DELETE /beds/:id`                  | _(Mutation)_                                     |
| `useMoveIn`          | `data/mutations/useMoveIn.js`             | `POST /tenants/move-in`             | _(Mutation)_                                     |
| `useShiftBed`        | `data/mutations/useShiftBed.js`           | `POST /tenants/:id/shift-bed`       | _(Mutation)_                                     |
| `useCollectPayment`  | `data/mutations/useCollectPayment.js`     | `POST /tenants/:id/collect-payment` | _(Mutation)_                                     |
| `useCheckoutTenant`  | `data/mutations/useCheckoutTenant.js`     | `POST /tenants/:id/checkout`        | _(Mutation)_                                     |
| `useSettleDeposit`   | `data/mutations/useCheckoutTenant.js`     | `POST /tenants/:id/settle-deposit`  | _(Mutation)_                                     |
| `useUpdateProperty`  | `data/properties/usePropertySettings.js`  | `PATCH /properties/:id`             | _(Mutation)_                                     |

---

### 4.2 Mutation Invalidation Matrix

Targeted query invalidation prevents full-app refetch waterfalls while ensuring fresh data across screens:

```
┌───────────────────────┬────────────────────────────────────────────────────────────────────────┐
│ Mutation Hook         │ Invalidation Targets                                                   │
├───────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ useCreateProperty     │ ['properties']                                                         │
│ useUpdateProperty     │ ['properties'], ['properties', propId, 'occupancy'], ['financials']   │
│ useCreateFloor        │ ['properties', propId, 'occupancy'], ['properties', propId, 'financials']│
│ useCreateRoom         │ ['properties', propId, 'occupancy']                                    │
│ useCreateBed          │ ['properties', propId, 'occupancy'], ['properties', propId, 'financials']│
│ useDeleteBed          │ ['properties', propId, 'occupancy'], ['properties', propId, 'financials']│
│ useToggleBedActive    │ ['properties', propId, 'occupancy'], ['properties', propId, 'financials']│
│ useMoveIn             │ ['properties', propId, 'occupancy'], ['financials'], ['tenants']       │
│ useShiftBed           │ ['properties', propId, 'occupancy'], ['tenants'], ['tenants', id, 'ledger']│
│ useCollectPayment     │ ['occupancy'], ['financials'], ['tenants'], ['tenants', id, 'ledger']  │
│ useCheckoutTenant     │ ['occupancy'], ['financials'], ['tenants'], ['tenants', id, 'ledger']  │
│ useSettleDeposit      │ ['occupancy'], ['financials'], ['tenants'], ['tenants', id, 'ledger']  │
└───────────────────────┴────────────────────────────────────────────────────────────────────────┘

```

---

## 5. Known Limitations, Gaps & Next Priorities

### 5.1 Known Refinements & Gaps

1. **Payments Transaction Stream Synthesis:**

- On `/payments`, `RecentTransactionsList` currently constructs a transaction feed from active tenants in `useOccupancy`. When a dedicated `/api/v1/payments` endpoint is available, this should migrate to a dedicated `usePaymentHistory(propertyId)` hook.

2. **Offline Resilience & Form Draft Persistence:**

- In-flight forms (`MoveInWorkflow`, `CheckoutTenantWorkflow`) hold drafts in local component state. A hard page refresh or accidental back gesture clears unsaved input. Adding local storage persistence for form drafts would improve mobile UX.

3. **Proration UI Controls:**

- In `MoveInWorkflow`, rent is calculated on a full-period basis from the joining date. If a tenant moves in mid-cycle and requires custom first-month proration, the amount must currently be adjusted manually in the Monthly Rent input.

### 5.2 Next Architectural Priorities

1. **Automated Integration & Component Testing:**

- Add Vitest and React Testing Library suites verifying the `sheetStack` navigation transitions (Push $\to$ Back $\to$ Close) and currency conversions (`paise $\leftrightarrow$ rupees`).

2. **Mobile Touch & Gesture Tuning:**

- Enhance `<BottomSheet>` with touch drag-to-dismiss behavior (e.g., via `@use-gesture/react` or Framer Motion) while preserving native touch scrolling on inner content.

3. **Optimistic UI Updates:**

- Implement optimistic updates in `useToggleBedActive` and `useCollectPayment` for instant visual feedback on mobile networks before server roundtrips complete.
