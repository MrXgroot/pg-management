import { Phone, Zap, MapPin, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  formatPaiseToRupees,
  formatPhone,
  formatDateDisplay,
} from "../../../shared/formatters.js";

export function CollectionQueueCard({ tenant, onCollect }) {
  const balances = tenant?.balances || {};
  const currentBed = tenant?.currentBed;
  const overduePaise = balances.overduePaise || 0;
  const outstandingPaise = balances.totalOutstandingPaise || 0;
  const isOverdue = overduePaise > 0;
  const isPending = outstandingPaise > 0;

  // Initial letter badge
  const initial = tenant?.name
    ? tenant.name.trim().charAt(0).toUpperCase()
    : "T";

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-slate-200/90 bg-white shadow-[0_4px_18px_-2px_rgba(15,23,42,0.06)] transition-all hover:shadow-[0_16px_36px_-4px_rgba(15,23,42,0.10)] dark:border-neutral-800 dark:bg-[#16171C]">
      {/* Top Body */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          {/* Identity & Location */}
          <div className="flex items-start space-x-3 min-w-0">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-100 text-xs font-black text-slate-800 shadow-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
              {initial}
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-[#16171C] ${
                  isOverdue
                    ? "bg-[#E64720]"
                    : isPending
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                }`}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="truncate text-base font-black tracking-tight text-slate-900 transition-colors group-hover:text-[#FF5E36] dark:text-white">
                  {tenant?.name}
                </h3>
                {isOverdue ? (
                  <span className="rounded-md border border-[#E64720]/25 bg-[#FF5E36]/10 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-[#E64720] dark:text-[#FF7A59]">
                    Overdue
                  </span>
                ) : isPending ? (
                  <span className="rounded-md border border-amber-500/25 bg-amber-50 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                    Pending
                  </span>
                ) : (
                  <span className="rounded-md border border-emerald-500/25 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                    Paid
                  </span>
                )}
              </div>

              {/* Location Badge */}
              <div className="mt-1 flex items-center space-x-1.5 text-[11px] font-semibold text-slate-500 dark:text-neutral-400">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-[#FF5E36]" />
                {currentBed ? (
                  <span className="truncate">
                    {currentBed.floorName} • Rm {currentBed.roomNumber} (
                    {currentBed.bedLabel})
                  </span>
                ) : (
                  <span className="italic text-slate-400">
                    No room assigned
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Outstanding Amount Column */}
          <div className="text-right shrink-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Amount Due
            </span>
            <div className="text-lg font-black tracking-tight text-[#E64720] dark:text-[#FF7A59]">
              {formatPaiseToRupees(isOverdue ? overduePaise : outstandingPaise)}
            </div>
          </div>
        </div>

        {/* Due Date Indicator */}
        <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-100/70 px-3 py-1.5 text-[11px] dark:bg-neutral-900/60">
          <div className="flex items-center space-x-1.5 text-slate-600 dark:text-neutral-300">
            {isOverdue ? (
              <span className="flex items-center space-x-1 font-bold text-[#E64720] dark:text-[#FF7A59]">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>Overdue cycle debt</span>
              </span>
            ) : isPending ? (
              <span className="font-semibold text-slate-500 dark:text-neutral-400">
                Active monthly rental due
              </span>
            ) : (
              <span className="flex items-center space-x-1 font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>All dues cleared</span>
              </span>
            )}
          </div>

          <span className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500">
            Joined {formatDateDisplay(tenant?.joiningDate)}
          </span>
        </div>
      </div>

      {/* Action Footer Bar */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-4 py-2.5 dark:border-neutral-800/80 dark:bg-neutral-900/40">
        {/* Call Dialer Trigger */}
        <a
          href={`tel:${tenant?.phone}`}
          className="spring-press inline-flex items-center space-x-1.5 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:border-slate-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
        >
          <Phone className="h-3.5 w-3.5 text-slate-400 dark:text-neutral-400" />
          <span>{formatPhone(tenant?.phone)}</span>
        </a>

        {/* Collect Action Button */}
        <button
          type="button"
          onClick={() => onCollect(tenant)}
          className="spring-press flex items-center space-x-1 rounded-2xl bg-[#FF5E36] px-4 py-1.5 text-xs font-black text-white shadow-[0_8px_20px_-4px_rgba(255,94,54,0.38)] active:scale-95"
        >
          <Zap className="h-3.5 w-3.5 fill-current" />
          <span>Collect</span>
        </button>
      </div>
    </div>
  );
}
