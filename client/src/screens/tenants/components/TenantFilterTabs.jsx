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
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {/* Primary Segment Toggle (Active vs Checked Out) */}
      <div className="flex rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => onStatusChange(TENANT_STATUS.ACTIVE)}
          className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
            status === TENANT_STATUS.ACTIVE
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Active Occupants
        </button>
        <button
          type="button"
          onClick={() => onStatusChange(TENANT_STATUS.CHECKED_OUT)}
          className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
            status === TENANT_STATUS.CHECKED_OUT
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Checked Out
        </button>
      </div>

      {/* Secondary Status Filter Chips */}
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto py-0.5">
        {PAYMENT_STATUS_OPTIONS.map((option) => {
          const isSelected = paymentStatus === option.value;
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => onPaymentStatusChange(option.value)}
              className={`shrink-0 rounded-lg px-3 py-1 text-[11px] font-semibold transition ${
                isSelected
                  ? "bg-slate-900 text-white shadow-xs"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
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
