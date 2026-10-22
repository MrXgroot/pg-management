import { useState, useEffect } from "react";
import {
  ChevronLeft,
  Building2,
  Plus,
  DoorClosed,
  Trash2,
  AlertCircle,
  Loader2,
  Bed as BedIcon,
  X,
} from "lucide-react";
import { useToggleBedActive } from "../../../data/structure/useBedMutations.js";
import { useDeleteBed } from "../../../data/structure/useStructureMutations.js";

export function PropertyDetailView({
  property,
  floors = [],
  propertyId,
  onBackToHub,
  onOpenAddFloor,
  onOpenAddRoom,
  onOpenAddBed,
}) {
  const [selectedFloorId, setSelectedFloorId] = useState(null);

  // Sync active floor selection
  useEffect(() => {
    if (floors.length > 0) {
      const exists = floors.some((f) => f.id === selectedFloorId);
      if (!exists) setSelectedFloorId(floors[0].id);
    } else {
      setSelectedFloorId(null);
    }
  }, [floors, selectedFloorId]);

  const activeFloor = floors.find((f) => f.id === selectedFloorId) || floors[0];
  const activeRooms = activeFloor?.rooms || [];

  const totalFloors = floors.length;
  const totalBeds = floors.reduce((acc, f) => {
    return (
      acc + (f.rooms?.reduce((rAcc, r) => rAcc + (r.beds?.length || 0), 0) || 0)
    );
  }, 0);

  const { mutate: toggleBedActive, isPending: isTogglePending } =
    useToggleBedActive(propertyId);
  const { mutate: deleteBed, isPending: isDeletePending } =
    useDeleteBed(propertyId);

  const [bedToDelete, setBedToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  function handleConfirmDeleteBed() {
    if (!bedToDelete) return;
    setDeleteError(null);

    deleteBed(
      { bedId: bedToDelete.id },
      {
        onSuccess: () => setBedToDelete(null),
        onError: (err) => {
          setDeleteError(
            err.message ||
              "Cannot delete bed with assignment history. Deactivate it instead.",
          );
        },
      },
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[440px] flex-col space-y-4 px-1 py-1 select-none">
      {/* Navigation Sub-Header */}
      <div className="flex items-center justify-between rounded-[28px] border border-slate-200/90 bg-white p-3.5 shadow-[0_4px_18px_-2px_rgba(15,23,42,0.06)] dark:border-neutral-800 dark:bg-[#16171C]">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBackToHub}
            className="spring-press flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200/90 bg-slate-50 text-slate-700 shadow-xs hover:border-slate-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
          >
            <ChevronLeft className="h-5 w-5 stroke-[2.5]" />
          </button>
          <div>
            <div className="flex items-center space-x-1.5">
              <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-white leading-none">
                {property?.name || "Active Property"}
              </h2>
              <span className="rounded-md border border-emerald-500/20 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                ACTIVE
              </span>
            </div>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-400 dark:text-neutral-500">
              {totalFloors} Floors • {totalBeds} Beds Configured
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBackToHub}
          className="spring-press rounded-xl border border-slate-200/80 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
        >
          All Branches
        </button>
      </div>

      {/* Property Details Card */}
      <div className="flex items-center justify-between rounded-[28px] border border-slate-200/90 bg-white p-4 shadow-[0_4px_18px_-2px_rgba(15,23,42,0.06)] dark:border-neutral-800 dark:bg-[#16171C]">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Property Address
          </span>
          <h3 className="mt-0.5 text-base font-black text-slate-900 dark:text-white">
            {property?.name}
          </h3>
          <p className="mt-0.5 text-xs font-semibold text-slate-400 dark:text-neutral-500">
            {property?.address || "Address not specified"}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FF5E36]/10 text-[#FF5E36] dark:bg-[#FF5E36]/15">
          <Building2 className="h-5 w-5 stroke-[2.2]" />
        </div>
      </div>

      {/* Floors Section Header & Rail */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-neutral-400">
              Floors
            </span>
            <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-800 dark:bg-neutral-800 dark:text-white">
              {floors.length} {floors.length === 1 ? "Floor" : "Floors"}
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenAddFloor}
            className="spring-press flex items-center space-x-1 rounded-xl bg-[#FF5E36]/10 px-2.5 py-1 text-xs font-extrabold text-[#E64720] dark:text-[#FF7A59]"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Add Floor</span>
          </button>
        </div>

        {/* Floor Pills */}
        <div className="no-scrollbar -mx-1 flex items-center space-x-2 overflow-x-auto px-1 py-0.5">
          {floors.map((floor) => {
            const isSelected = floor.id === selectedFloorId;
            const bedsOnFloor =
              floor.rooms?.reduce((acc, r) => acc + (r.beds?.length || 0), 0) ||
              0;

            return (
              <button
                key={floor.id}
                type="button"
                onClick={() => setSelectedFloorId(floor.id)}
                className={`spring-press flex shrink-0 items-center space-x-1.5 rounded-2xl border px-4 py-2 text-xs font-bold transition-all ${
                  isSelected
                    ? "border-slate-900 bg-slate-900 text-white shadow-[0_6px_16px_-2px_rgba(15,23,42,0.35)] dark:border-white dark:bg-white dark:text-slate-900"
                    : "border-slate-200/90 bg-white text-slate-700 shadow-xs dark:border-neutral-800 dark:bg-[#16171C] dark:text-neutral-300"
                }`}
              >
                <span>{floor.name}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                    isSelected
                      ? "bg-slate-800 text-slate-300 dark:bg-slate-200 dark:text-slate-800"
                      : "bg-slate-100 text-slate-500 dark:bg-neutral-800 dark:text-neutral-400"
                  }`}
                >
                  {bedsOnFloor}b
                </span>
              </button>
            );
          })}
        </div>

        {/* Current Floor Status Sub-Bar */}
        {activeFloor && (
          <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-2 text-xs dark:border-neutral-800/80 dark:bg-neutral-900/40">
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-slate-400">Managing:</span>
              <span className="font-black text-slate-900 dark:text-white">
                {activeFloor.name}
              </span>
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              {activeRooms.length} {activeRooms.length === 1 ? "Room" : "Rooms"}{" "}
              on floor
            </span>
          </div>
        )}
      </div>

      {/* Rooms Matrix Header */}
      <div className="flex items-center justify-between px-1 pt-1">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-neutral-400">
            Rooms & Capacity
          </span>
          <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">
            {activeRooms.length} Rooms
          </span>
        </div>

        <button
          type="button"
          onClick={() => onOpenAddRoom(activeFloor)}
          disabled={!activeFloor}
          className="spring-press flex items-center space-x-1 rounded-2xl bg-slate-900 px-3 py-1.5 text-xs font-black text-white shadow-sm dark:bg-white dark:text-slate-900 disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>Add Room</span>
        </button>
      </div>

      {/* Bed Deletion Error Notice */}
      {deleteError && (
        <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <span>{deleteError}</span>
        </div>
      )}

      {/* Rooms Grid / Empty State */}
      {activeRooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-slate-300 bg-white/50 py-12 text-center backdrop-blur-sm dark:border-neutral-800 dark:bg-[#16171C]/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-neutral-800 dark:text-neutral-500">
            <DoorClosed className="h-6 w-6 stroke-[1.8]" />
          </div>
          <h4 className="mt-3 text-sm font-bold text-slate-800 dark:text-neutral-200">
            No rooms on {activeFloor?.name || "this floor"}
          </h4>
          <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-neutral-500">
            Tap &apos;+ Add Room&apos; above to configure your room setup.
          </p>
        </div>
      ) : (
        <div className="flex flex-col space-y-3">
          {activeRooms.map((room) => {
            const beds = room.beds || [];

            return (
              <div
                key={room.id}
                className="flex flex-col space-y-3 rounded-[28px] border border-slate-200/90 bg-white p-4 shadow-[0_4px_18px_-2px_rgba(15,23,42,0.06)] dark:border-neutral-800 dark:bg-[#16171C]"
              >
                {/* Room Card Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                      Room {room.roomNumber}
                    </span>
                    <span className="rounded-lg border border-slate-200/70 bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold text-slate-600 dark:border-transparent dark:bg-neutral-800 dark:text-neutral-300">
                      {beds.length} {beds.length === 1 ? "Bed" : "Beds"} (
                      {beds.length} Sharing)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenAddBed(room)}
                    className="spring-press flex items-center space-x-1 rounded-xl bg-[#FF5E36]/10 px-2.5 py-1 text-xs font-extrabold text-[#E64720] dark:text-[#FF7A59]"
                  >
                    <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>Add Bed</span>
                  </button>
                </div>

                {/* Inline Bed Inventory Grid */}
                <div className="border-t border-slate-100 pt-2.5 dark:border-neutral-800/80">
                  <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <span>Configured Beds</span>
                    <span>Status & Actions</span>
                  </div>

                  {beds.length === 0 ? (
                    <p className="text-xs italic text-slate-400">
                      No beds added yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {beds.map((bed, bIdx) => {
                        const isOccupied =
                          bed.status === "OCCUPIED" && bed.tenant;
                        const isInactive = !bed.isActive;

                        return (
                          <div
                            key={bed.id}
                            className={`flex items-center justify-between rounded-2xl border px-3 py-2 transition-all ${
                              isInactive
                                ? "border-slate-200/80 bg-slate-100/60 opacity-60 dark:border-neutral-800 dark:bg-neutral-900/60"
                                : isOccupied
                                  ? "border-blue-200/80 bg-blue-50/20 dark:border-blue-900/30 dark:bg-blue-950/10"
                                  : "border-slate-200/90 bg-white dark:border-neutral-800 dark:bg-[#16171C]"
                            }`}
                          >
                            <div className="flex items-center space-x-2 overflow-hidden">
                              <div
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-black ${
                                  isInactive
                                    ? "bg-slate-200 text-slate-500 dark:bg-neutral-800 dark:text-neutral-400"
                                    : "bg-[#FF5E36]/10 text-[#FF5E36]"
                                }`}
                              >
                                {String.fromCharCode(65 + (bIdx % 26))}
                              </div>

                              <div className="min-w-0">
                                <span className="block truncate text-xs font-bold text-slate-900 dark:text-white">
                                  {bed.bedLabel}
                                </span>
                                {isOccupied && (
                                  <span className="block truncate text-[9px] font-semibold text-blue-600 dark:text-blue-400">
                                    {bed.tenant?.name}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-1">
                              {/* Power Toggle */}
                              <button
                                type="button"
                                disabled={isTogglePending}
                                onClick={() =>
                                  toggleBedActive({
                                    bedId: bed.id,
                                    isActive: !bed.isActive,
                                  })
                                }
                                title={
                                  bed.isActive
                                    ? "Decommission bed"
                                    : "Reactivate bed"
                                }
                                className={`spring-press flex h-6 w-6 items-center justify-center rounded-lg border text-[10px] font-bold ${
                                  bed.isActive
                                    ? "border-slate-200 bg-slate-50 text-slate-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400"
                                    : "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400"
                                }`}
                              >
                                ⏻
                              </button>

                              {/* Delete Bed */}
                              <button
                                type="button"
                                disabled={isOccupied || isDeletePending}
                                onClick={() => {
                                  setDeleteError(null);
                                  setBedToDelete(bed);
                                }}
                                title={
                                  isOccupied
                                    ? "Cannot delete an occupied bed"
                                    : "Delete bed"
                                }
                                className="spring-press flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:text-rose-400"
                              >
                                <X className="h-3.5 w-3.5 stroke-[2.5]" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {bedToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-xs rounded-[28px] border border-slate-200 bg-white p-5 shadow-2xl dark:border-neutral-800 dark:bg-[#16171C]">
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              Confirm Bed Removal
            </h4>
            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-neutral-400">
              Permanently delete bed{" "}
              <span className="font-bold text-slate-800 dark:text-neutral-200">
                {bedToDelete.bedLabel}
              </span>
              ?
            </p>
            <div className="mt-4 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setBedToDelete(null)}
                disabled={isDeletePending}
                className="spring-press rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteBed}
                disabled={isDeletePending}
                className="spring-press inline-flex items-center space-x-1 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-extrabold text-white shadow-xs"
              >
                {isDeletePending ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
