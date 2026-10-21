import { Calendar, ChevronRight, MapPin, Phone } from "lucide-react";
import {
  formatDateDisplay,
  formatPaiseToRupees,
  formatPhone,
} from "../../../shared/formatters.js";
import { STATUS_BADGE_CONFIG } from "../../../shared/constants.js";

export function TenantCard({ tenant, onClick }) {
  const currentBed = tenant.currentBed;
  const balances = tenant.balances || {};
  const paymentBadge = STATUS_BADGE_CONFIG[balances.paymentStatus];

  const hasOutstanding = (balances.totalOutstandingPaise || 0) > 0;
  const hasOverdue = (balances.overduePaise || 0) > 0;
  const hasCredit = (balances.advanceCreditPaise || 0) > 0;

  return (
    <button
      type="button"
      onClick={() => onClick?.(tenant)}
      className="flex w-full flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-xs transition hover:border-indigo-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">
              {tenant.name}
            </span>
            {paymentBadge && (
              <span
                className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${paymentBadge.bg} ${paymentBadge.text} ${paymentBadge.border}`}
              >
                {paymentBadge.label}
              </span>
            )}
          </div>

          <a
            href={`tel:${tenant.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-indigo-600"
          >
            <Phone className="h-3 w-3" />
            <span>{formatPhone(tenant.phone)}</span>
          </a>
        </div>

        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>

      {/* Assignment & Stay Information */}
      <div className="mt-3 flex flex-wrap items-center gap-y-1 gap-x-3 text-[11px] text-slate-500">
        <div className="flex items-center gap-1 font-medium text-slate-700">
          <MapPin className="h-3 w-3 text-slate-400" />
          {currentBed ? (
            <span>
              {currentBed.floorName} • Room {currentBed.roomNumber} (
              {currentBed.bedLabel})
            </span>
          ) : (
            <span className="italic text-slate-400">No active assignment</span>
          )}
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          <Calendar className="h-3 w-3" />
          <span>Joined {formatDateDisplay(tenant.joiningDate)}</span>
        </div>
      </div>

      {/* Financial Health Summary Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
        <span className="text-[11px] font-medium text-slate-400">Balance</span>

        <div className="flex items-center gap-2 text-right">
          {hasOverdue && (
            <span className="font-bold text-rose-600">
              {formatPaiseToRupees(balances.overduePaise)} overdue
            </span>
          )}
          {hasOutstanding && !hasOverdue && (
            <span className="font-semibold text-amber-700">
              {formatPaiseToRupees(balances.totalOutstandingPaise)} due
            </span>
          )}
          {hasCredit && (
            <span className="font-semibold text-indigo-700">
              +{formatPaiseToRupees(balances.advanceCreditPaise)} credit
            </span>
          )}
          {!hasOutstanding && !hasCredit && (
            <span className="font-semibold text-emerald-600">Settled</span>
          )}
        </div>
      </div>
    </button>
  );
}
