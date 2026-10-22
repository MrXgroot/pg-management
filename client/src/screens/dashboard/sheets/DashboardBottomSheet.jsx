import { useState, useEffect, useMemo, useCallback } from "react";
import { BottomSheet } from "../../../components/BottomSheet.jsx";
import { RoomBedsView } from "./RoomBedsView.jsx";
import { TenantActionsView } from "./TenantActionsView.jsx";
import { MoveInWorkflow } from "../../../workflows/MoveInWorkflow.jsx";
import { ShiftBedWorkflow } from "../../../workflows/ShiftBedWorkflow.jsx";
import { CollectPaymentWorkflow } from "../../../workflows/CollectPaymentWorkflow.jsx";
import { TenantLedgerView } from "./TenantLedgerView.jsx";
import { CheckoutTenantWorkflow } from "../../../workflows/CheckoutTenantWorkflow.jsx";

export function DashboardBottomSheet({
  selectedRoom,
  onClose,
  propertyId,
  floors = [],
}) {
  // Navigation stack is fully encapsulated inside the sheet host
  const [sheetStack, setSheetStack] = useState([]);

  // Synchronize stack whenever an external trigger selects/clears a room
  useEffect(() => {
    if (selectedRoom?.id) {
      setSheetStack([
        { view: "ROOM_BEDS", params: { roomId: selectedRoom.id } },
      ]);
    } else {
      setSheetStack([]);
    }
  }, [selectedRoom]);

  // Stack navigation handlers
  const pushSheet = useCallback((entry) => {
    setSheetStack((prev) => [...prev, entry]);
  }, []);

  const popSheet = useCallback(
    (steps = 1) => {
      setSheetStack((prev) => {
        if (prev.length <= steps) {
          onClose?.();
          return [];
        }
        return prev.slice(0, -steps);
      });
    },
    [onClose],
  );

  const handleClose = useCallback(() => {
    setSheetStack([]);
    onClose?.();
  }, [onClose]);

  const currentSheet = sheetStack[sheetStack.length - 1] || null;

  // Resolve active room and bed synchronously from in-memory occupancy data
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

  // Dynamic header resolution
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

  return (
    <BottomSheet
      isOpen={Boolean(currentSheet)}
      title={sheetTitle}
      subtitle={sheetSubtitle}
      onClose={handleClose}
      onBack={sheetStack.length > 1 ? () => popSheet(1) : undefined}
    >
      {currentSheet?.view === "ROOM_BEDS" && activeRoom && (
        <RoomBedsView
          room={activeRoom}
          propertyId={propertyId}
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
          propertyId={propertyId}
          bed={activeBed}
          room={activeRoom}
          onSuccess={() => popSheet(1)}
          onCancel={() => popSheet(1)}
        />
      )}

      {currentSheet?.view === "SHIFT_BED" && activeBed && activeRoom && (
        <ShiftBedWorkflow
          propertyId={propertyId}
          currentBed={activeBed}
          currentRoom={activeRoom}
          floors={floors}
          onSuccess={() => popSheet(1)}
          onCancel={() => popSheet(1)}
        />
      )}

      {currentSheet?.view === "COLLECT_PAYMENT" && activeBed && activeRoom && (
        <CollectPaymentWorkflow
          propertyId={propertyId}
          bed={activeBed}
          room={activeRoom}
          onSuccess={() => popSheet(1)}
          onCancel={() => popSheet(1)}
        />
      )}

      {currentSheet?.view === "TENANT_LEDGER" &&
        currentSheet.params?.tenantId && (
          <TenantLedgerView tenantId={currentSheet.params.tenantId} />
        )}

      {currentSheet?.view === "CHECKOUT_TENANT" && activeBed && activeRoom && (
        <CheckoutTenantWorkflow
          propertyId={propertyId}
          bed={activeBed}
          room={activeRoom}
          onSuccess={() => {
            // Pops past Tenant Actions back to the Room Beds view
            popSheet(2);
          }}
          onCancel={() => popSheet(1)}
        />
      )}
    </BottomSheet>
  );
}
