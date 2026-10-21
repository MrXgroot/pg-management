import { CreditCard, Inbox, Receipt } from "lucide-react";
import {
  formatDateDisplay,
  formatPaiseToRupees,
} from "../../../shared/formatters.js";

export function RecentTransactionsList({ transactions = [], isLoading }) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 pt-2 animate-pulse">
        <div className="h-16 w-full rounded-2xl bg-slate-200" />
        <div className="h-16 w-full rounded-2xl bg-slate-200" />
        <div className="h-16 w-full rounded-2xl bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Receipt History
        </h3>
        <span className="text-[11px] font-semibold text-slate-400">
          {transactions.length} records
        </span>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Receipt className="h-5 w-5" />
          </div>
          <p className="mt-2 text-xs font-bold text-slate-700">
            No payment records
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Collections recorded during this cycle will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition hover:border-slate-300"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    {tx.tenantName}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>{formatDateDisplay(tx.paidOn)}</span>
                    {tx.roomNumber && tx.bedLabel && (
                      <span>
                        • Room {tx.roomNumber} ({tx.bedLabel})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-emerald-700 block">
                  +{formatPaiseToRupees(tx.amountPaise)}
                </span>
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600">
                  {tx.paymentMethod}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
