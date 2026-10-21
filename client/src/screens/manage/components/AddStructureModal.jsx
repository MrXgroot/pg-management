import { useState, useEffect } from "react";
import { X, Layers, DoorOpen, Bed, AlertCircle, Loader2 } from "lucide-react";
import {
  useCreateFloor,
  useCreateRoom,
  useCreateBed,
} from "../../../data/structure/useStructureMutations.js";

export function AddStructureModal({
  isOpen,
  mode, // 'FLOOR' | 'ROOM' | 'BED'
  contextData, // { floor?: object, room?: object, currentFloorCount?: number }
  propertyId,
  onClose,
}) {
  const [name, setName] = useState("");
  const [displayOrder, setDisplayOrder] = useState("1");
  const [roomNumber, setRoomNumber] = useState("");
  const [bedLabel, setBedLabel] = useState("");
  const [validationError, setValidationError] = useState(null);

  const {
    mutate: createFloor,
    isPending: isFloorPending,
    error: floorError,
  } = useCreateFloor(propertyId);

  const {
    mutate: createRoom,
    isPending: isRoomPending,
    error: roomError,
  } = useCreateRoom(propertyId);

  const {
    mutate: createBed,
    isPending: isBedPending,
    error: bedError,
  } = useCreateBed(propertyId);

  const isPending = isFloorPending || isRoomPending || isBedPending;
  const apiError = floorError || roomError || bedError;

  useEffect(() => {
    if (isOpen) {
      setValidationError(null);
      if (mode === "FLOOR") {
        setName("");
        setDisplayOrder(String((contextData?.currentFloorCount || 0) + 1));
      } else if (mode === "ROOM") {
        setRoomNumber("");
      } else if (mode === "BED") {
        setBedLabel("");
      }
    }
  }, [isOpen, mode, contextData]);

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    setValidationError(null);

    if (mode === "FLOOR") {
      if (!name.trim()) {
        setValidationError(
          'Floor name is required (e.g. "1st Floor", "Ground Floor").',
        );
        return;
      }
      const order = parseInt(displayOrder, 10);
      if (isNaN(order) || order < 1) {
        setValidationError("Display order must be a positive integer.");
        return;
      }

      createFloor(
        { name: name.trim(), displayOrder: order },
        { onSuccess: onClose },
      );
    } else if (mode === "ROOM") {
      if (!roomNumber.trim()) {
        setValidationError('Room number is required (e.g. "101", "G-02").');
        return;
      }
      if (!contextData?.floor?.id) {
        setValidationError("Parent floor reference missing.");
        return;
      }

      createRoom(
        { floorId: contextData.floor.id, roomNumber: roomNumber.trim() },
        { onSuccess: onClose },
      );
    } else if (mode === "BED") {
      if (!bedLabel.trim()) {
        setValidationError('Bed label is required (e.g. "Bed A", "Bed B").');
        return;
      }
      if (!contextData?.room?.id) {
        setValidationError("Parent room reference missing.");
        return;
      }

      createBed(
        { roomId: contextData.room.id, bedLabel: bedLabel.trim() },
        { onSuccess: onClose },
      );
    }
  }

  let title = "Add Structure";
  let Icon = Layers;

  if (mode === "FLOOR") {
    title = "Add New Floor";
    Icon = Layers;
  } else if (mode === "ROOM") {
    title = `Add Room to ${contextData?.floor?.name || "Floor"}`;
    Icon = DoorOpen;
  } else if (mode === "BED") {
    title = `Add Bed to Room ${contextData?.room?.roomNumber || ""}`;
    Icon = Bed;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Surface Card */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl transition">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Icon className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error Banners */}
        {apiError && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" />
            <span>{apiError.message || "Operation failed."}</span>
          </div>
        )}

        {validationError && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Dynamic Form Content */}
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          {mode === "FLOOR" && (
            <>
              <div>
                <label
                  htmlFor="floor-name"
                  className="text-xs font-semibold text-slate-700 block"
                >
                  Floor Name *
                </label>
                <input
                  id="floor-name"
                  type="text"
                  required
                  placeholder="e.g. 2nd Floor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-900 shadow-2xs transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="display-order"
                  className="text-xs font-semibold text-slate-700 block"
                >
                  Display Order *
                </label>
                <input
                  id="display-order"
                  type="number"
                  min="1"
                  required
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-900 shadow-2xs transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Defines tab placement order on the Dashboard.
                </p>
              </div>
            </>
          )}

          {mode === "ROOM" && (
            <div>
              <label
                htmlFor="room-number"
                className="text-xs font-semibold text-slate-700 block"
              >
                Room Number / Identifier *
              </label>
              <input
                id="room-number"
                type="text"
                required
                placeholder="e.g. 201"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-900 shadow-2xs transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}

          {mode === "BED" && (
            <div>
              <label
                htmlFor="bed-label"
                className="text-xs font-semibold text-slate-700 block"
              >
                Bed Label / Identifier *
              </label>
              <input
                id="bed-label"
                type="text"
                required
                placeholder="e.g. Bed C"
                value={bedLabel}
                onChange={(e) => setBedLabel(e.target.value)}
                className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-900 shadow-2xs transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Form Actions */}
          <div className="mt-2 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-xl px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 active:scale-95 disabled:pointer-events-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
