import { ArrowUpRight, Check, AlertCircle } from "lucide-react";
import { formatPaiseToRupees } from "../../../shared/formatters.js";

export function RoomCard({ room, onClick }) {
  const activeBeds = (room.beds || []).filter((bed) => bed.isActive);
  const occupiedBeds = activeBeds.filter((bed) => bed.status === "OCCUPIED");
  const vacantCount = activeBeds.length - occupiedBeds.length;

  const roomOutstandingPaise = occupiedBeds.reduce(
    (acc, bed) => acc + (bed.tenant?.totalOutstandingPaise || 0),
    0,
  );

  const hasDues = roomOutstandingPaise > 0;

  return (
    <button
      type="button"
      onClick={() => onClick?.(room)}
      className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-4 text-left shadow-2xs transition-all hover:border-slate-300 hover:shadow-md active:scale-[0.98] focus:outline-none"
    >
      {/* Top Header: Room number + Sharing badge */}
      <div className="flex items-start justify-between">
        <span className="text-2xl font-black tracking-tight text-slate-900">
          {room.roomNumber}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
          {activeBeds.length} Sharing
        </span>
      </div>

      {/* Middle status line: Vacant or Occupied indicator */}
      <div className="mt-3 flex items-center gap-1.5 text-xs font-bold">
        {vacantCount > 0 ? (
          <>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-emerald-700">
              {vacantCount} {vacantCount === 1 ? "Bed Vacant" : "Beds Vacant"}
            </span>
          </>
        ) : (
          <>
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-slate-600">Fully Occupied</span>
          </>
        )}
      </div>

      {/* Bottom Footer: Payment status indicator with action arrow */}
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
        {hasDues ? (
          <div className="flex items-center gap-1 text-xs font-bold text-rose-600">
            <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
            <span>{formatPaiseToRupees(roomOutstandingPaise)} Due</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
            <Check className="h-3.5 w-3.5 text-emerald-500" />
            <span>Paid</span>
          </div>
        )}

        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </button>
  );
}
