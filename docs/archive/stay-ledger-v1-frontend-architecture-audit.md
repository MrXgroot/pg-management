# Historical snapshot — retained for history. Use the [current documentation index](../README.md), [architecture](../context/01_SYSTEM_ARCHITECTURE_OVERVIEW.md), [frontend/testing](../context/04_FRONTEND_AND_TESTING_REFERENCE.md), and [audit findings](../context/05_AUDIT_FINDINGS.md); this snapshot is not current authority.

# Stay Ledger V1 Frontend — Architecture Audit & State Baseline

**Audit Date:** October 12, 2026  
**Scope:** `client/src/` (Slices 1–3 implemented baseline)  
**Status:** Paused for alignment prior to Slice 4 (Workflows, Tenant Actions & Ledger)

---

## 1. Active File Tree

The following 18 files represent the exact codebase established across Slices 1 through 3:

```text
client/src/
├── api/
│   ├── httpClient.js
│   └── queryKeys.js
├── app/
│   ├── App.jsx
│   └── router.jsx
├── components/
│   └── common/
│       └── BottomSheet.jsx
├── context/
│   └── PropertyContext.jsx
├── data/
│   ├── occupancy/
│   │   └── useOccupancy.js
│   └── structure/
│       └── useBedMutations.js
├── layouts/
│   ├── AppLayout.jsx
│   ├── BottomNavbar.jsx
│   └── TopAppBar.jsx
├── screens/
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── CycleObligationsCard.jsx
│   │   │   ├── FloorSelector.jsx
│   │   │   ├── RoomCard.jsx
│   │   │   └── RoomGrid.jsx
│   │   ├── sheets/
│   │   │   └── RoomBedsView.jsx
│   │   └── DashboardScreen.jsx
│   ├── manage-property/
│   │   └── ManagePropertyScreen.jsx
│   ├── more/
│   │   └── MoreScreen.jsx
│   ├── payments/
│   │   └── PaymentsScreen.jsx
│   ├── tenants/
│   │   └── TenantsScreen.jsx
│   └── NotFoundScreen.jsx
└── shared/
    ├── constants.js
    └── formatters.js
```

---

## 2. State & Component Audit

### `client/src/components/common/BottomSheet.jsx`

- **Location:** `client/src/components/common/BottomSheet.jsx`
- **Role:** Generic presentation container for slide-up bottom sheets.
- **Props:**
  - `isOpen` (`boolean`): Toggles rendering and mounting.
  - `onClose` (`function`): Dismiss handler (triggered by Escape, backdrop click, or close button).
  - `title` (`string`): Sheet header text.
  - `onBack` (`function | optional`): Optional back handler; renders the chevron `<` button when provided.
  - `children` (`ReactNode`): Sheet body content.

- **Local State & Side Effects:**
  - `useEffect`: Listens for the `keydown` event on `window` to dismiss on `Escape`.
  - `useEffect`: Locks background scroll (`document.body.style.overflow = 'hidden'`) while mounted.

- **API / Business Logic:** Zero. Pure presentation primitive.

### `client/src/screens/dashboard/DashboardScreen.jsx`

- **Role:** Screen coordinator for the occupancy matrix and single-host sheet transitions.
- **Props:** None (routable screen).
- **Hooks & Context:**
  - `useProperty()`: Provides `selectedPropertyId`.
  - `useOccupancy(selectedPropertyId)`: Single screen-level projection query.

- **Local State:**
  - `selectedFloorId` (`string | null`): In-memory active floor tab ID; defaults to `floors[0].id`.
  - `sheetState` (`{ view: string, params: object } | null`): Current active sheet view and parameters.

- **Derived State (`useMemo`):**
  - `floors`: Safe fallback array from `occupancyData?.floors || []`.
  - `activeFloor`: Finds the floor object matching `selectedFloorId`.
  - `activeSheetRoom`: Scans all floors to locate the latest `room` matching `sheetState.params.roomId` in memory (ensuring freshly mutated bed state displays without manual refetches).

- **Responsibilities:**
  - Renders loading skeletons, error fallback, empty floor prompt, or dashboard modules.
  - Mounts `<BottomSheet>` conditionally based on `Boolean(sheetState)`.
  - Renders `<RoomBedsView>` inside the bottom sheet when `sheetState?.view === 'ROOM_BEDS'`.

