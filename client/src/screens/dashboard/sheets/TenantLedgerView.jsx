import {
  Calendar,
  CreditCard,
  FileText,
  IndianRupee,
  Phone,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { useTenantLedger } from "../../../data/tenants/useTenantLedger.js";
import {
  formatDateDisplay,
  formatPaiseToRupees,
  formatPhone,
} from "../../../shared/formatters.js";

function TimelineIcon({ type }) {
  switch (type) {
    case "PAYMENT":
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CreditCard className="h-3.5 w-3.5" />
        </div>
      );
    case "OBLIGATION":
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <FileText className="h-3.5 w-3.5" />
        </div>
      );
    case "DEPOSIT_RECEIVED":
    case "DEPOSIT_SETTLEMENT":
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
          <ShieldCheck className="h-3.5 w-3.5" />
        </div>
      );
    case "ASSIGNMENT":
    default:
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600">
          <UserCheck className="h-3.5 w-3.5" />
        </div>
      );
  }
}

export function TenantLedgerView({ tenantId }) {
  const { data: ledger, isLoading, isError, error } = useTenantLedger(tenantId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 py-2 animate-pulse">
        <div className="h-20 w-full rounded-2xl bg-slate-200" />
        <div className="h-16 w-full rounded-2xl bg-slate-200" />
        <div className="flex flex-col gap-2 pt-2">
          <div className="h-12 w-full rounded-xl bg-slate-100" />
          <div className="h-12 w-full rounded-xl bg-slate-100" />
          <div className="h-12 w-full rounded-xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/50 py-8 text-center">
        <h3 className="text-xs font-bold text-rose-800">
          Failed to load tenant statement
        </h3>
        <p className="mt-1 text-[11px] text-rose-600">
          {error?.message || "Unable to retrieve statement history."}
        </p>
      </div>
    );
  }

  const tenant = ledger?.tenant;
  const summary = ledger?.summary;
  const timeline = ledger?.timeline || [];

  const totalOutstandingPaise = summary?.totalOutstandingPaise || 0;
  const advanceCreditPaise = summary?.advanceCreditPaise || 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Identity Banner */}
      <div className="flex items-center justify-between rounded-2xl bg-slate-900 p-4 text-white">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">{tenant?.name}</span>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
              {tenant?.status}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-slate-300">
            <a
              href={`tel:${tenant?.phone}`}
              className="inline-flex items-center gap-1 hover:text-white"
            >
              <Phone className="h-3 w-3" />
              <span>{formatPhone(tenant?.phone)}</span>
            </a>
            <span className="inline-flex items-center gap-1 text-slate-400">
              <Calendar className="h-3 w-3" />
              <span>Joined {formatDateDisplay(tenant?.joiningDate)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3-Metric Statement Summary */}
      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Total Billed
          </span>
          <span className="mt-1 text-xs font-bold text-slate-800">
            {formatPaiseToRupees(summary?.totalObligationsPaise || 0)}
          </span>
        </div>

        <div className="flex flex-col border-x border-slate-200 px-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Total Paid
          </span>
          <span className="mt-1 text-xs font-bold text-emerald-700">
            {formatPaiseToRupees(summary?.totalPaymentsPaise || 0)}
          </span>
        </div>

        <div className="flex flex-col pl-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Net Status
          </span>
          {advanceCreditPaise > 0 ? (
            <span className="mt-1 text-xs font-bold text-indigo-700">
              +{formatPaiseToRupees(advanceCreditPaise)} (Cr)
            </span>
          ) : totalOutstandingPaise > 0 ? (
            <span className="mt-1 text-xs font-bold text-rose-600">
              {formatPaiseToRupees(totalOutstandingPaise)} (Due)
            </span>
          ) : (
            <span className="mt-1 text-xs font-bold text-emerald-600">
              Settled
            </span>
          )}
        </div>
      </div>

      {/* Chronological Timeline */}
      <div className="flex flex-col">
        <span className="text-xs font-bold text-slate-900 mb-2">
          Statement Activity
        </span>

        {timeline.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 py-8 text-center text-xs text-slate-400">
            No activity records found.
          </div>
        ) : (
          <div className="relative flex flex-col gap-3 pl-3 before:absolute before:bottom-2 before:left-[1.3rem] before:top-2 before:w-0.5 before:bg-slate-200">
            {timeline.map((event) => {
              const details = event.details || {};

              return (
                <div key={event.id} className="relative flex items-start gap-3">
                  <div className="relative z-10 shrink-0">
                    <TimelineIcon type={event.type} />
                  </div>

                  <div className="flex flex-1 flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {event.type === "OBLIGATION" && (
                          <>
                            <span className="text-xs font-bold text-slate-900 block">
                              Rent Obligation
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {formatDateDisplay(details.periodStart)} –{" "}
                              {formatDateDisplay(details.periodEndExclusive)}
                            </span>
                          </>
                        )}

                        {event.type === "PAYMENT" && (
                          <>
                            <span className="text-xs font-bold text-emerald-800 block">
                              Payment Received
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Method: {details.paymentMethod}
                              {details.referenceNote
                                ? ` • ${details.referenceNote}`
                                : ""}
                            </span>
                          </>
                        )}

                        {event.type === "DEPOSIT_RECEIVED" && (
                          <>
                            <span className="text-xs font-bold text-indigo-900 block">
                              Security Deposit Collected
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Status: Held
                            </span>
                          </>
                        )}

                        {event.type === "DEPOSIT_SETTLEMENT" && (
                          <>
                            <span className="text-xs font-bold text-indigo-900 block">
                              Deposit Settlement
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Refunded:{" "}
                              {formatPaiseToRupees(details.refundPaise || 0)}
                            </span>
                          </>
                        )}

                        {event.type === "ASSIGNMENT" && (
                          <>
                            <span className="text-xs font-bold text-slate-900 block">
                              Bed Assignment
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Effective from {formatDateDisplay(event.date)}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="text-right">
                        {event.amountPaise !== undefined &&
                          event.amountPaise !== null && (
                            <span
                              className={`text-xs font-bold block ${
                                event.type === "PAYMENT"
                                  ? "text-emerald-700"
                                  : event.type === "OBLIGATION"
                                    ? "text-slate-900"
                                    : "text-indigo-900"
                              }`}
                            >
                              {event.type === "PAYMENT" ? "+" : ""}
                              {formatPaiseToRupees(event.amountPaise)}
                            </span>
                          )}
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {formatDateDisplay(event.date)}
                        </span>
                      </div>
                    </div>

                    {/* Obligation Allocation Progress */}
                    {event.type === "OBLIGATION" &&
                      details.remainingPaise !== undefined && (
                        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5 text-[10px]">
                          <span className="text-slate-500">
                            Due Date: {formatDateDisplay(details.dueDate)}
                          </span>
                          <span
                            className={`font-semibold ${
                              details.remainingPaise > 0
                                ? "text-rose-600"
                                : "text-emerald-600"
                            }`}
                          >
                            {details.remainingPaise > 0
                              ? `${formatPaiseToRupees(details.remainingPaise)} pending`
                              : "Fully Paid"}
                          </span>
                        </div>
                      )}

                    {/* Payment Advance Rollover */}
                    {event.type === "PAYMENT" &&
                      details.advanceRolloverPaise > 0 && (
                        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5 text-[10px] text-indigo-700">
                          <span>Advance Rollover</span>
                          <span className="font-semibold">
                            +{formatPaiseToRupees(details.advanceRolloverPaise)}
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
