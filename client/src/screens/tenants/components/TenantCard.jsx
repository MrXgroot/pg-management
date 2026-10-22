import {
  ArrowUpRight,
  Calendar,
  MapPin,
  Phone,
  AlertCircle,
  Check,
} from "lucide-react";
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

  // Initial avatar letter
  const initial = tenant.name
    ? tenant.name.trim().charAt(0).toUpperCase()
    : "T";

  return (
    <div
      onClick={() => onClick?.(tenant)}
      className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-[28px] border border-slate-200/90 bg-white shadow-[0_4px_18px_-2px_rgba(15,23,42,0.06)] transition-all hover:shadow-[0_16px_36px_-4px_rgba(15,23,42,0.10)] active:scale-[0.98] dark:border-neutral-800 dark:bg-[#16171C]"
    >
      {/* Top Body */}
      <div className="p-3.5 pb-3">
        <div className="flex items-start justify-between gap-2">
          {/* Identity & Subdued Minimal Monogram */}
          <div className="flex items-center space-x-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-100/90 text-xs font-black text-slate-700 shadow-xs transition-colors group-hover:border-[#FF5E36]/30 group-hover:bg-[#FF5E36]/10 group-hover:text-[#FF5E36] dark:border-neutral-700/80 dark:bg-neutral-800/80 dark:text-neutral-300 dark:group-hover:text-[#FF7A59]">
              {initial}
              {/* Financial status indicator dot */}
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-[#16171C] ${
                  hasOverdue
                    ? "bg-[#E64720]"
                    : hasOutstanding
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                }`}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="truncate text-base font-black tracking-tight text-slate-900 transition-colors group-hover:text-[#FF5E36] dark:text-white">
                  {tenant.name}
                </span>

                {paymentBadge && (
                  <span
                    className={`rounded-lg border px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${paymentBadge.bg} ${paymentBadge.text} ${paymentBadge.border}`}
                  >
                    {paymentBadge.label}
                  </span>
                )}
              </div>

              {/* Joined Date */}
              <div className="mt-0.5 flex items-center space-x-1 text-[11px] font-semibold text-slate-400 dark:text-neutral-500">
                <Calendar className="h-3 w-3 shrink-0" />
                <span>Joined {formatDateDisplay(tenant.joiningDate)}</span>
              </div>
            </div>
          </div>

          {/* Quick-Dial Button */}
          <a
            href={`tel:${tenant.phone}`}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Call ${tenant.name}`}
            className="spring-press flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 text-slate-600 shadow-xs hover:border-slate-300 hover:text-slate-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:text-white"
          >
            <Phone className="h-3.5 w-3.5 stroke-[2.2]" />
          </a>
        </div>

        {/* Location / Bed Allocation Pill */}
        <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-100/70 px-2.5 py-1.5 dark:bg-neutral-900/60">
          <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-700 dark:text-neutral-300">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#FF5E36]" />
            {currentBed ? (
              <span>
                {currentBed.floorName} • Rm {currentBed.roomNumber} (
                {currentBed.bedLabel})
              </span>
            ) : (
              <span className="italic text-slate-400">
                No active assignment
              </span>
            )}
          </div>

          <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500">
            {formatPhone(tenant.phone)}
          </span>
        </div>
      </div>

      {/* Tinted Bottom Bar */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-3.5 py-2 text-[11px] dark:border-neutral-800/80 dark:bg-neutral-900/40">
        <div className="flex items-center space-x-1.5">
          {hasOverdue ? (
            <div className="flex items-center space-x-1 font-black text-[#E64720] dark:text-[#FF7A59]">
              <AlertCircle className="h-3 w-3 shrink-0 stroke-[2.2]" />
              <span>{formatPaiseToRupees(balances.overduePaise)} Overdue</span>
            </div>
          ) : hasOutstanding ? (
            <div className="flex items-center space-x-1 font-black text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-3 w-3 shrink-0 stroke-[2.2]" />
              <span>
                {formatPaiseToRupees(balances.totalOutstandingPaise)} Due
              </span>
            </div>
          ) : hasCredit ? (
            <div className="flex items-center space-x-1 font-black text-indigo-600 dark:text-indigo-400">
              <span>
                +{formatPaiseToRupees(balances.advanceCreditPaise)} Advance
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 font-bold text-emerald-600 dark:text-emerald-400">
              <Check className="h-3 w-3 shrink-0 stroke-[2.5]" />
              <span>Settled</span>
            </div>
          )}
        </div>

        {/* Interactive Corner Arrow */}
        <div className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-400 shadow-xs transition-all group-hover:border-transparent group-hover:bg-[#FF5E36] group-hover:text-white dark:border-transparent dark:bg-neutral-800">
          <ArrowUpRight className="h-3 w-3 stroke-[2.2]" />
        </div>
      </div>
    </div>
  );
}