### `client/src/screens/dashboard/components/RoomCard.jsx`

- **Role:** Individual room summary display inside the 2-column grid.
- **Props:**
  - `room` (`object`): Room record containing `roomNumber` and `beds[]`.
  - `onSelectRoom` (`function`): Callback receiving the clicked `room` object.

- **Local State:** None.
- **Derived State (`useMemo`):**
  - `sharingCount`: Count of beds where `isActive !== false`.
  - `vacantCount`: Count of active beds where `status === 'VACANT'`.
  - `totalRoomDues`: Aggregated `tenant.totalOutstandingPaise` across all beds.

- **Responsibilities:**
  - Displays room number, sharing count badge, green/gray vacancy status bullet, and `Paid` vs `₹... Due` tag.
  - Dispatches `onSelectRoom(room)` on click.

### `client/src/screens/dashboard/components/RoomGrid.jsx`

- **Role:** Grid layout container for room cards on the selected floor.
- **Props:**
  - `rooms` (`Array`): Rooms belonging to the active floor.
  - `onSelectRoom` (`function`): Forwarded to `RoomCard`.

- **Local State:** None.
- **Responsibilities:**
  - Displays section header ("ROOMS & AVAILABILITY", count badge, interaction hint).
  - Renders empty state if `rooms.length === 0`.
  - Renders `grid grid-cols-2 gap-3.5` containing `<RoomCard/>` components.

### `client/src/screens/dashboard/components/FloorSelector.jsx`

- **Role:** Horizontal pill scroll selector for floor filtering.
- **Props:**
  - `floors` (`Array`): Full list of floors from occupancy projection.
  - `selectedFloorId` (`string`): Current floor selection.
  - `onSelectFloor` (`function`): Handler updating `selectedFloorId`.

- **Local State:** None.
- **Responsibilities:**
  - Renders floor count and right-aligned active floor label.
  - Computes `hasDues` per floor to color-code status dots (red/orange if any bed has dues, green if clear).
  - Triggers in-memory floor switches with zero network calls.

### `client/src/screens/dashboard/components/CycleObligationsCard.jsx`

- **Role:** Property-wide financial obligations summary card.
- **Props:**
  - `floors` (`Array`): Full list of floors.

- **Local State:** None.
- **Derived State (`useMemo`):**
  - Iterates through all floors → rooms → beds to compute `totalOutstandingPaise` and `totalOverduePaise`.

- **Responsibilities:**
  - Displays formatted headline currency figure using `formatPaiseToRupees`.
  - Renders status pill ("Active") and breakdown bullets (Overdue vs Pending).

### `client/src/screens/dashboard/sheets/RoomBedsView.jsx`

- **Role:** Sheet content view listing all beds inside the selected room.
- **Props:**
  - `room` (`object`): Room object with `beds[]`.
  - `propertyId` (`string`): Active property ID for cache invalidation.
  - `onAssignTenant` (`function`): Callback receiving `bed` for move-in.
  - `onCollectPayment` (`function`): Callback receiving `bed` for rent collection.
  - `onViewTenantDetails` (`function`): Callback receiving `bed.tenant` for compact ledger.

- **Hooks:**
  - `useToggleBedActive(propertyId)`: Mutation hook to toggle bed availability.

- **Local State:** None.
- **Responsibilities:**
  - Shows bed label, active status badge, and maintenance toggle button.
  - If `VACANT`: Renders dashed border with "Assign Tenant" button.
  - If `OCCUPIED`: Displays tenant name, phone, outstanding dues, "Collect Rent", and "View Details" action buttons.
  - Calls `toggleBedMutation.mutate({ bedId, isActive })` when the power button is tapped.

### `client/src/data/occupancy/useOccupancy.js`

- **Role:** Single screen-level projection fetcher.
- **Signature:** `useOccupancy(propertyId, dateStr = getTodayDateString())`
- **Key:** `queryKeys.occupancy.byProperty(propertyId, dateStr)`
- **Behavior:**
  - Calls `GET /api/v1/properties/:id/occupancy?date=...`.
  - Defensive return: `response?.data || response`.
  - Enabled guard: `Boolean(propertyId)`.
  - Stale time: 60 seconds.

