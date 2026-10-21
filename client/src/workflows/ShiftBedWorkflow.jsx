import { useState, useMemo } from "react";
import {
  AlertCircle,
  ArrowRightLeft,
  Calendar,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useShiftBed } from "../data/mutations/useShiftBed.js";

function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ShiftBedWorkflow({
  propertyId,
  currentBed,
  currentRoom,
  floors = [],
  onSuccess,
  onCancel,
}) {
  const today = getTodayString();
  const tenant = currentBed?.tenant;

  const {
    mutate: shiftBed,
    isPending,
    error: mutationError,
  } = useShiftBed(propertyId);

  const [selectedTargetBedId, setSelectedTargetBedId] = useState("");
  const [shiftDate, setShiftDate] = useState(today);
  const [validationError, setValidationError] = useState(null);

  // Derive available vacant beds in-memory with zero network waterfalls
  const vacantBedsGrouped = useMemo(() => {
    const list = [];
    for (const floor of floors) {
      for (const room of floor.rooms || []) {
        for (const bed of room.beds || []) {
          if (
            bed.isActive &&
            bed.status === "VACANT" &&
            bed.id !== currentBed?.id
          ) {
            list.push({
              bedId: bed.id,
              bedLabel: bed.bedLabel,
              roomId: room.id,
              roomNumber: room.roomNumber,
              floorId: floor.id,
              floorName: floor.name,
            });
          }
        }
      }
    }
    return list;
  }, [floors, currentBed]);

  const selectedTargetBed = useMemo(() => {
    return (
      vacantBedsGrouped.find((item) => item.bedId === selectedTargetBedId) ||
      null
    );
  }, [vacantBedsGrouped, selectedTargetBedId]);

  function handleSubmit(e) {
    e.preventDefault();
    setValidationError(null);

    if (!tenant?.id) {
      setValidationError("No active tenant found to shift.");
      return;
    }

    if (!selectedTargetBedId) {
      setValidationError("Please select a destination bed.");
      return;
    }

    if (!shiftDate) {
      setValidationError("Shift date is required.");
      return;
    }

    shiftBed(
      {
        tenantId: tenant.id,
        targetBedId: selectedTargetBedId,
        shiftDate,
      },
      {
        onSuccess: () => {
          onSuccess?.();
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Current Assignment Card */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Occupant
          </span>
          <span className="text-sm font-bold text-slate-900 block mt-0.5">
            {tenant?.name || "—"}
          </span>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Current: Room {currentRoom?.roomNumber} • {currentBed?.bedLabel}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <ArrowRightLeft className="h-5 w-5" />
        </div>
      </div>

      {/* Mutation Error Feedback */}
      {mutationError && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <div className="text-xs">
            <span className="font-bold">Bed shift failed: </span>
            <span>
              {mutationError.message || "Unable to transfer bed assignment."}
            </span>
          </div>
        </div>
      )}

      {/* Local Validation Error */}
      {validationError && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Target Bed Selection */}
      <div>
        <label
          htmlFor="target-bed-select"
          className="text-xs font-semibold text-slate-700 block"
        >
          Destination Bed *
        </label>
        {vacantBedsGrouped.length === 0 ? (
          <div className="mt-1.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-center text-xs text-slate-500">
            No vacant beds available in this property.
          </div>
        ) : (
          <div className="relative mt-1.5">
            <select
              id="target-bed-select"
              required
              value={selectedTargetBedId}
              onChange={(e) => {
                setSelectedTargetBedId(e.target.value);
                setValidationError(null);
              }}
              className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 shadow-sm transition hover:border-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Select a vacant bed...</option>
              {vacantBedsGrouped.map((bedOption) => (
                <option key={bedOption.bedId} value={bedOption.bedId}>
                  {bedOption.floorName} — Room {bedOption.roomNumber} (
                  {bedOption.bedLabel})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Shift Date */}
      <div>
        <label
          htmlFor="shift-date"
          className="text-xs font-semibold text-slate-700 block"
        >
          Effective Shift Date *
        </label>
        <div className="relative mt-1.5">
          <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            id="shift-date"
            type="date"
            required
            value={shiftDate}
            onChange={(e) => {
              setShiftDate(e.target.value);
              setValidationError(null);
            }}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-medium text-slate-800 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          Closes current assignment and starts new assignment on this date.
        </p>
      </div>

      {/* Transfer Preview Card */}
      {selectedTargetBed && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-emerald-900">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <div className="text-xs leading-relaxed">
            <span className="font-bold">Transfer Summary: </span>
            {tenant?.name} will be relocated to{" "}
            <span className="font-semibold">
              {selectedTargetBed.floorName}, Room {selectedTargetBed.roomNumber}{" "}
              ({selectedTargetBed.bedLabel})
            </span>{" "}
            starting {shiftDate}. All historical terms and ledger balances will
            be preserved.
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-2 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 active:scale-95 disabled:pointer-events-none"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={
            isPending || vacantBedsGrouped.length === 0 || !selectedTargetBedId
          }
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Shifting Bed...</span>
            </>
          ) : (
            <span>Confirm Bed Shift</span>
          )}
        </button>
      </div>
    </form>
  );
}
