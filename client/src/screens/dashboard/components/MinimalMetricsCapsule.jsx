import { Users, AlertTriangle, Percent } from "lucide-react";

export function MinimalMetricsCapsule({ summary = {} }) {
  const totalMembers = summary.totalMembers ?? 0;
  const unpaidCount = summary.unpaidMembersCount ?? 0;
  const occupancyRate = summary.occupancyRate ?? 0;

  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white px-3 py-1.5 shadow-sm dark:border-neutral-800 dark:bg-[#16171C]">
      {/* Members Segment */}
      <div className="flex items-center space-x-1.5">
        <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <Users className="h-3 w-3 stroke-[2.2]" />
        </div>
        <div className="flex items-baseline space-x-1">
          <span className="text-xs font-black text-slate-900 dark:text-white">
            {totalMembers}
          </span>
          <span className="text-[10px] font-semibold text-slate-400">
            members
          </span>
        </div>
      </div>

      <div className="h-4 w-px bg-slate-200/90 dark:bg-neutral-800" />

      {/* Unpaid Segment */}
      <div className="flex items-center space-x-1.5">
        <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-3 w-3 stroke-[2.2]" />
        </div>
        <div className="flex items-baseline space-x-1">
          <span className="text-xs font-black text-amber-600 dark:text-amber-400">
            {unpaidCount}
          </span>
          <span className="text-[10px] font-semibold text-slate-400">
            unpaid
          </span>
        </div>
      </div>

      <div className="h-4 w-px bg-slate-200/90 dark:bg-neutral-800" />

      {/* Occupancy Segment */}
      <div className="flex items-center space-x-1.5">
        <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <Percent className="h-3 w-3 stroke-[2.2]" />
        </div>
        <div className="flex items-baseline space-x-1">
          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
            {occupancyRate}%
          </span>
          <span className="text-[10px] font-semibold text-slate-400">occ</span>
        </div>
      </div>
    </div>
  );
}
