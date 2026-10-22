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
  contextData,
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
          "Floor name is required (e.g. '1st Floor', 'Floor 3').",
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
        setValidationError("Room number is required (e.g. '101', '204').");
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
        setValidationError("Bed label is required (e.g. 'Bed A', 'Bed B').");
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Surface Card Sheet */}
      <div className="relative z-10 w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] border border-slate-200/90 bg-white p-5 shadow-2xl transition dark:border-neutral-800 dark:bg-[#16171C]">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200 sm:hidden dark:bg-neutral-700" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-neutral-800">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FF5E36]/10 text-[#FF5E36]">
              <Icon className="h-4 w-4 stroke-[2.2]" />
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="spring-press flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error Banners */}
        {apiError && (
          <div className="mt-3 flex items-start space-x-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" />
            <span>{apiError.message || "Operation failed."}</span>
          </div>
        )}

        {validationError && (
          <div className="mt-3 flex items-start space-x-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col space-y-3">
          {mode === "FLOOR" && (
            <>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Floor Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2nd Floor, Floor 3"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 w-full rounded-2xl border border-slate-200/90 bg-white px-3.5 text-xs font-bold text-slate-900 shadow-xs focus:border-[#FF5E36] focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Display Order *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  className="h-10 w-full rounded-2xl border border-slate-200/90 bg-white px-3.5 text-xs font-bold text-slate-900 shadow-xs focus:border-[#FF5E36] focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
                />
              </div>
            </>
          )}

          {mode === "ROOM" && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Room Number / Identifier *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 101, 204"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="h-10 w-full rounded-2xl border border-slate-200/90 bg-white px-3.5 text-xs font-bold text-slate-900 shadow-xs focus:border-[#FF5E36] focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
              />
            </div>
          )}

          {mode === "BED" && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Bed Label / Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Bed A, Bed B"
                value={bedLabel}
                onChange={(e) => setBedLabel(e.target.value)}
                className="h-10 w-full rounded-2xl border border-slate-200/90 bg-white px-3.5 text-xs font-bold text-slate-900 shadow-xs focus:border-[#FF5E36] focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
              />
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="spring-press rounded-xl px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="spring-press inline-flex items-center space-x-1.5 rounded-2xl bg-[#FF5E36] px-4 py-2 text-xs font-extrabold text-white shadow-[0_8px_20px_-4px_rgba(255,94,54,0.38)] disabled:opacity-50"
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
