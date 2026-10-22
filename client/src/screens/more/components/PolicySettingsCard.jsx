import { useState } from "react";
import { ShieldCheck, Calendar, Clock, Check } from "lucide-react";

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
    <div className="relative overflow-hidden rounded-[28px] border border-slate-200/90 bg-white p-4 shadow-[0_4px_18px_-2px_rgba(15,23,42,0.06)] dark:border-neutral-800 dark:bg-[#16171C]">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-neutral-800">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
            <ShieldCheck className="h-4.5 w-4.5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white leading-none">
              Billing Policies
            </h3>
            <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
              Operational rent cycle guidelines
            </p>
          </div>
        </div>

        {savedMessage && (
          <span className="inline-flex items-center space-x-1 rounded-full border border-emerald-500/25 bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <Check className="h-3 w-3 stroke-[2.5]" />
            <span>Saved</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="mt-3.5 space-y-3.5">
        {/* Billing Cycle Anchor */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Billing Cycle Anchor
          </label>
          <div className="relative">
            <select
              value={dueRule}
              onChange={(e) => setDueRule(e.target.value)}
              className="h-10 w-full appearance-none rounded-2xl border border-slate-200/90 bg-slate-50 px-3.5 pr-8 text-xs font-bold text-slate-800 shadow-xs focus:border-[#FF5E36] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5E36]/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
            >
              <option value="JOINING_DATE">
                Anchor to Tenant Joining Date (Recommended)
              </option>
              <option value="FIRST_OF_MONTH">Strict 1st of Every Month</option>
            </select>
            <Calendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        {/* Overdue Grace Days */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Overdue Grace Period
            </label>
            <span className="text-[10px] font-bold text-[#FF5E36]">
              {graceDays} Days Buffer
            </span>
          </div>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="30"
              value={graceDays}
              onChange={(e) => setGraceDays(e.target.value)}
              className="h-10 w-full rounded-2xl border border-slate-200/90 bg-slate-50 px-3.5 text-xs font-bold text-slate-800 shadow-xs focus:border-[#FF5E36] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5E36]/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
            />
            <Clock className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
          <p className="mt-1 text-[10px] font-semibold text-slate-400 dark:text-neutral-500">
            Unpaid rent flags as Overdue on the dashboard after this grace
            period.
          </p>
        </div>

        {/* Standard Deposit Rule */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Standard Deposit Rule
          </label>
          <select
            value={depositPolicy}
            onChange={(e) => setDepositPolicy(e.target.value)}
            className="h-10 w-full appearance-none rounded-2xl border border-slate-200/90 bg-slate-50 px-3.5 text-xs font-bold text-slate-800 shadow-xs focus:border-[#FF5E36] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5E36]/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
          >
            <option value="ONE_MONTH">1 Month Equivalent Rent</option>
            <option value="TWO_MONTHS">2 Months Equivalent Rent</option>
            <option value="FIXED_10000">Fixed ₹10,000 Security Deposit</option>
          </select>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="spring-press flex items-center space-x-1.5 rounded-2xl bg-slate-900 px-4 py-2 text-xs font-extrabold text-white shadow-xs dark:bg-white dark:text-slate-900"
          >
            <span>Save Rules</span>
          </button>
        </div>
      </form>
    </div>
  );
}
