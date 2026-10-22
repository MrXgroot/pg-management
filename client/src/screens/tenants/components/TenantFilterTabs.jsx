import { PAYMENT_STATUS, TENANT_STATUS } from "../../../shared/constants.js";

const PAYMENT_STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Overdue", value: PAYMENT_STATUS.OVERDUE },
  { label: "Pending", value: PAYMENT_STATUS.PENDING },
  { label: "Paid", value: PAYMENT_STATUS.PAID },
  { label: "Credit", value: PAYMENT_STATUS.CREDIT },
];

export function TenantFilterTabs({
  status,
  onStatusChange,
  paymentStatus,
  onPaymentStatusChange,
  totalCount = 0,
}) {
  return (
    <div className="space-y-2.5">
      {/* Primary Segment Toggle (Active vs Checked Out) */}
      <div className="flex rounded-2xl border border-slate-200/90 bg-slate-100/80 p-1 dark:border-neutral-800 dark:bg-[#16171C]">
        <button
          type="button"
          onClick={() => onStatusChange(TENANT_STATUS.ACTIVE)}
          className={`spring-press flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
            status === TENANT_STATUS.ACTIVE
              ? "bg-slate-900 text-white shadow-[0_4px_14px_-2px_rgba(15,23,42,0.3)] dark:bg-white dark:text-slate-900"
              : "text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white"
          }`}
        >
          Active Occupants
        </button>
        <button
          type="button"
          onClick={() => onStatusChange(TENANT_STATUS.CHECKED_OUT)}
          className={`spring-press flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
            status === TENANT_STATUS.CHECKED_OUT
              ? "bg-slate-900 text-white shadow-[0_4px_14px_-2px_rgba(15,23,42,0.3)] dark:bg-white dark:text-slate-900"
              : "text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white"
          }`}
        >
          Checked Out
        </button>
      </div>

      {/* Section Header & Result Count */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-neutral-400">
          Payment Filter
        </span>
        <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-extrabold text-slate-700 dark:bg-neutral-800 dark:text-neutral-300">
          {totalCount} {totalCount === 1 ? "Record" : "Records"}
        </span>
      </div>

      {/* Secondary Status Filter Chips Rail */}
      <div className="no-scrollbar -mx-1 flex items-center space-x-1.5 overflow-x-auto px-1 py-0.5">
        {PAYMENT_STATUS_OPTIONS.map((option) => {
          const isSelected = paymentStatus === option.value;
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => onPaymentStatusChange(option.value)}
              className={`spring-press shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                isSelected
                  ? "bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900"
                  : "border border-slate-200/90 bg-white text-slate-600 hover:border-slate-300 dark:border-neutral-800 dark:bg-[#16171C] dark:text-neutral-300"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
