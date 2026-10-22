import { ArrowUpRight, Check, AlertCircle } from "lucide-react";
import { formatPaiseToRupees } from "../../../shared/formatters.js";

function getSegmentClass(paymentStatus) {
  switch (paymentStatus) {
    case "PAID":
      return "bg-emerald-500 shadow-xs";
    case "UNPAID":
      return "bg-amber-500 shadow-xs";
    case "DISABLED":
      return "bg-slate-300 dark:bg-neutral-700";
    case "EMPTY":
    default:
      return "bg-white border border-slate-300 dark:bg-neutral-800 dark:border-neutral-600";
  }
}

export function RoomCard({ room, onClick }) {
  const beds = room.beds || [];
  const totalBeds = room.totalBeds ?? beds.length;
  const occupiedBeds = room.occupiedBeds ?? 0;
  const vacantBeds = room.vacantBeds ?? 0;
  const roomPendingPaise = room.roomPendingPaise ?? 0;

  return (
    <div
      onClick={() => onClick?.(room)}
      className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-[28px] border border-slate-200/90 bg-white shadow-[0_4px_18px_-2px_rgba(15,23,42,0.06)] transition-all hover:shadow-[0_16px_36px_-4px_rgba(15,23,42,0.10)] active:scale-[0.97] dark:border-neutral-800 dark:bg-[#16171C]"
    >
      <div className="p-3.5 pb-3">
        {/* Top: Room Number & Bed Sharing badge */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-black tracking-tight text-slate-900 transition-colors group-hover:text-[#FF5E36] dark:text-white">
            {room.roomNumber}
          </span>
          <span className="rounded-lg border border-slate-200/70 bg-slate-100 px-1.5 py-0.5 text-[10px] font-extrabold text-slate-600 dark:border-transparent dark:bg-neutral-800 dark:text-neutral-300">
            {totalBeds} Bed
          </span>
        </div>

        {/* Multi-segmented color split line for beds */}
        <div className="mt-3">
          <div className="flex w-full items-center space-x-1.5 rounded-full bg-slate-100/60 p-1 dark:bg-neutral-900/60">
            {beds.map((bed) => (
              <div
                key={bed.id}
                className={`h-2 flex-1 rounded-full transition-all ${getSegmentClass(bed.paymentStatus)}`}
              />
            ))}
          </div>

          {/* Occupancy textual status */}
          <div className="mt-2 flex items-center justify-between px-0.5 text-[10px] font-bold">
            <span className="text-slate-500 dark:text-neutral-400">
              {occupiedBeds}/{totalBeds} Occupied
            </span>
            {vacantBeds > 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400">
                {vacantBeds} free
              </span>
            ) : (
              <span className="text-slate-400">Full</span>
            )}
          </div>
        </div>
      </div>

      {/* Tinted Bottom Strip: Dues & Action */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-3.5 py-2 text-[11px] dark:border-neutral-800/80 dark:bg-neutral-900/40">
        {roomPendingPaise > 0 ? (
          <div className="flex items-center space-x-1 font-black text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-3 w-3 shrink-0 stroke-[2.2]" />
            <span>{formatPaiseToRupees(roomPendingPaise)} Due</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1 font-bold text-emerald-600 dark:text-emerald-400">
            <Check className="h-3 w-3 shrink-0 stroke-[2.5]" />
            <span>Paid</span>
          </div>
        )}

        <div className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-400 shadow-xs transition-all group-hover:border-transparent group-hover:bg-[#FF5E36] group-hover:text-white dark:border-transparent dark:bg-neutral-800">
          <ArrowUpRight className="h-3 w-3 stroke-[2.2]" />
        </div>
      </div>
    </div>
  );
}
