import {
  AlertCircle,
  ArrowDownLeft,
  CheckCircle2,
  IndianRupee,
  Wallet,
} from "lucide-react";
import { formatPaiseToRupees } from "../../../shared/formatters.js";

export function FinancialSummaryCard({ summary, isLoading }) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs animate-pulse">
        <div className="h-4 w-32 rounded-md bg-slate-200" />
        <div className="h-2.5 w-full rounded-full bg-slate-200" />
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="h-20 rounded-xl bg-slate-100" />
          <div className="h-20 rounded-xl bg-slate-100" />
          <div className="h-20 rounded-xl bg-slate-100" />
          <div className="h-20 rounded-xl bg-slate-100" />
        </div>
      </div>
    );
  }

  const financials = summary?.financials || {};
  const totalBilledPaise = financials.totalBilledPaise || 0;
  const totalCollectedPaise = financials.totalCollectedPaise || 0;
  const totalOutstandingPaise = financials.totalOutstandingPaise || 0;
  const overduePaise = financials.overduePaise || 0;
  const advanceCreditPaise = financials.advanceCreditPaise || 0;

  const collectionPercent =
    totalBilledPaise > 0
      ? Math.min(
          100,
          Math.round((totalCollectedPaise / totalBilledPaise) * 100),
        )
      : 0;

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
      {/* Progress Header */}
      <div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-900">Collections Rate</span>
          <span className="font-extrabold text-indigo-600">
            {collectionPercent}%
          </span>
        </div>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-500 ease-out"
            style={{ width: `${collectionPercent}%` }}
          />
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Billed */}
        <div className="flex flex-col justify-between rounded-xl bg-slate-50 p-3">
          <div className="flex items-center gap-1.5 text-slate-500">
            <IndianRupee className="h-3.5 w-3.5" />
            <span className="text-[11px] font-medium">Billed / Expected</span>
          </div>
          <span className="mt-2 text-base font-bold text-slate-900">
            {formatPaiseToRupees(totalBilledPaise)}
          </span>
        </div>

        {/* Total Collected */}
        <div className="flex flex-col justify-between rounded-xl bg-emerald-50/70 p-3">
          <div className="flex items-center gap-1.5 text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="text-[11px] font-medium">Collected</span>
          </div>
          <span className="mt-2 text-base font-bold text-emerald-900">
            {formatPaiseToRupees(totalCollectedPaise)}
          </span>
        </div>

        {/* Pending & Overdue */}
        <div className="flex flex-col justify-between rounded-xl bg-rose-50/70 p-3">
          <div className="flex items-center gap-1.5 text-rose-700">
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="text-[11px] font-medium">Pending Dues</span>
          </div>
          <div>
            <span className="mt-2 text-base font-bold text-rose-900 block">
              {formatPaiseToRupees(totalOutstandingPaise)}
            </span>
            {overduePaise > 0 && (
              <span className="text-[10px] font-semibold text-rose-600">
                ({formatPaiseToRupees(overduePaise)} overdue)
              </span>
            )}
          </div>
        </div>

        {/* Advance Credits */}
        <div className="flex flex-col justify-between rounded-xl bg-indigo-50/70 p-3">
          <div className="flex items-center gap-1.5 text-indigo-700">
            <Wallet className="h-3.5 w-3.5" />
            <span className="text-[11px] font-medium">Advance Held</span>
          </div>
          <span className="mt-2 text-base font-bold text-indigo-900">
            {formatPaiseToRupees(advanceCreditPaise)}
          </span>
        </div>
      </div>
    </section>
  );
}
