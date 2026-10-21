import { useState, useMemo } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  IndianRupee,
  Loader2,
  LogOut,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  useCheckoutTenant,
  useSettleDeposit,
} from "../data/mutations/useCheckoutTenant.js";
import { useTenantLedger } from "../data/tenants/useTenantLedger.js";
import {
  formatPaiseToRupees,
  parseRupeesToPaise,
} from "../shared/formatters.js";

function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function CheckoutTenantWorkflow({
  propertyId,
  bed,
  room,
  onSuccess,
  onCancel,
}) {
  const today = getTodayString();
  const tenant = bed?.tenant;

  const { data: ledger, isLoading: isLedgerLoading } = useTenantLedger(
    tenant?.id,
  );
  const {
    mutate: checkoutTenant,
    isPending: isCheckoutPending,
    error: checkoutError,
  } = useCheckoutTenant(propertyId);
  const {
    mutate: settleDeposit,
    isPending: isSettlePending,
    error: settleError,
  } = useSettleDeposit(propertyId);

  // Workflow steps: 'CHECKOUT' | 'DEPOSIT_SETTLEMENT' | 'COMPLETED'
  const [step, setStep] = useState("CHECKOUT");
  const [checkoutDate, setCheckoutDate] = useState(today);
  const [deductions, setDeductions] = useState([]);
  const [validationError, setValidationError] = useState(null);

  // Extract held deposit details from ledger timeline if present
  const heldDeposit = useMemo(() => {
    const timeline = ledger?.timeline || [];
    const depositItem = timeline.find(
      (event) => event.type === "DEPOSIT_RECEIVED",
    );
    if (!depositItem) return null;

    // Check if already settled
    const isSettled = timeline.some(
      (event) => event.type === "DEPOSIT_SETTLEMENT",
    );
    if (isSettled) return null;

    return {
      id: depositItem.id,
      amountPaise: depositItem.amountPaise || 0,
    };
  }, [ledger]);

  // Real-time client preview of deposit calculations (authoritative calculation occurs on server)
  const settlementPreview = useMemo(() => {
    if (!heldDeposit)
      return { deductionsTotalPaise: 0, refundPaise: 0, liabilityPaise: 0 };

    const deductionsTotalPaise = deductions.reduce(
      (sum, item) => sum + parseRupeesToPaise(item.amountRupees),
      0,
    );

    const depositAmount = heldDeposit.amountPaise;
    const refundPaise = Math.max(0, depositAmount - deductionsTotalPaise);
    const liabilityPaise = Math.max(0, deductionsTotalPaise - depositAmount);

    return {
      deductionsTotalPaise,
      refundPaise,
      liabilityPaise,
    };
  }, [heldDeposit, deductions]);

  function handleAddDeduction() {
    setDeductions((prev) => [
      ...prev,
      { id: Date.now(), reason: "", amountRupees: "" },
    ]);
  }

  function handleRemoveDeduction(id) {
    setDeductions((prev) => prev.filter((d) => d.id !== id));
  }

  function handleDeductionChange(id, field, value) {
    setDeductions((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)),
    );
    setValidationError(null);
  }

  function handleConfirmCheckout(e) {
    e.preventDefault();
    setValidationError(null);

    if (!tenant?.id) {
      setValidationError("No active tenant found.");
      return;
    }

    if (!checkoutDate) {
      setValidationError("Checkout date is required.");
      return;
    }

    checkoutTenant(
      {
        tenantId: tenant.id,
        checkoutDate,
      },
      {
        onSuccess: () => {
          if (heldDeposit && heldDeposit.amountPaise > 0) {
            setStep("DEPOSIT_SETTLEMENT");
          } else {
            setStep("COMPLETED");
          }
        },
      },
    );
  }

  function handleFinalizeSettlement(e) {
    e.preventDefault();
    setValidationError(null);

    for (const d of deductions) {
      if (!d.reason.trim()) {
        setValidationError("Each deduction line item requires a reason.");
        return;
      }
      if (parseRupeesToPaise(d.amountRupees) <= 0) {
        setValidationError(
          "Each deduction must have an amount greater than ₹0.",
        );
        return;
      }
    }

    const payloadDeductions = deductions.map((d) => ({
      reason: d.reason.trim(),
      amountPaise: parseRupeesToPaise(d.amountRupees),
    }));

    settleDeposit(
      {
        tenantId: tenant.id,
        depositId: heldDeposit.id,
        deductions: payloadDeductions,
      },
      {
        onSuccess: () => {
          setStep("COMPLETED");
        },
      },
    );
  }

  // Final Confirmation Step
  if (step === "COMPLETED") {
    return (
      <div className="flex flex-col gap-4 py-2">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-sm">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-base font-bold text-emerald-950">
            Tenant Checked Out
          </h3>
          <p className="mt-0.5 text-xs font-semibold text-emerald-700">
            Room {room?.roomNumber} • {bed?.bedLabel} is now vacant.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSuccess?.()}
          className="mt-2 w-full rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-98"
        >
          Done
        </button>
      </div>
    );
  }

  // Step 2: Deposit Settlement
  if (step === "DEPOSIT_SETTLEMENT") {
    return (
      <form onSubmit={handleFinalizeSettlement} className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/70 p-3.5">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                Security Deposit Held
              </span>
              <span className="text-sm font-bold text-indigo-950">
                {formatPaiseToRupees(heldDeposit?.amountPaise || 0)}
              </span>
            </div>
          </div>
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-800">
            Pending Settlement
          </span>
        </div>

        {settleError && (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <div className="text-xs">
              <span className="font-bold">Settlement failed: </span>
              <span>
                {settleError.message ||
                  "Unable to finalize deposit settlement."}
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

        {/* Deductions Builder */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-900">
              Deductions / Damage Charges
            </span>
            <button
              type="button"
              onClick={handleAddDeduction}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 active:scale-95"
            >
              <Plus className="h-3 w-3" />
              <span>Add Deduction</span>
            </button>
          </div>

          {deductions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center text-xs text-slate-500">
              No deductions added. Full deposit will be marked for refund.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {deductions.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Reason (e.g. Deep cleaning, key loss)"
                    value={item.reason}
                    onChange={(e) =>
                      handleDeductionChange(item.id, "reason", e.target.value)
                    }
                    className="h-9 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <div className="relative w-28 shrink-0">
                    <IndianRupee className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="Amount"
                      value={item.amountRupees}
                      onChange={(e) =>
                        handleDeductionChange(
                          item.id,
                          "amountRupees",
                          e.target.value,
                        )
                      }
                      className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-7 pr-2 text-xs font-medium text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDeduction(item.id)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 active:scale-95"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Real-time Summary Card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
          <div className="flex justify-between py-1 text-slate-600">
            <span>Total Deductions</span>
            <span className="font-semibold text-slate-900">
              {formatPaiseToRupees(settlementPreview.deductionsTotalPaise)}
            </span>
          </div>
          <div className="flex justify-between py-1 border-t border-slate-200/80 pt-1.5 font-bold">
            {settlementPreview.liabilityPaise > 0 ? (
              <>
                <span className="text-rose-600">
                  Remaining Tenant Liability
                </span>
                <span className="text-rose-600">
                  {formatPaiseToRupees(settlementPreview.liabilityPaise)}
                </span>
              </>
            ) : (
              <>
                <span className="text-emerald-700">Refund to Tenant</span>
                <span className="text-emerald-700">
                  {formatPaiseToRupees(settlementPreview.refundPaise)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-2 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => setStep("COMPLETED")}
            disabled={isSettlePending}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 active:scale-95 disabled:pointer-events-none"
          >
            Settle Later
          </button>
          <button
            type="submit"
            disabled={isSettlePending}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
          >
            {isSettlePending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Finalizing...</span>
              </>
            ) : (
              <span>Finalize Settlement</span>
            )}
          </button>
        </div>
      </form>
    );
  }

  // Step 1: Checkout Form
  const totalOutstandingPaise = tenant?.totalOutstandingPaise || 0;

  return (
    <form onSubmit={handleConfirmCheckout} className="flex flex-col gap-4">
      {/* Target Tenant Card */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Checking Out Occupant
          </span>
          <span className="text-sm font-bold text-slate-900 block mt-0.5">
            {tenant?.name}
          </span>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Room {room?.roomNumber} • {bed?.bedLabel}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
          <LogOut className="h-5 w-5" />
        </div>
      </div>

      {/* Dues Warning if any */}
      {totalOutstandingPaise > 0 && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="text-xs">
            <span className="font-bold">Pending Dues Notice: </span>
            <span>
              Tenant has {formatPaiseToRupees(totalOutstandingPaise)} in
              uncollected rent. Checkout will close future obligation
              generation, but historical dues remain on record.
            </span>
          </div>
        </div>
      )}

      {checkoutError && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <div className="text-xs">
            <span className="font-bold">Checkout failed: </span>
            <span>
              {checkoutError.message || "Unable to process checkout."}
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

      {/* Checkout Date Picker */}
      <div>
        <label
          htmlFor="checkout-date"
          className="text-xs font-semibold text-slate-700 block"
        >
          Checkout Date *
        </label>
        <div className="relative mt-1.5">
          <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            id="checkout-date"
            type="date"
            required
            value={checkoutDate}
            onChange={(e) => {
              setCheckoutDate(e.target.value);
              setValidationError(null);
            }}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-medium text-slate-800 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          Closes active assignment. Bed will become vacant starting on this
          date.
        </p>
      </div>

      {/* Actions */}
      <div className="mt-2 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isCheckoutPending}
          className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 active:scale-95 disabled:pointer-events-none"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isCheckoutPending || isLedgerLoading}
          className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 active:scale-95 disabled:opacity-50"
        >
          {isCheckoutPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Checking Out...</span>
            </>
          ) : (
            <span>Confirm Checkout</span>
          )}
        </button>
      </div>
    </form>
  );
}
