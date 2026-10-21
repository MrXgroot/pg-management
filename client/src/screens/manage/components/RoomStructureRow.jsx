import { useState } from "react";
import { Power, Plus, Bed, Trash2, AlertCircle, Loader2 } from "lucide-react";
import { useToggleBedActive } from "../../../data/structure/useBedMutations.js";
import { useDeleteBed } from "../../../data/structure/useStructureMutations.js";

export function RoomStructureRow({ room, propertyId, onAddBed }) {
  const { mutate: toggleBedActive, isPending: isTogglePending } =
    useToggleBedActive(propertyId);
  const { mutate: deleteBed, isPending: isDeletePending } =
    useDeleteBed(propertyId);

  const [bedToDelete, setBedToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const beds = room?.beds || [];

  function handleConfirmDelete() {
    if (!bedToDelete) return;
    setDeleteError(null);

    deleteBed(
      { bedId: bedToDelete.id },
      {
        onSuccess: () => {
          setBedToDelete(null);
        },
        onError: (err) => {
          setDeleteError(
            err.message ||
              "Cannot delete bed with assignment history. Deactivate instead.",
          );
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
      {/* Room Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900">
            Room {room.roomNumber}
          </span>
          <span className="rounded-md bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
            {beds.length} {beds.length === 1 ? "Bed" : "Beds"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onAddBed(room)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-indigo-600 shadow-2xs transition hover:border-indigo-200 hover:bg-indigo-50 active:scale-95"
        >
          <Plus className="h-3 w-3" />
          <span>Add Bed</span>
        </button>
      </div>

      {/* Bed Deletion Error Notice */}
      {deleteError && (
        <div className="flex items-start gap-1.5 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" />
          <span>{deleteError}</span>
        </div>
      )}

      {/* Bed Inventory Pills */}
      {beds.length === 0 ? (
        <p className="py-1 text-[11px] italic text-slate-400">
          No beds configured in this room.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {beds.map((bed) => {
            const isOccupied = bed.status === "OCCUPIED" && bed.tenant;
            const isInactive = !bed.isActive;

            return (
              <div
                key={bed.id}
                className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 transition ${
                  isInactive
                    ? "border-slate-200 bg-slate-100/60 opacity-60"
                    : isOccupied
                      ? "border-blue-200/80 bg-white shadow-2xs"
                      : "border-emerald-200/80 bg-white shadow-2xs"
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <Bed
                    className={`h-3.5 w-3.5 shrink-0 ${
                      isInactive
                        ? "text-slate-400"
                        : isOccupied
                          ? "text-blue-600"
                          : "text-emerald-600"
                    }`}
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    {bed.bedLabel}
                  </span>
                  {isOccupied && (
                    <span className="truncate text-[10px] text-slate-500">
                      ({bed.tenant?.name})
                    </span>
                  )}
                  {isInactive && (
                    <span className="text-[10px] font-medium text-slate-400">
                      (Decommissioned)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {/* Power toggle */}
                  <button
                    type="button"
                    title={bed.isActive ? "Decommission bed" : "Reactivate bed"}
                    disabled={isTogglePending}
                    onClick={() =>
                      toggleBedActive({
                        bedId: bed.id,
                        isActive: !bed.isActive,
                      })
                    }
                    className={`flex h-6 w-6 items-center justify-center rounded-md border transition ${
                      bed.isActive
                        ? "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:text-slate-800"
                        : "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                    }`}
                  >
                    <Power className="h-3 w-3" />
                  </button>

                  {/* Delete Bed (Available only for unassigned/vacant beds) */}
                  <button
                    type="button"
                    title={
                      isOccupied
                        ? "Cannot delete an occupied bed"
                        : "Delete bed from structure"
                    }
                    disabled={isOccupied || isDeletePending}
                    onClick={() => {
                      setDeleteError(null);
                      setBedToDelete(bed);
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Bed Confirmation Dialog */}
      {bedToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-2xs"
        >
          <div className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
            <h4 className="text-xs font-bold text-slate-900">
              Confirm Bed Removal
            </h4>
            <p className="mt-1 text-[11px] text-slate-500">
              Are you sure you want to permanently remove{" "}
              <span className="font-semibold text-slate-800">
                {bedToDelete.bedLabel}
              </span>{" "}
              from Room {room.roomNumber}?
            </p>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setBedToDelete(null)}
                disabled={isDeletePending}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeletePending}
                className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
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
