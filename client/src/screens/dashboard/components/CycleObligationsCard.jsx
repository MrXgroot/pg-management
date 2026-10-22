import { formatPaiseToRupees } from "../../../shared/formatters.js";

export function CycleObligationsCard({ summary = {} }) {
  const financials = summary.financials || {};
  const totalObligationsPaise = financials.totalObligationsPaise ?? 0;
  const totalCollectedPaise = financials.totalCollectedPaise ?? 0;
  const totalPendingPaise = financials.totalPendingPaise ?? 0;

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-slate-200/90 bg-white p-5 shadow-[0_16px_36px_-4px_rgba(15,23,42,0.10)] dark:border-neutral-800 dark:bg-[#16171C]">
      {/* Brand Coral Glow */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#FF5E36]/10 blur-2xl" />

      {/* Main Obligation Stats */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
              Cycle Rent Obligations
            </span>
            <span className="inline-flex items-center rounded-full border border-[#FF5E36]/20 bg-[#FF5E36]/10 px-2 py-0.5 text-[10px] font-bold text-[#E64720] dark:text-[#FF7A59]">
              Active Cycle
            </span>
          </div>
          <div className="mt-1 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {formatPaiseToRupees(totalObligationsPaise)}
          </div>
        </div>

        {/* Mini Histogram */}
        <div className="flex h-12 items-end space-x-1.5 px-1 pt-2">
          <div className="h-6 w-2.5 rounded-full hero-stat-bar opacity-50" />
          <div className="h-8 w-2.5 rounded-full hero-stat-bar opacity-70" />
          <div className="h-11 w-2.5 rounded-full hero-stat-bar shadow-[0_0_10px_rgba(255,94,54,0.4)]" />
          <div className="h-7 w-2.5 rounded-full hero-stat-bar opacity-60" />
          <div className="h-9 w-2.5 rounded-full hero-stat-bar opacity-85" />
        </div>
      </div>

      {/* Collected vs Pending Bottom Strip */}
      <div className="-mx-5 -mb-5 mt-4 flex items-center justify-between rounded-b-[32px] border-t border-slate-100 bg-slate-50/70 px-5 py-3 text-xs dark:border-neutral-800/80 dark:bg-neutral-900/40">
        <div className="flex items-center space-x-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-xs" />
          <span className="font-semibold text-slate-500 dark:text-neutral-400">
            Collected:
          </span>
          <span className="font-bold text-slate-900 dark:text-neutral-200">
            {formatPaiseToRupees(totalCollectedPaise)}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5E36] shadow-xs" />
          <span className="font-semibold text-slate-500 dark:text-neutral-400">
            Pending:
          </span>
          <span className="font-black text-[#E64720] dark:text-[#FF7A59]">
            {formatPaiseToRupees(totalPendingPaise)}
          </span>
        </div>
      </div>
    </div>
  );
}
