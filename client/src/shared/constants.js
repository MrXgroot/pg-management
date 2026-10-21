export const BED_STATUS = Object.freeze({
  VACANT: "VACANT",
  OCCUPIED: "OCCUPIED",
  INACTIVE: "INACTIVE",
});

export const PAYMENT_STATUS = Object.freeze({
  PAID: "PAID",
  PENDING: "PENDING",
  OVERDUE: "OVERDUE",
  CREDIT: "CREDIT",
});

export const TENANT_STATUS = Object.freeze({
  ACTIVE: "ACTIVE",
  CHECKED_OUT: "CHECKED_OUT",
});

export const PAYMENT_METHODS = Object.freeze({
  UPI: "UPI",
  CASH: "CASH",
  BANK_TRANSFER: "BANK_TRANSFER",
  OTHER: "OTHER",
});

export const PAYMENT_METHOD_OPTIONS = Object.freeze([
  { value: PAYMENT_METHODS.UPI, label: "UPI" },
  { value: PAYMENT_METHODS.CASH, label: "Cash" },
  { value: PAYMENT_METHODS.BANK_TRANSFER, label: "Bank Transfer" },
  { value: PAYMENT_METHODS.OTHER, label: "Other" },
]);

export const STATUS_BADGE_CONFIG = Object.freeze({
  // Bed Status
  [BED_STATUS.VACANT]: {
    label: "Vacant",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  [BED_STATUS.OCCUPIED]: {
    label: "Occupied",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  [BED_STATUS.INACTIVE]: {
    label: "Decommissioned",
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-300",
    dot: "bg-slate-400",
  },

  // Payment Status
  [PAYMENT_STATUS.PAID]: {
    label: "Paid",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  [PAYMENT_STATUS.PENDING]: {
    label: "Pending",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  [PAYMENT_STATUS.OVERDUE]: {
    label: "Overdue",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
  },
  [PAYMENT_STATUS.CREDIT]: {
    label: "Advance Credit",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
  },

  // Tenant Status
  [TENANT_STATUS.ACTIVE]: {
    label: "Active",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  [TENANT_STATUS.CHECKED_OUT]: {
    label: "Checked Out",
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-300",
  },
});

export const LOCAL_STORAGE_KEYS = Object.freeze({
  SELECTED_PROPERTY_ID: "stay_ledger_selected_property_id",
});
