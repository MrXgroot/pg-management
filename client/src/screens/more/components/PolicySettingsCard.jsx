import { useState } from "react";
import { Calendar, ShieldAlert, Check } from "lucide-react";

export function PolicySettingsCard() {
  const [dueRule, setDueRule] = useState("JOINING_DATE");
  const [graceDays, setGraceDays] = useState("5");
  const [depositPolicy, setDepositPolicy] = useState("ONE_MONTH");
  const [savedMessage, setSavedMessage] = useState(false);

  function handleSave(e) {
    e.preventDefault();
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2500);
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Operational Policies
          </h3>
        </div>
        {savedMessage && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
            <Check className="h-3 w-3" />
            <span>Saved</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-3 pt-1">
        <div>
          <label
            htmlFor="due-rule"
            className="text-xs font-semibold text-slate-700 block"
          >
            Billing Cycle Anchor
          </label>
          <select
            id="due-rule"
            value={dueRule}
            onChange={(e) => setDueRule(e.target.value)}
            className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="JOINING_DATE">Anchor to Tenant Joining Date</option>
            <option value="FIRST_OF_MONTH">Strict 1st of Every Month</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="grace-days"
            className="text-xs font-semibold text-slate-700 block"
          >
            Overdue Grace Period (Days)
          </label>
          <input
            id="grace-days"
            type="number"
            min="0"
            max="30"
            value={graceDays}
            onChange={(e) => setGraceDays(e.target.value)}
            className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <p className="mt-1 text-[11px] text-slate-400">
            Obligations unpaid after this many days past due date receive
            overdue status.
          </p>
        </div>

        <div>
          <label
            htmlFor="deposit-terms"
            className="text-xs font-semibold text-slate-700 block"
          >
            Standard Deposit Rule
          </label>
          <select
            id="deposit-terms"
            value={depositPolicy}
            onChange={(e) => setDepositPolicy(e.target.value)}
            className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ONE_MONTH">1 Month Equivalent Rent</option>
            <option value="TWO_MONTHS">2 Months Equivalent Rent</option>
            <option value="FIXED_10000">Fixed ₹10,000</option>
          </select>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-slate-800 active:scale-95"
          >
            Save Policy Rules
          </button>
        </div>
      </form>
    </div>
  );
}
