import {
  CreditCard,
  ArrowRightLeft,
  FileText,
  LogOut,
  Phone,
  AlertCircle,
} from "lucide-react";
import {
  formatPaiseToRupees,
  formatPhone,
} from "../../../shared/formatters.js";

export function TenantActionsView({
  bed,
  room,
  onCollectRent,
  onShiftBed,
  onViewLedger,
  onCheckout,
}) {
  const tenant = bed?.tenant;

  if (!tenant) {
    return (
      <div className="py-6 text-center text-xs text-slate-500">
        No active occupant found on this bed.
      </div>
    );
  }

  const hasDues = tenant.totalOutstandingPaise > 0;
  const isOverdue = tenant.overduePaise > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Identity Card */}
      <div className="flex items-start justify-between rounded-2xl bg-slate-900 p-4 text-white">
        <div>
          <span className="text-base font-bold">{tenant.name}</span>
          <p className="mt-0.5 text-xs text-slate-300">
            Room {room?.roomNumber} • {bed.bedLabel}
          </p>
        </div>

        <a
          href={`tel:${tenant.phone}`}
          className="flex h-9 items-center gap-1.5 rounded-xl bg-white/10 px-3 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20 active:scale-95"
        >
          <Phone className="h-3.5 w-3.5" />
          <span>Call</span>
        </a>
      </div>

      {/* Financial Health Summary */}
      <div
        className={`flex items-center justify-between rounded-xl border p-3.5 ${
          isOverdue
            ? "border-rose-200 bg-rose-50/70 text-rose-900"
            : hasDues
              ? "border-amber-200 bg-amber-50/70 text-amber-900"
              : "border-emerald-200 bg-emerald-50/70 text-emerald-900"
        }`}
      >
        <div className="flex items-center gap-2">
          {isOverdue && <AlertCircle className="h-4 w-4 text-rose-600" />}
          <div>
            <span className="text-xs font-semibold block">
              {isOverdue
                ? "Overdue Payment"
                : hasDues
                  ? "Pending Due"
                  : "All Clear"}
            </span>
            <span className="text-[11px] opacity-80">
              {formatPhone(tenant.phone)}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-sm font-bold">
            {formatPaiseToRupees(tenant.totalOutstandingPaise)}
          </span>
          {isOverdue && (
            <p className="text-[10px] font-semibold text-rose-600">
              ({formatPaiseToRupees(tenant.overduePaise)} overdue)
            </p>
          )}
        </div>
      </div>

      {/* Actions Stack */}
      <div className="flex flex-col gap-2 pt-1">
        <button
          type="button"
          onClick={() => onCollectRent(bed)}
          className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 text-left font-semibold text-slate-800 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50/40 active:scale-98"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Collect Rent
              </span>
              <span className="text-[11px] font-normal text-slate-500">
                Record cash, UPI, or advance credit
              </span>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onShiftBed(bed)}
          className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 text-left font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-98"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <ArrowRightLeft className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Shift Bed
              </span>
              <span className="text-[11px] font-normal text-slate-500">
                Transfer occupant to another vacant bed
              </span>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onViewLedger(bed)}
          className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 text-left font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-98"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Tenant Details & Ledger
              </span>
              <span className="text-[11px] font-normal text-slate-500">
                Timeline of past receipts and charges
              </span>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onCheckout(bed)}
          className="flex w-full items-center justify-between rounded-xl border border-rose-200 bg-white p-3.5 text-left font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50/50 active:scale-98"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <LogOut className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-rose-900 block">
                Checkout Tenant
              </span>
              <span className="text-[11px] font-normal text-rose-600/80">
                Vacate bed and initiate deposit settlement
              </span>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