### `client/src/data/structure/useBedMutations.js`

- **Role:** Structure and bed configuration mutations.
- **Exported Hooks:**
  - `useToggleBedActive(propertyId)`:
    - Calls `PATCH /api/v1/beds/:id/toggle-active` with `{ isActive }`.
    - Invalidation: Invalidates `['occupancy', propertyId]` to refresh the room state immediately.

---

## 3. Interaction & Navigation Verification

### Sheet Visibility & History Stack Model

- **Current Pattern in `DashboardScreen.jsx`:**
  - Uses a **flat object** state: `sheetState = null | { view: string, params: object }`.
  - **No array stack** (`sheetHistory = []`) is currently implemented.
  - **No `onBack` handler** is passed to `<BottomSheet>` yet (it remains `undefined`, hiding the back chevron).

### Callback Disconnects in `RoomBedsView`

In `DashboardScreen.jsx`, the callbacks passed to `RoomBedsView` are wired to console placeholders:

```javascript
const handleAssignTenant = (bed) => {
  console.log("Transition in-host to MoveInWorkflow for bed:", bed);
};

const handleCollectPayment = (bed) => {
  console.log("Transition in-host to CollectPaymentWorkflow for bed:", bed);
};

const handleViewTenantDetails = (tenant) => {
  console.log(
    "Transition in-host to TenantDetailsSheetView for tenant:",
    tenant,
  );
};
```

These three callbacks represent the exact boundary where Slice 3 ends and Slices 4–5 begin.

---

## 4. Technical Debt & Boundary Violations

| Item                               | Observation                                                                                                                                       | Specification Reference                                                                                                                | Severity         | Corrective Plan                                                                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Folder Placement**               | `BottomSheet.jsx` was placed in `client/src/components/common/` rather than `client/src/components/`.                                             | `frontend_architecture.md` specifies `components/BottomSheet.jsx` directly.                                                            | Low              | Move `BottomSheet.jsx` up to `client/src/components/` and update import in `DashboardScreen.jsx`.                                       |
| **Response Unwrapping Redundancy** | `apiClient` unwrap interceptor already unpacks `response.data.data`. In `useOccupancy.js`, `response?.data \|\| response` is checked defensively. | API client contract.                                                                                                                   | Low              | Simplify the return path if the interceptor contract is guaranteed; otherwise document the expected response shape.                     |
| **Sheet View Stack**               | `sheetState` is currently a single `{ view, params }` object rather than a view stack array (`[ { view, params } ]`).                             | `bottom_sheet_architecture.md` §5 calls for Back support in multi-step flows (`Room Beds` → `Tenant Actions` → `Details` / `Collect`). | Medium           | Implement an explicit view stack (`sheetStack: []`) or a lightweight screen-level controller hook (`useDashboardSheets.js`) in Slice 4. |
| **Hardcoded API URLs**             | None found. All endpoints use relative REST paths `/properties/...` and `/beds/...`, inheriting `baseURL: '/api/v1'`.                             | Architecture specification.                                                                                                            | None (Compliant) | Maintain this pattern.                                                                                                                  |
| **Authoritative Calculations**     | None found. Zero billing calculations in frontend; all UI uses server-supplied `paise` converted via `formatPaiseToRupees`.                       | Architecture specification.                                                                                                            | None (Compliant) | Maintain this pattern.                                                                                                                  |

---

## 5. Slice 4 Alignment Gate

Before starting Slice 4 (Workflows, Tenant Actions & Ledger), confirm the following decisions:

1. **BottomSheet location:** Keep `components/common/BottomSheet.jsx`, or move it to `components/BottomSheet.jsx` to match `frontend_architecture.md`?
2. **Sheet navigation:** Use a lightweight screen-level stack/controller for `ROOM_BEDS` → `TENANT_ACTIONS` → `TENANT_DETAILS` / `COLLECT_PAYMENT`, with Back restoring the previous view and Close dismissing the whole flow?
3. **Response unwrapping:** Is `apiClient`'s response-unwrapping interceptor guaranteed, so `useOccupancy.js` can return the response directly?
4. **Scope for Slice 4:** Implement the reusable workflow components and connect the three currently stubbed callbacks, while keeping backend business rules authoritative and avoiding nested sheets?
