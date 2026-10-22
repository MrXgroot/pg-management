import { AlertCircle, IndianRupee, Users } from "lucide-react";
import { formatPaiseToRupees } from "../../../shared/formatters.js";

export function CollectionSummaryRibbon({
  totalOutstandingPaise = 0,
  unpaidCount = 0,
}) {
  return (
    <div className="grid grid-cols-2 gap-3 select-none">
      {/* Total Due Pill Card */}
      <div className="relative overflow-hidden rounded-[28px] border border-slate-200/90 bg-white p-4 shadow-[0_4px_18px_-2px_rgba(15,23,42,0.06)] dark:border-neutral-800 dark:bg-[#16171C]">
        <div className="flex items-center space-x-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#FF5E36]/10 text-[#FF5E36] dark:bg-[#FF5E36]/15">
            <IndianRupee className="h-4 w-4 stroke-[2.2]" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
            Total Outstanding
          </span>
        </div>

        <div className="mt-2 text-2xl font-black tracking-tight text-[#E64720] dark:text-[#FF7A59]">
          {formatPaiseToRupees(totalOutstandingPaise)}
        </div>

        <div className="mt-0.5 text-[10px] font-semibold text-slate-400 dark:text-neutral-500">
          Awaiting collection
        </div>
      </div>

      {/* Pending Tenants Pill Card */}
      <div className="relative overflow-hidden rounded-[28px] border border-slate-200/90 bg-white p-4 shadow-[0_4px_18px_-2px_rgba(15,23,42,0.06)] dark:border-neutral-800 dark:bg-[#16171C]">
        <div className="flex items-center space-x-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
            <Users className="h-4 w-4 stroke-[2.2]" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
            Pending Queue
          </span>
        </div>

        <div className="mt-2 flex items-baseline space-x-1.5">
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {unpaidCount}
          </span>
          <span className="text-xs font-bold text-slate-400">Tenants</span>
        </div>

        <div className="mt-0.5 flex items-center space-x-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-3 w-3 stroke-[2.2]" />
          <span>Needs attention</span>
        </div>
      </div>
    </div>
  );
}
