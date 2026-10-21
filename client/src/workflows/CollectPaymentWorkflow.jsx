import { useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  IndianRupee,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  formatPaiseToRupees,
  parseRupeesToPaise,
} from "../shared/formatters.js";
import {
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_METHODS,
} from "../shared/constants.js";
import { useCollectPayment } from "../data/mutations/useCollectPayment.js";

function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function generateIdempotencyKey() {
  return `pay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function CollectPaymentWorkflow({
  propertyId,
  bed,
  room,
  onSuccess,
  onCancel,
}) {
  const today = getTodayString();
  const tenant = bed?.tenant;

  const {
    mutate: collectPayment,
    isPending,
    error: mutationError,
  } = useCollectPayment(propertyId);

  const [amountRupees, setAmountRupees] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.UPI);
  const [paidOn, setPaidOn] = useState(today);
  const [referenceNote, setReferenceNote] = useState("");
  const [shouldAdjustDueDate, setShouldAdjustDueDate] = useState(false);
  const [nextDueDateOverride, setNextDueDateOverride] = useState("");
  const [validationError, setValidationError] = useState(null);
  const [completedResult, setCompletedResult] = useState(null);

  const totalOutstandingPaise = tenant?.totalOutstandingPaise || 0;
  const overduePaise = tenant?.overduePaise || 0;

  function handleQuickFillFull() {
    if (totalOutstandingPaise > 0) {
      setAmountRupees(String(totalOutstandingPaise / 100));
      setValidationError(null);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setValidationError(null);

    if (!tenant?.id) {
      setValidationError("Tenant record missing.");
      return;
    }

    const amountPaise = parseRupeesToPaise(amountRupees);
    if (!amountRupees || amountPaise <= 0) {
      setValidationError("Collection amount must be greater than ₹0.");
      return;
    }

    if (!paidOn) {
      setValidationError("Payment date is required.");
      return;
    }

    if (shouldAdjustDueDate && !nextDueDateOverride) {
      setValidationError(
        "Please select the adjusted next due date or uncheck the option.",
      );
      return;
    }

    const payload = {
      tenantId: tenant.id,
      amountPaise,
      paidOn,
      paymentMethod,
      referenceNote: referenceNote.trim() || null,
      idempotencyKey: generateIdempotencyKey(),
      nextDueDateOverride: shouldAdjustDueDate ? nextDueDateOverride : null,
    };

    collectPayment(payload, {
      onSuccess: (data) => {
        setCompletedResult(data);
      },
    });
  }

  // Success Confirmation View
  if (completedResult) {
    const payment = completedResult.payment;
    const unallocatedPaise = completedResult.unallocatedPaise || 0;
    const allocations = completedResult.allocations || [];

    return (
      <div className="flex flex-col gap-4 py-2">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-sm">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-base font-bold text-emerald-950">
            Payment Recorded Successfully
          </h3>
          <p className="mt-0.5 text-xs font-semibold text-emerald-700">
            {formatPaiseToRupees(payment?.amountPaise || 0)} received via{" "}
            {payment?.paymentMethod}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500">Tenant</span>
            <span className="font-semibold text-slate-800">{tenant?.name}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500">Bed Location</span>
            <span className="font-semibold text-slate-800">
              Room {room?.roomNumber} • {bed?.bedLabel}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500">Obligations Settled</span>
            <span className="font-semibold text-slate-800">
              {allocations.length}{" "}
              {allocations.length === 1 ? "cycle" : "cycles"}
            </span>
          </div>
          {unallocatedPaise > 0 && (
            <div className="flex justify-between py-1 text-indigo-700 font-semibold border-b border-slate-200/60">
              <span>Advance Credit Stored</span>
              <span>{formatPaiseToRupees(unallocatedPaise)}</span>
            </div>
          )}
          {shouldAdjustDueDate && nextDueDateOverride && (
            <div className="flex justify-between py-1 text-indigo-700 font-semibold border-b border-slate-200/60">
              <span>Next Due Date Adjusted</span>
              <span>{nextDueDateOverride}</span>
            </div>
          )}
          {payment?.referenceNote && (
            <div className="flex justify-between py-1 text-slate-600">
              <span>Reference</span>
              <span className="font-medium">{payment.referenceNote}</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onSuccess?.(completedResult)}
          className="mt-2 w-full rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-98"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Target Tenant & Dues Summary */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Collecting Rent For
          </span>
          <span className="text-sm font-bold text-slate-900 block mt-0.5">
            {tenant?.name}
          </span>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Room {room?.roomNumber} • {bed?.bedLabel}
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Outstanding
          </span>
          <span className="text-sm font-bold text-rose-600 block mt-0.5">
            {formatPaiseToRupees(totalOutstandingPaise)}
          </span>
          {overduePaise > 0 && (
            <span className="text-[10px] font-semibold text-rose-500 block">
              ({formatPaiseToRupees(overduePaise)} overdue)
            </span>
          )}
        </div>
      </div>

      {mutationError && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <div className="text-xs">
            <span className="font-bold">Payment failed: </span>
            <span>
              {mutationError.message || "Unable to record payment collection."}
            </span>
          </div>
        </div>
      )}

      {validationError && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Amount Input & Quick-Fill */}
      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor="collection-amount"
            className="text-xs font-semibold text-slate-700 block"
          >
            Amount Collected (₹) *
          </label>
          {totalOutstandingPaise > 0 && (
            <button
              type="button"
              onClick={handleQuickFillFull}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 active:scale-95"
            >
              <Sparkles className="h-3 w-3" />
              <span>
                Full Due ({formatPaiseToRupees(totalOutstandingPaise)})
              </span>
            </button>
          )}
        </div>

        <div className="relative mt-1.5">
          <IndianRupee className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            id="collection-amount"
            type="number"
            min="1"
            required
            placeholder="e.g. 8000"
            value={amountRupees}
            onChange={(e) => {
              setAmountRupees(e.target.value);
              setValidationError(null);
            }}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-semibold text-slate-900 shadow-sm transition placeholder:font-normal placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Payment Method Selector */}
      <div>
        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
          Payment Method *
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PAYMENT_METHOD_OPTIONS.map((option) => {
            const isSelected = paymentMethod === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setPaymentMethod(option.value)}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Payment Date */}
      <div>
        <label
          htmlFor="collection-date"
          className="text-xs font-semibold text-slate-700 block"
        >
          Payment Date *
        </label>
        <div className="relative mt-1.5">
          <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            id="collection-date"
            type="date"
            required
            value={paidOn}
            onChange={(e) => {
              setPaidOn(e.target.value);
              setValidationError(null);
            }}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-medium text-slate-800 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Adjust Next Due Date Section */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={shouldAdjustDueDate}
            onChange={(e) => {
              setShouldAdjustDueDate(e.target.checked);
              setValidationError(null);
            }}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-xs font-semibold text-slate-700">
            Adjust Next Due Date for this tenant
          </span>
        </label>

        {shouldAdjustDueDate && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-200/80">
            <div className="relative">
              <Clock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                id="next-due-date"
                type="date"
                required={shouldAdjustDueDate}
                value={nextDueDateOverride}
                onChange={(e) => {
                  setNextDueDateOverride(e.target.value);
                  setValidationError(null);
                }}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs font-medium text-slate-800 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Only adjusts this tenant's upcoming payment due date; billing
              interval cycles and rent amounts remain intact.
            </p>
          </div>
        )}
      </div>

      {/* Reference Note */}
      <div>
        <label
          htmlFor="reference-note"
          className="text-xs font-semibold text-slate-700 block"
        >
          Reference Note (Optional)
        </label>
        <div className="relative mt-1.5">
          <FileText className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            id="reference-note"
            type="text"
            placeholder="e.g. GPay UPI ref #987213 or Cash handover"
            value={referenceNote}
            onChange={(e) => setReferenceNote(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-medium text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-2 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 active:scale-95 disabled:pointer-events-none"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending || !amountRupees}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Recording...</span>
            </>
          ) : (
            <span>Record Payment</span>
          )}
        </button>
      </div>
    </form>
  );
}
