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
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Database className="h-4 w-4" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            System & Cache
          </h3>
        </div>
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
          V1.0.0 Production
        </span>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-600">
        <div>
          <span className="font-semibold text-slate-800 block">
            Client Cache
          </span>
          <span className="text-[11px] text-slate-400">
            Purge TanStack Query cache without page reload
          </span>
        </div>

        <button
          type="button"
          onClick={handleClearCache}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-100 active:scale-95"
        >
          {cleared ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span>Purged</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
              <span>Purge Cache</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
