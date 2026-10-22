import { useState } from "react";
import { Database, RefreshCw, Check } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export function SystemInfoCard() {
  const queryClient = useQueryClient();
  const [cleared, setCleared] = useState(false);

  function handleClearCache() {
    queryClient.clear();
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
  }

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-slate-200/90 bg-white p-4 shadow-[0_4px_18px_-2px_rgba(15,23,42,0.06)] dark:border-neutral-800 dark:bg-[#16171C]">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-neutral-800">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">
            <Database className="h-4.5 w-4.5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white leading-none">
              System & Engine
            </h3>
            <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
              TanStack Query cache controller
            </p>
          </div>
        </div>

        <span className="rounded-full border border-slate-200/80 bg-slate-100/90 px-2 py-0.5 text-[9px] font-extrabold text-slate-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
          v1.0.0 Stable
        </span>
      </div>

      <div className="mt-3.5 flex items-center justify-between">
        <div>
          <span className="block text-xs font-black text-slate-800 dark:text-neutral-200">
            Client Query Cache
          </span>
          <span className="text-[10px] font-semibold text-slate-400">
            Purges cached server responses without reloading
          </span>
        </div>

        <button
          type="button"
          onClick={handleClearCache}
          className="spring-press inline-flex items-center space-x-1.5 rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:border-slate-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
        >
          {cleared ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[2.5]" />
              <span className="font-extrabold text-emerald-600">Purged</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5 text-slate-400 stroke-[2.2]" />
              <span>Purge Cache</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
