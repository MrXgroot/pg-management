import { useState, useEffect, useMemo } from "react";
import { useProperty } from "../../context/PropertyContext.jsx";
import { useOccupancy } from "../../data/occupancy/useOccupancy.js";
import { CycleObligationsCard } from "./components/CycleObligationsCard.jsx";
import { FloorSelector } from "./components/FloorSelector.jsx";
import { RoomGrid } from "./components/RoomGrid.jsx";
import { BottomSheet } from "../../components/BottomSheet.jsx";
import { RoomBedsView } from "./sheets/RoomBedsView.jsx";
import { TenantActionsView } from "./sheets/TenantActionsView.jsx";
import { MoveInWorkflow } from "../../workflows/MoveInWorkflow.jsx";
import { ShiftBedWorkflow } from "../../workflows/ShiftBedWorkflow.jsx";
import { CollectPaymentWorkflow } from "../../workflows/CollectPaymentWorkflow.jsx";
import { TenantLedgerView } from "./sheets/TenantLedgerView.jsx";
import { CheckoutTenantWorkflow } from "../../workflows/CheckoutTenantWorkflow.jsx";

export function DashboardScreen() {
  const { selectedPropertyId } = useProperty();
  const {
    data: occupancy,
    isLoading,
    isError,
    error,
  } = useOccupancy(selectedPropertyId);

  const [selectedFloorId, setSelectedFloorId] = useState(null);
  const [sheetStack, setSheetStack] = useState([]);

  const floors = occupancy?.floors || [];

  // Synchronize active floor selection
  useEffect(() => {
    if (floors.length > 0) {
      const stillValid = floors.some((floor) => floor.id === selectedFloorId);
      if (!stillValid) {
        setSelectedFloorId(floors[0].id);
      }
    } else {
      setSelectedFloorId(null);
    }
  }, [floors, selectedFloorId]);

  // Current sheet resolution from top of stack
  const currentSheet = sheetStack[sheetStack.length - 1] || null;

  // Resolve room and bed synchronously from in-memory occupancy data (zero network waterfalls)
  const activeRoom = useMemo(() => {
    if (!currentSheet?.params?.roomId) return null;
    for (const floor of floors) {
      const found = floor.rooms?.find(
        (r) => r.id === currentSheet.params.roomId,
      );
      if (found) return found;
    }
    return null;
  }, [floors, currentSheet]);

  const activeBed = useMemo(() => {
    if (!activeRoom || !currentSheet?.params?.bedId) return null;
    return (
      activeRoom.beds?.find((b) => b.id === currentSheet.params.bedId) || null
    );
  }, [activeRoom, currentSheet]);

  // Navigation handlers
  function pushSheet(entry) {
    setSheetStack((prev) => [...prev, entry]);
  }

  function popSheet() {
    setSheetStack((prev) => prev.slice(0, -1));
  }

  function closeSheet() {
    setSheetStack([]);
  }

  function handleSelectRoom(room) {
    pushSheet({
      view: "ROOM_BEDS",
      params: { roomId: room.id },
    });
  }

  // Header dynamic titles
  let sheetTitle = "";
  let sheetSubtitle = "";

  if (currentSheet?.view === "ROOM_BEDS") {
    sheetTitle = activeRoom ? `Room ${activeRoom.roomNumber}` : "Room Beds";
    sheetSubtitle = activeRoom
      ? `${activeRoom.beds?.length || 0} Beds Total`
      : "";
  } else if (currentSheet?.view === "TENANT_ACTIONS") {
    sheetTitle = activeBed?.tenant?.name || "Tenant Actions";
    sheetSubtitle =
      activeRoom && activeBed
        ? `Room ${activeRoom.roomNumber} • ${activeBed.bedLabel}`
        : "";
  } else if (currentSheet?.view === "MOVE_IN") {
    sheetTitle = "Assign Tenant";
    sheetSubtitle =
      activeRoom && activeBed
        ? `Room ${activeRoom.roomNumber} • ${activeBed.bedLabel}`
        : "";
  } else if (currentSheet?.view === "SHIFT_BED") {
    sheetTitle = "Shift Bed";
    sheetSubtitle =
      activeRoom && activeBed
        ? `Room ${activeRoom.roomNumber} • ${activeBed.bedLabel}`
        : "";
  } else if (currentSheet?.view === "COLLECT_PAYMENT") {
    sheetTitle = "Collect Rent";
    sheetSubtitle =
      activeRoom && activeBed
        ? `Room ${activeRoom.roomNumber} • ${activeBed.bedLabel}`
        : "";
  } else if (currentSheet?.view === "TENANT_LEDGER") {
    sheetTitle = "Ledger & History";
    sheetSubtitle =
      activeRoom && activeBed
        ? `${activeBed.tenant?.name || "Tenant"} • Room ${activeRoom.roomNumber}`
        : "";
  } else if (currentSheet?.view === "CHECKOUT_TENANT") {
    sheetTitle = "Checkout Tenant";
    sheetSubtitle =
      activeRoom && activeBed
        ? `${activeBed.tenant?.name || "Tenant"} • Room ${activeRoom.roomNumber}`
        : "";
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 py-2 animate-pulse">
        <div className="h-24 w-full rounded-2xl bg-slate-200" />
        <div className="flex gap-2">
          <div className="h-9 w-24 rounded-xl bg-slate-200" />
          <div className="h-9 w-24 rounded-xl bg-slate-200" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="h-28 rounded-xl bg-slate-200" />
          <div className="h-28 rounded-xl bg-slate-200" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/50 py-12 text-center">
        <h2 className="text-sm font-bold text-rose-800">
          Failed to load property occupancy
        </h2>
        <p className="mt-1 text-xs text-rose-600">
          {error?.message || "Please check connection or retry later."}
        </p>
      </div>
    );
  }

  if (!selectedPropertyId) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <h2 className="text-sm font-bold text-slate-800">
          No Property Selected
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Select a property in the header above to begin.
        </p>
      </div>
    );
  }

  const activeFloor =
    floors.find((floor) => floor.id === selectedFloorId) || floors[0];

  return (
    <div className="flex flex-col gap-4 py-2">
      <CycleObligationsCard floors={floors} />

      <FloorSelector
        floors={floors}
        selectedFloorId={selectedFloorId}
        onSelectFloor={setSelectedFloorId}
      />

      <RoomGrid
        rooms={activeFloor?.rooms || []}
        onSelectRoom={handleSelectRoom}
      />

      {/* Single-Host Bottom Sheet Container */}
      <BottomSheet
        isOpen={Boolean(currentSheet)}
        title={sheetTitle}
        subtitle={sheetSubtitle}
        onClose={closeSheet}
        onBack={sheetStack.length > 1 ? popSheet : undefined}
      >
        {currentSheet?.view === "ROOM_BEDS" && activeRoom && (
          <RoomBedsView
            room={activeRoom}
            propertyId={selectedPropertyId}
            onSelectOccupiedBed={(bed) =>
              pushSheet({
                view: "TENANT_ACTIONS",
                params: {
                  roomId: activeRoom.id,
                  bedId: bed.id,
                },
              })
            }
            onAssignTenant={(bed) =>
              pushSheet({
                view: "MOVE_IN",
                params: {
                  roomId: activeRoom.id,
                  bedId: bed.id,
                },
              })
            }
          />
        )}

        {currentSheet?.view === "TENANT_ACTIONS" && activeBed && (
          <TenantActionsView
            bed={activeBed}
            room={activeRoom}
            onCollectRent={(bed) =>
              pushSheet({
                view: "COLLECT_PAYMENT",
                params: {
                  roomId: activeRoom.id,
                  bedId: bed.id,
                },
              })
            }
            onShiftBed={(bed) =>
              pushSheet({
                view: "SHIFT_BED",
                params: {
                  roomId: activeRoom.id,
                  bedId: bed.id,
                },
              })
            }
            onViewLedger={(bed) =>
              pushSheet({
                view: "TENANT_LEDGER",
                params: {
                  roomId: activeRoom.id,
                  bedId: bed.id,
                  tenantId: bed.tenant.id,
                },
              })
            }
            onCheckout={(bed) =>
              pushSheet({
                view: "CHECKOUT_TENANT",
                params: {
                  roomId: activeRoom.id,
                  bedId: bed.id,
                  tenantId: bed.tenant.id,
                },
              })
            }
          />
        )}

        {currentSheet?.view === "MOVE_IN" && activeBed && activeRoom && (
          <MoveInWorkflow
            propertyId={selectedPropertyId}
            bed={activeBed}
            room={activeRoom}
            onSuccess={() => {
              popSheet();
            }}
            onCancel={popSheet}
          />
        )}

        {currentSheet?.view === "SHIFT_BED" && activeBed && activeRoom && (
          <ShiftBedWorkflow
            propertyId={selectedPropertyId}
            currentBed={activeBed}
            currentRoom={activeRoom}
            floors={floors}
            onSuccess={() => {
              popSheet();
            }}
            onCancel={popSheet}
          />
        )}

        {currentSheet?.view === "COLLECT_PAYMENT" &&
          activeBed &&
          activeRoom && (
            <CollectPaymentWorkflow
              propertyId={selectedPropertyId}
              bed={activeBed}
              room={activeRoom}
              onSuccess={() => {
                popSheet();
              }}
              onCancel={popSheet}
            />
          )}

        {currentSheet?.view === "TENANT_LEDGER" &&
          currentSheet.params?.tenantId && (
            <TenantLedgerView tenantId={currentSheet.params.tenantId} />
          )}

        {currentSheet?.view === "CHECKOUT_TENANT" &&
          activeBed &&
          activeRoom && (
            <CheckoutTenantWorkflow
              propertyId={selectedPropertyId}
              bed={activeBed}
              room={activeRoom}
              onSuccess={() => {
                // Return directly to Room Beds view where this bed is now vacant
                popSheet();
                popSheet();
              }}
              onCancel={popSheet}
            />
          )}
      </BottomSheet>
    </div>
  );
}
